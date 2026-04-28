import flask
from flask import Flask, jsonify, request
import win32com.client
import pythoncom
import os
import base64
import tempfile
import uuid
import random
import time
import serial
import serial.tools.list_ports
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from the web app

class GloryGFS220Adapter:
    def __init__(self, baudrate=9600, timeout=10):
        self.baudrate = baudrate
        self.timeout = timeout
        self.connected_port = None

    def find_device(self):
        """Probes available COM ports for the Glory GFS-220."""
        ports = list(serial.tools.list_ports.comports())
        for port in ports:
            # GFS-220 usually appears as a standard USB-Serial device
            desc = port.description.lower()
            if any(x in desc for x in ["usb-to-serial", "prolific", "ftdi", "glory", "cp210"]):
                try:
                    ser = serial.Serial(port.device, self.baudrate, timeout=1)
                    ser.close()
                    self.connected_port = port.device
                    print(f"[Glory] Detected potential device on {port.device} ({port.description})")
                    return True
                except:
                    continue
        return False

    def read_count_data(self):
        """Reads and parses the data stream from Glory GFS-220."""
        # For testing/demo, if no device is found, return simulation data
        # BUT mark it as simulation
        if not self.connected_port and not self.find_device():
            print("[Glory] No physical device detected. Using simulated data for Alwaha Bank.")
            return self.get_simulation_data()

        try:
            ser = serial.Serial(self.connected_port, self.baudrate, timeout=self.timeout)
            print(f"[Glory] Reading from physical machine on {self.connected_port}...")
            
            raw_data = ""
            start_time = time.time()
            # Wait for data to arrive (machines often send data after 'Print' or 'Start' button)
            while (time.time() - start_time) < self.timeout:
                if ser.in_waiting > 0:
                    chunk = ser.read(ser.in_waiting).decode('ascii', errors='ignore')
                    raw_data += chunk
                    if "\x03" in raw_data or "TOTAL" in raw_data or "GLORY" in raw_data:
                        break
                time.sleep(0.1)
            
            ser.close()
            
            if not raw_data:
                raise Exception("Timeout: No data received from Glory machine.")

            return self.parse_glory_report(raw_data)

        except Exception as e:
            print(f"[Glory] Serial Error: {e}")
            return self.get_simulation_data() # Safety fallback for Alwaha branch

    def parse_glory_report(self, data):
        """Parses Glory standard report format."""
        result = {
            "total": 0,
            "currency": "USD",
            "denominations": [],
            "usd_serial_numbers": [],
            "source": "hardware",
            "device": "Glory GFS-220"
        }

        # Denomination lines: [Value] [Count] [Subtotal]
        # Regex for lines like: 100 10 1000
        denom_matches = re.findall(r"(\d+)\s+(\d+)\s+(\d+)", data)
        for m in denom_matches:
            val, count, sub = int(m[0]), int(m[1]), int(m[2])
            if val in [1, 2, 5, 10, 20, 50, 100]:
                result["denominations"].append({
                    "denomination": val,
                    "notesCount": count,
                    "subtotal": sub
                })
                result["total"] += sub

        # Serial Number extraction (OCR mode)
        # Look for alphanumeric codes 8-12 chars long
        serials = re.findall(r"SN[:\s]+([A-Z0-9]{8,12})", data)
        if not serials:
            # Fallback regex for generic serial-like strings in Glory output
            serials = re.findall(r"[A-Z]{2}[0-9]{8}[A-Z]{1}", data)
            
        result["usd_serial_numbers"] = list(set(serials))
        return result

    def get_simulation_data(self):
        """Dynamic simulation for development."""
        import random
        # Dynamic total between 1000 and 5000
        notes_100 = random.randint(10, 40)
        serials = [f"{random.choice(['AL','LC','KB'])}{random.randint(10000000,99999999)}A" for _ in range(5)]
        
        return {
            "total": notes_100 * 100,
            "currency": "USD",
            "denominations": [{"denomination": 100, "notes_count": notes_100, "subtotal": notes_100 * 100}],
            "usd_serial_numbers": serials,
            "source": "simulation",
            "device": "Glory GFS-220 (Simulated)"
        }

glory_adapter = GloryGFS220Adapter()

@app.route('/')
def index():
    return jsonify({
        "status": "Alwaha Hardware Agent is Running",
        "endpoints": ["/hardware/scanner/status", "/hardware/scanner/scan", "/hardware/printer/status", "/hardware/printer/print"]
    })

# WIA Constants
WIA_DEVICE_TYPE_SCANNER = 1
WIA_INTENT_IMAGE_TYPE_COLOR = 1
WIA_COMMAND_TAKE_PICTURE = "{AF933121-12AD-11D2-BB12-00C04FB68BF7}"

def get_wia_devices():
    devices = []
    try:
        pythoncom.CoInitialize()
        device_manager = win32com.client.Dispatch("WIA.DeviceManager")
        for device_info in device_manager.DeviceInfos:
            if device_info.Type == WIA_DEVICE_TYPE_SCANNER:
                devices.append({
                    "id": device_info.DeviceID,
                    "name": device_info.Properties("Name").Value,
                    "description": device_info.Properties("Description").Value
                })
    except Exception as e:
        print(f"Error enumerating WIA devices: {e}")
    finally:
        pythoncom.CoUninitialize()
    return devices

@app.route('/hardware/scanner/status', methods=['GET'])
def status():
    devices = get_wia_devices()
    connected = len(devices) > 0
    return jsonify({
        "connected": connected,
        "deviceName": devices[0]['name'] if connected else None,
        "devices": devices,
        "agent": "Active"
    })

@app.route('/hardware/scanner/devices', methods=['GET'])
def devices():
    return jsonify(get_wia_devices())

@app.route('/hardware/scanner/scan', methods=['POST'])
def scan():
    try:
        pythoncom.CoInitialize()
        device_manager = win32com.client.Dispatch("WIA.DeviceManager")
        scanner_info = None
        
        # Find the first scanner
        for info in device_manager.DeviceInfos:
            if info.Type == WIA_DEVICE_TYPE_SCANNER:
                scanner_info = info
                break
        
        if not scanner_info:
            return jsonify({"success": False, "message": "No scanner device found"}), 404
        
        # Connect to scanner
        device = scanner_info.Connect()
        
        # Set scan settings (simplified for WIA Common Dialog or direct item access)
        # Using WIA Common Dialog for best compatibility with Canon MG Series
        wia_dialog = win32com.client.Dispatch("WIA.CommonDialog")
        
        # ShowTransfer returns an ImageFile object
        image = wia_dialog.ShowAcquireImage(
            WIA_DEVICE_TYPE_SCANNER,
            WIA_INTENT_IMAGE_TYPE_COLOR,
            0, # Bias (0 = minimize size, 65536 = maximize quality)
            "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}", # Format ID for JPEG
            False, # Always select device?
            True,  # Use common UI? (Set to False for silent scan, but True is safer for debugging)
            False  # Cancel error?
        )
        
        if not image:
            return jsonify({"success": False, "message": "Scan cancelled or failed"}), 400
            
        # Save to temp file to read back as base64
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"scan_{uuid.uuid4()}.jpg")
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        image.SaveFile(temp_path)
        
        with open(temp_path, "rb") as f:
            encoded_string = base64.b64encode(f.read()).decode('utf-8')
            
        # Clean up
        os.remove(temp_path)
        
        print(f"Scan complete. Data size: {len(encoded_string)} characters.")
        
        return jsonify({
            "success": True,
            "imageData": f"data:image/jpeg;base64,{encoded_string}",
            "format": "jpg"
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        pythoncom.CoUninitialize()

@app.route('/hardware/printer/status', methods=['GET'])
def printer_status():
    try:
        import win32print
        default_printer = win32print.GetDefaultPrinter()
        return jsonify({"connected": True, "deviceName": default_printer})
    except:
        return jsonify({"connected": False, "message": "No default printer found"})

@app.route('/hardware/printer/print', methods=['POST'])
def print_receipt():
    try:
        data = request.json
        job = data.get('job', {})
        payload = job.get('data', {})
        
        import win32print
        printer_name = win32print.GetDefaultPrinter()
        
        # Format a simple text receipt
        lines = []
        lines.append("=" * 42)
        lines.append("           ALWAHA BANK - مصرف الواحة")
        lines.append("=" * 42)
        lines.append(f"Operation ID: {data.get('transactionId', 'N/A')}")
        lines.append(f"Copy: {job.get('copyType', 'CUSTOMER')}")
        lines.append("-" * 42)
        lines.append(f"Customer: {payload.get('customer', {}).get('name', 'N/A')}")
        lines.append(f"National ID: {payload.get('customer', {}).get('nationalId', 'N/A')}")
        lines.append("-" * 42)
        
        op = payload.get('operation', {})
        lines.append(f"Amount: {op.get('amount', '0')} {op.get('currency', 'USD')}")
        lines.append(f"Rate: {op.get('rate', '0.00')}")
        lines.append(f"Total LYD: {op.get('totalLYD', '0')} LYD")
        lines.append("-" * 42)
        lines.append(f"Serial: {payload.get('serialNumber', 'N/A')}")
        lines.append("=" * 42)
        lines.append("      Thank you for choosing Alwaha Bank")
        lines.append("=" * 42)
        lines.append("\n\n\n") # Extra space for cutting
        
        receipt_text = "\n".join(lines)
        
        # Send to printer using GDI (more compatible than RAW for laser/inkjet)
        try:
            import win32ui
            import win32con
            
            hdc = win32ui.CreateDC()
            hdc.CreatePrinterDC(printer_name)
            hdc.StartDoc("Alwaha Receipt")
            hdc.StartPage()
            
            # Set font
            font_data = {'name': 'Courier New', 'height': 40, 'italic': 0, 'weight': 400}
            font = win32ui.CreateFont(font_data)
            hdc.SelectObject(font)
            
            # Print lines
            y = 50
            for line in lines:
                hdc.TextOut(100, y, line)
                y += 50
                
            hdc.EndPage()
            hdc.EndDoc()
            hdc.DeleteDC()
            hJob = "GDI_JOB"
        except Exception as gdi_err:
            print(f"GDI print failed, falling back to RAW: {gdi_err}")
            # Fallback to RAW
            hPrinter = win32print.OpenPrinter(printer_name)
            try:
                hJob = win32print.StartDocPrinter(hPrinter, 1, ("Alwaha Receipt", None, "RAW"))
                win32print.StartPagePrinter(hPrinter)
                win32print.WritePrinter(hPrinter, receipt_text.encode('utf-8'))
                win32print.EndPagePrinter(hPrinter)
                win32print.EndDocPrinter(hPrinter)
            finally:
                win32print.ClosePrinter(hPrinter)
            
        return jsonify({"success": True, "jobId": str(hJob)})
    except Exception as e:
        print(f"Printing error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/hardware/list/scanners', methods=['GET'])
def list_scanners():
    return jsonify(get_wia_devices())

@app.route('/hardware/list/counters', methods=['GET'])
def list_counters():
    glory_connected = glory_adapter.connected_port is not None or glory_adapter.find_device()
    counters = []
    if glory_connected:
        counters.append({
            "id": f"GLORY-{glory_adapter.connected_port}",
            "name": "Glory GFS-220",
            "type": "COUNTER",
            "connectionInfo": {"port": glory_adapter.connected_port},
            "status": "ONLINE"
        })
    return jsonify(counters)

@app.route('/hardware/list/printers', methods=['GET'])
def list_printers():
    printers = []
    try:
        import win32print
        for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL):
            printers.append({
                "id": f"PRINTER-{p[2]}",
                "name": p[2],
                "type": "PRINTER",
                "connectionInfo": {"name": p[2]},
                "status": "ONLINE"
            })
    except:
        pass
    return jsonify(printers)

@app.route('/hardware/list', methods=['GET'])
def list_hardware():
    # Enumerate Scanners (WIA)
    scanners = get_wia_devices()
    
    # Enumerate Counters (Serial Probing)
    glory_connected = glory_adapter.connected_port is not None or glory_adapter.find_device()
    counters = []
    if glory_connected:
        counters.append({
            "id": f"GLORY-{glory_adapter.connected_port}",
            "name": "Glory GFS-220",
            "type": "COUNTER",
            "connectionInfo": {"port": glory_adapter.connected_port},
            "status": "ONLINE"
        })
    
    # Enumerate Printers (Windows Print Queue)
    printers = []
    try:
        import win32print
        for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL):
            printers.append({
                "id": f"PRINTER-{p[2]}",
                "name": p[2],
                "type": "PRINTER",
                "connectionInfo": {"name": p[2]},
                "status": "ONLINE"
            })
    except:
        pass
        
    return jsonify({
        "scanners": scanners,
        "counters": counters,
        "printers": printers
    })

@app.route('/hardware/counter/status', methods=['GET'])
def counter_status():
    device_id = request.args.get('deviceId')
    connected = glory_adapter.connected_port is not None or glory_adapter.find_device()
    
    # If a specific device is requested, check if it's the one we found
    if device_id and glory_adapter.connected_port and device_id != f"GLORY-{glory_adapter.connected_port}":
        connected = False

    return jsonify({
        "connected": connected,
        "deviceName": "Glory GFS-220",
        "port": glory_adapter.connected_port,
        "mode": "Real" if glory_adapter.connected_port else "Simulated"
    })

@app.route('/hardware/counter/read', methods=['POST'])
def counter_read():
    try:
        req_data = request.json or {}
        device_id = req_data.get('deviceId')
        
        # In a real scenario, we'd use device_id to select the correct port
        # For now, we use the singleton glory_adapter
        data = glory_adapter.read_count_data()
        if device_id:
            data["deviceId"] = device_id
            
        return jsonify({
            "success": True,
            "data": data
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    print("--- Alwaha Hardware Agent v1.1 ---")
    print("Multi-Device Support Active")
    print("Listening on http://localhost:5001")
    
    app.run(port=5001, host='0.0.0.0')
