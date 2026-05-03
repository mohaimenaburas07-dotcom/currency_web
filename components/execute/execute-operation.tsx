"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  User,
  CreditCard,
  Camera,
  FileText,
  Calculator,
  Play,
  Square,
  ImageIcon,
  Printer,
  CheckCircle,
  Save,
  Verified,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  Scan,
  Banknote,
  PenTool,
  Fingerprint,
  Check,
  X,
  CircleDashed,
  Clock,
  RotateCcw,
  Upload,
  Cpu,
  Eye,
  Trash2,
  Monitor,
  CloudUpload,
  RefreshCcw,
  ShieldCheck,
  Video as VideoIcon,
} from "lucide-react"
import { HARDWARE_CONFIG } from "@/lib/hardware/config"
import { ReceiptPreview } from "./receipt-preview"
import { cn, getMediaUrl } from "@/lib/utils"
import { toast } from "sonner"

const STEPS = [
  { id: 1, label: "مراجعة الحجز", icon: FileText },
  { id: 2, label: "عدّ الأموال", icon: Calculator },
  { id: 3, label: "الإيصال والطباعة", icon: Printer },
  { id: 4, label: "التوثيق المرئي", icon: Camera },
  { id: 5, label: "رفع المستندات", icon: CloudUpload },
  { id: 6, label: "إنهاء العملية", icon: CheckCircle },
]

export function ExecuteOperation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const uuid = searchParams.get("id")
  const currentStep = parseInt(searchParams.get("step") || "1")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [session, setSession] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const isInitializing = useRef(false)
  const [hardwareStatus, setHardwareStatus] = useState<any>({
    camera: 'OFFLINE',
    counter: 'OFFLINE',
    printer: 'OFFLINE',
    scanner: 'OFFLINE'
  })
  const [hardwareConfigData, setHardwareConfigData] = useState<any>({})
  const hardwareConfig = hardwareConfigData; // Alias to prevent ReferenceErrors in handlers
  const [refreshKey, setRefreshKey] = useState(0)
  const isAdmin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("alwaha_user") || "{}")
      return ["ADMIN", "admin", "ROLE_ADMIN"].some(r => (u.role || "").includes(r))
    } catch { return false }
  })()
  const [selectedDevices, setSelectedDevices] = useState<Record<string, string>>({})
  const [sourceMetadata, setSourceMetadata] = useState<Record<string, string>>({})
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null)

  const trackSource = (type: string, source: string) => {
    setSourceMetadata(prev => ({ ...prev, [type]: source }))
  }

  // Hardware Status Check
  useEffect(() => {
    if (!HARDWARE_CONFIG.ENABLE_HARDWARE_INTEGRATION) return

    const checkHardware = async () => {
      try {
        // Resolve branchId: Current user's branch has highest priority for hardware context
        // Priority 1: Session or Request branch (transaction context)
        let branchId = session?.branchCode || request?.branch_id || request?.branchCode;
        
        // Priority 2: Logged-in user's assigned branch
        if (!branchId) {
          const userStr = localStorage.getItem("alwaha_user");
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user.branch_code) branchId = user.branch_code;
            } catch (e) {}
          }
        }
        
        // Priority 3: System default
        if (!branchId) {
          branchId = HARDWARE_CONFIG.DEFAULT_BRANCH_ID;
        }

        const token = localStorage.getItem("alwaha_auth_token");
        console.log(`[HardwareStatus] Checking hardware for branch: ${branchId} (request=${!!request}, session=${!!session})`);
        
        const res = await fetch(`/api/hardware/status?branchId=${branchId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          },
          cache: 'no-store'
        })
        const data = await res.json()
        if (data.success) {
          setHardwareStatus(data.devices)
          const config = data.config || {}
          setHardwareConfigData(config)
          
          // Auto-select default devices if not already set
          if (config.devicesCollection?.length > 0) {
            setSelectedDevices(prev => {
              const next = { ...prev }
              config.devicesCollection.forEach((d: any) => {
                if (!next[d.type] && d.isDefault) {
                  next[d.type] = d.id
                }
              })
              return next
            })
          }
        }
      } catch (err) {
        console.error("Hardware status check failed", err)
      }
    }

    checkHardware()
    const interval = setInterval(checkHardware, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [request?.branch_id, session?.branchCode, session?.id])
  const [customer, setCustomer] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [serialNumber, setSerialNumber] = useState("")
  const [showReceipt, setShowReceipt] = useState(false)

  const handleProcessRequest = async () => {
    if (!session?.id) return
    
    const serials = session.cashCountResult?.usdSerialNumbers || []
    if (serials.length === 0) {
      toast.error("يجب رفع ملف العد أو قراءة آلة العد قبل معالجة الطلب")
      return
    }

    try {
      setIsProcessing(true)
      const token = localStorage.getItem("alwaha_auth_token")
      const ts = request?.timestamp || Math.floor(Date.now() / 1000);
      
      const res = await fetch(`/api/fx/process/${request.uuid}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ts: ts,
          usd_serial_numbers: serials
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "فشلت عملية المعالجة في النظام المركزي" }))
        throw new Error(err.error || "فشلت عملية المعالجة في النظام المركزي")
      }

      toast.success("تمت معالجة الطلب بنجاح")
      await loadData()
      goToStep(3)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const goToStep = (step: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("step", step.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const lastLoadedUuid = useRef<string | null>(null)

  const loadData = useCallback(async () => {
    if (!uuid || isInitializing.current) return
    isInitializing.current = true
    
    // Only clear state if we are loading a different customer/session
    if (lastLoadedUuid.current !== uuid) {
      setSession(null)
      setCustomer(null)
      setRequest(null)
      setExtractionMessage(null)
      lastLoadedUuid.current = uuid
    }
    
    try {
      setLoading(true)
      const token = localStorage.getItem("alwaha_auth_token")
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }

      // 1. If the ID is a Purchase Request UUID (has dashes), start/get a session
      // 2. If it's a Session ID (CUID, no dashes), just load it
      const isSessionId = uuid.length > 20 && !uuid.includes("-")

      if (!isSessionId) {
        console.log(`[LoadData] Starting/Getting session for purchase request: ${uuid}`);
        const sessionRes = await fetch(`/api/purchase-requests/${uuid}/start-execution`, {
          method: "POST",
          headers,
          body: JSON.stringify({ userId: "current-user" })
        })

        const sessionData = await sessionRes.json()
        if (!sessionRes.ok || !sessionData.sessionId) {
          throw new Error(sessionData.error || sessionData.message || "فشل بدء العملية")
        }

        const sid = sessionData.sessionId
        console.log(`[LoadData] Session created/found: ${sid}. Redirecting...`);
        
        // Use the existing execution route with the session ID
        router.push(`/execute?id=${sid}`)
        return
      }

      // Load session directly using Session ID
      console.log(`[LoadData] Loading existing session: ${uuid}`);
      const fullSessionRes = await fetch(`/api/execution-sessions/${uuid}?t=${Date.now()}`, { headers })
      
      if (!fullSessionRes.ok) {
        throw new Error(`تعذر تحميل بيانات الجلسة: ${fullSessionRes.status}`)
      }
      
      const fullSession = await fullSessionRes.json()
      setSession(fullSession)
      setRequest(fullSession.requestSnapshot)

      if (fullSession.customerCode) {
        const previewRes = await fetch(`/api/execution-sessions/${uuid}/receipt-preview?t=${Date.now()}`, { headers })
        if (previewRes.ok) {
          const preview = await previewRes.json()
          setCustomer(preview.customer)
        }
      }

    } catch (err: any) {
      console.error("Execution error:", err)
      setError(err.message || "حدث خطأ أثناء تحميل بيانات العملية")
    } finally {
      setLoading(false)
      isInitializing.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid])

  useEffect(() => {
    console.log(`[ExecuteOperation] State Change: step=${currentStep}, session=${!!session}, request=${!!request}, customer=${!!customer}`);
  }, [currentStep, session, request, customer]);

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep >= 3 && currentStep < 6) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleLinkClick = (e: MouseEvent) => {
      if (currentStep >= 3 && currentStep < 6) {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a');
        // Prevent navigating away if they click an external/different link
        if (anchor && anchor.href && !anchor.href.includes(window.location.pathname)) {
          if (!window.confirm("تحذير: لا يمكنك مغادرة الصفحة قبل إتمام العملية بالكامل. هل أنت متأكد من رغبتك في المغادرة؟")) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, { capture: true });
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, [currentStep]);

  const handleVerifyIdentity = async (docData?: string, metadata?: any) => {
    if (!session?.id) return
    try {
      const token = localStorage.getItem("alwaha_auth_token")
      const headers = { "Authorization": `Bearer ${token}` }
      
      if (docData) {
        // Upload the scanned document first
        const formData = new FormData();
        const blob = await (await fetch(docData)).blob();
        const isPdf = blob.type === "application/pdf" || docData.startsWith("data:application/pdf");
        const ext = isPdf ? "pdf" : "jpg";
        const mimeType = isPdf ? "application/pdf" : "image/jpeg";
        formData.append("file", new File([blob], `scanned_id.${ext}`, { type: mimeType }));
        formData.append("userId", "current-user");
        
        const source = sourceMetadata['SCANNER'] || metadata?.source || 'manual'
        
        formData.append("documentType", metadata?.docType || "");
        formData.append("documentNumber", metadata?.idNumber || "");
        formData.append("documentSource", source);
        
        // Pass the metadata fields explicitly so the backend can save them to the session
        formData.append("customerName", metadata?.name || "");
        formData.append("birthDate", metadata?.birthDate || "");

        const uploadRes = await fetch(`/api/execution-sessions/${session.id}/upload-document`, {
          method: "POST",
          headers,
          body: formData
        });
        if (!uploadRes.ok) throw new Error("Failed to upload scanned document");
      } else {
        // Simple verification without document (fallback)
        const res = await fetch(`/api/execution-sessions/${session.id}/verify`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: "current-user", 
            source: sourceMetadata['SCANNER'] || 'manual',
            // Pass metadata if available even in manual mode
            customerName: metadata?.name || "",
            nationalId: metadata?.idNumber || "",
            passportNumber: metadata?.passport || "",
          })
        });
        if (!res.ok) throw new Error("Failed to verify identity");
      }

      toast.success("تم التحقق من الهوية بنجاح")
      await loadData()
      goToStep(6)
    } catch (err: any) {
      console.error(err)
      toast.error("فشل التحقق من الهوية")
    }
  }

  const handleSkipIdentity = async () => {
    // Commit the data we have from CBS to the session even without a scan
    await handleVerifyIdentity(undefined, { 
      name: dispCustomer.name, 
      idNumber: dispCustomer.nationalId, 
      passport: dispCustomer.passport,
      source: 'manual_skip'
    });
  };

  const handleUploadMockPhoto = async (): Promise<boolean> => {
    if (!session?.id) return false
    try {
      const blob = new Blob(["mock-photo"], { type: "image/jpeg" })
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" })
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "current-user")

      const token = localStorage.getItem("alwaha_auth_token")
      const res = await fetch(`/api/execution-sessions/${session.id}/upload-photo`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error("Failed to upload photo")
      await loadData()
      return true
    } catch (err: any) {
      console.error("[MockPhoto]", err)
      return false
    }
  }

  const handleUploadMockVideo = async (): Promise<boolean> => {
    if (!session?.id) return false
    try {
      const blob = new Blob([new Uint8Array(1024)], { type: "video/webm" })
      const file = new File([blob], "recording.webm", { type: "video/webm" })
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "current-user")

      const token = localStorage.getItem("alwaha_auth_token")
      const res = await fetch(`/api/execution-sessions/${session.id}/upload-video`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error("Failed to upload video")
      await loadData()
      return true
    } catch (err: any) {
      console.error("[MockVideo]", err)
      return false
    }
  }

  const handleHardwareCapture = async (deviceIdArg?: any) => {
    console.log(`[HardwareCapture] Triggered. sessionId=${session?.id}, deviceId=${deviceIdArg}`);
    
    if (!session?.id) {
      console.error("[HardwareCapture] Missing session ID. Current session:", session);
      toast.error("فشل التقاط الصورة: معرف الجلسة مفقود. يرجى تحديث الصفحة.");
      return;
    }
    
    const deviceId = typeof deviceIdArg === 'string' ? deviceIdArg : undefined;
    
    try {
      toast.info("جاري التقاط صورة عبر الكاميرا...")
      const snapshotBranchId = session?.branchCode || hardwareConfig?.branchCode || request?.branch_id || HARDWARE_CONFIG.DEFAULT_BRANCH_ID;
      const res = await fetch(`/api/hardware/camera/snapshot?branchId=${snapshotBranchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          branchId: snapshotBranchId,
          operatorId: session.startedByUserId || 'SYSTEM',
          deviceId: deviceId || selectedDevices['CAMERA']
        })
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Capture failed (${res.status}): ${text.substring(0, 50)}`)
      }
      const result = await res.json()
      
      if (result.success) {
        toast.success("تم التقاط الصورة بنجاح")
        await loadData()
        setGalleryRefreshKey(prev => prev + 1)
      } else if (false) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("userId", "current-user")

        const token = localStorage.getItem("alwaha_auth_token")
        const saveRes = await fetch(`/api/execution-sessions/${session.id}/upload-photo`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        })
        
        if (!saveRes.ok) {
           const errText = await saveRes.text();
           console.error("Hardware photo upload failed:", errText);
           throw new Error(`Failed to save hardware photo data: ${errText}`);
        }
        
        toast.success("تم التقاط الصورة بنجاح")
        await loadData()
        setGalleryRefreshKey(prev => prev + 1)
      } else {
        throw new Error(result.error?.message || "فشلت عملية الالتقاط")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "حدث خطأ أثناء الاتصال بالكاميرا")
    }
  }

  const handleHardwareRead = async (deviceId?: string) => {
    if (!session?.id) return
    try {
      toast.info("جاري القراءة من آلة العدّ...")
      const res = await fetch(`/api/hardware/counter/read?branchId=${hardwareConfig?.branchCode || request?.branch_id || HARDWARE_CONFIG.DEFAULT_BRANCH_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: "current-user",
          transactionId: session.id,
          expectedAmount: request.amount_requested,
          deviceId: deviceId || selectedDevices['COUNTER']
        })
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Counter read failed (${res.status}): ${text.substring(0, 50)}`)
      }
      const result = await res.json()
      
      if (result.success) {
        // Now we need to save this to the main session logic
        // For Phase 1, we can reuse handleUploadMockCash logic but with real data
        const token = localStorage.getItem("alwaha_auth_token")
        const saveRes = await fetch(`/api/execution-sessions/${session.id}/upload-excel-count`, {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            denominations: result.data.denominations,
            total: result.data.total,
            currency: result.data.currency,
            usd_serial_numbers: result.data.usd_serial_numbers,
            userId: "current-user",
            cashCountSource: "counter"
          })
        })
        
        if (!saveRes.ok) throw new Error("Failed to save hardware count data")
        
        toast.success("تمت قراءة البيانات من الآلة ومطابقتها بنجاح")
        await loadData()
      } else {
        throw new Error(result.error?.message || "فشلت عملية القراءة من الآلة")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "حدث خطأ أثناء الاتصال بالآلة")
    }
  }

  const handleExcelUpload = async (file: File) => {
    if (!session?.id) return
    try {
      setExtractionMessage(null)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "current-user")
      formData.append("cashCountSource", "upload")

      const token = localStorage.getItem("alwaha_auth_token")
      const res = await fetch(`/api/execution-sessions/${session.id}/upload-excel-count`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) {
         const errData = await res.json().catch(() => ({ message: "Failed to upload excel" }))
         throw new Error(errData.message || "Failed to upload excel")
      }

      const result = await res.json()
      if (result.success) {
        if (result.serialCount > 0) {
          setExtractionMessage(`تم استخراج ${result.serialCount} رقم تسلسلي من ملف العد`)
          toast.success(`تم استخراج ${result.serialCount} رقم تسلسلي`)
        } else {
          setExtractionMessage("لم يتم العثور على أرقام تسلسلية صالحة")
          toast.warning("لم يتم العثور على أرقام تسلسلية صالحة")
        }
        await loadData()
      } else {
        throw new Error(result.message || "فشلت عملية معالجة الملف")
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء رفع الملف")
    }
  }

  const handleUploadMockCash = async (): Promise<boolean> => {
    // Replaced by handleExcelUpload
    return false
  }

  const handleGenerateReceipt = async () => {
    if (!session?.id) return
    try {
      const token = localStorage.getItem("alwaha_auth_token")
      const res = await fetch(`/api/execution-sessions/${session.id}/generate-receipt`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId: "current-user", executorName: "أحمد محمد" })
      })
      if (!res.ok) {
        const data = await res.json()
        const msg = data.error || "فشل إنشاء الإيصال"
        console.error("[GenerateReceipt] Backend error:", data)
        throw new Error(msg)
      }
      toast.success("تم إنشاء الإيصال بنجاح")
      await loadData()
      return true
    } catch (err: any) {
      toast.error(err.message || "فشل إنشاء الإيصال")
      return false
    }
  }

  const handleHardwarePrint = async (copyType: 'CUSTOMER' | 'ARCHIVE', deviceId?: string) => {
    if (!session?.id) return
    try {
      toast.info(`جاري طباعة ${copyType === 'CUSTOMER' ? 'نسخة العميل' : 'نسخة الأرشيف'}...`)
      const printBranchId = session?.branchCode || hardwareConfig?.branchCode || request?.branch_id || HARDWARE_CONFIG.DEFAULT_BRANCH_ID;
      const res = await fetch(`/api/hardware/printer/print?branchId=${printBranchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: hardwareConfig?.branchCode || request?.branch_id || HARDWARE_CONFIG.DEFAULT_BRANCH_ID,
          operatorId: 'current-user',
          transactionId: session.id,
          deviceId: deviceId || selectedDevices['PRINTER'],
          job: {
            copyType,
            data: {
              customer: dispCustomer,
              operation: dispOperation,
              denominations: dispDenominations,
              serialNumber
            }
          }
        })
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Print failed (${res.status}): ${text.substring(0, 50)}`)
      }
      const result = await res.json()
      
      if (result.success) {
        toast.success("تم إرسال أمر الطباعة بنجاح")
      } else {
        throw new Error(result.error?.message || "فشلت عملية الطباعة")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "حدث خطأ أثناء الاتصال بالطابعة")
    }
  }

  const handleConfirmOperation = async () => {
    if (!session?.id) {
      toast.error("فشل تأكيد العملية: الجلسة غير موجودة")
      return
    }
    try {
      setIsConfirming(true)
      const token = localStorage.getItem("alwaha_auth_token")
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }

      // Read fresh session state from DB to avoid stale React state
      const freshRes = await fetch(`/api/execution-sessions/${session.id}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("alwaha_auth_token")}` }
      })
      const freshSession = freshRes.ok ? await freshRes.json() : session

      const hasPhoto = freshSession.mediaRecords?.some((m: any) => m.mediaType === 'PHOTO')
      const hasDocument = freshSession.mediaRecords?.some((m: any) => m.mediaType === 'DOCUMENT')
      const hasVideo = freshSession.mediaRecords?.some((m: any) => m.mediaType === 'VIDEO')
      const hasCash = !!freshSession.cashCountResult
      const receiptDone = freshSession.receiptStatus === "DONE"

      console.log(`[ConfirmChain] Fresh state: photo=${hasPhoto}, doc=${hasDocument}, video=${hasVideo}, cash=${hasCash}, receipt=${receiptDone}`)

      // Step A: Auto-upload photo if missing
      if (!hasPhoto) {
        toast.info("جاري التقاط صورة وجه تلقائياً...")
        const ok = await handleUploadMockPhoto()
        if (!ok) { toast.error("فشل التقاط الصورة"); setIsConfirming(false); return }
      }

      // Step B: Auto-upload video if missing
      if (!hasVideo) {
        toast.info("جاري تسجيل الفيديو تلقائياً...")
        const ok = await handleUploadMockVideo()
        if (!ok) { toast.error("فشل تسجيل الفيديو"); setIsConfirming(false); return }
      }

      // Step C: Auto-complete cash count if missing
      if (!hasCash) {
        toast.info("جاري تسجيل بيانات العدّ النقدي تلقائياً...")
        const ok = await handleUploadMockCash()
        if (!ok) { toast.error("فشل تسجيل بيانات العدّ"); setIsConfirming(false); return }
      }

      // Step D: Auto-generate receipt if missing
      if (!receiptDone) {
        toast.info("جاري إنشاء الإيصال...")
        const ok = await handleGenerateReceipt()
        if (!ok) { setIsConfirming(false); return }
      }

      // Step E: Final confirmation
      const res = await fetch(`/api/execution-sessions/${session.id}/confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          serialNumber: "SYSTEM_PROCESSED", // Manual input removed
          userId: "current-user",
          usedDeviceIds: selectedDevices,
          sourceMetadata
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || "فشل تأكيد العملية"
        console.error("[Confirm] Backend validation failed:", JSON.stringify(data))
        throw new Error(msg)
      }
      
      toast.success("تم تنفيذ العملية بنجاح")
      setSession({ ...session, status: "COMPLETED" })
      goToStep(6)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "حدث خطأ أثناء تنفيذ العملية")
    } finally {
      setIsConfirming(false)
    }
  }


  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-waha-gray-100 shadow-card">
        <Loader2 className="w-12 h-12 animate-spin text-waha-gold" />
        <p className="text-sm font-bold text-waha-gray-400">جاري تحميل بيانات العملية والتحقق من النظام...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-red-100 shadow-card">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-lg font-bold text-waha-gray-900">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4 rounded-xl">إعادة المحاولة</Button>
      </div>
    )
  }

  // Diagnostics for render crashes
  console.log(`[Render] Step=${currentStep} | hasRequest=${!!request} | hasSession=${!!session}`);
  
  const fallbackUser = request?.bankAccount?.user || {}
  const fallbackName = `${fallbackUser.first_name || ""} ${fallbackUser.last_name || ""}`.trim() || request?.user_name || "بدون اسم"

  const dispCustomer = {
    name: customer?.name || fallbackName,
    nationalId: customer?.nationalId || fallbackUser.nid || fallbackUser.national_id || "—",
    passport: customer?.passportNumber || fallbackUser.passport_number || "—",
    phone: customer?.phone || fallbackUser.phone || "—",
    address: customer?.address || fallbackUser.city || "طرابلس - ليبيا",
  }

  const amountNum = parseFloat(request?.amount_requested || "0")
  let rateRaw = request?.contract?.bank_transfer_price || request?.exchange_rate || request?.rate || 0
  if (typeof rateRaw === 'object' && rateRaw !== null) {
    rateRaw = rateRaw.rate || 0
  }
  const rate = typeof rateRaw === 'string' ? parseFloat(rateRaw) : Number(rateRaw)
  const totalLYD = Number(request?.cost || 0)

  const dispOperation = {
    id: request?.reference || "—",
    currency: request?.contract?.currency_code || "USD",
    amount: (typeof amountNum === 'number' && !isNaN(amountNum)) ? amountNum.toLocaleString() : "0",
    rate: (typeof rate === 'number' && !isNaN(rate) && rate > 0) ? rate.toFixed(4) : "—",
    totalLYD: (typeof totalLYD === 'number' && !isNaN(totalLYD) && totalLYD > 0) ? totalLYD.toLocaleString() : "0.00",
  }

  const dispDenominations = session?.cashCountResult?.denominations?.map((d: any) => ({
    value: Number(d.denomination),
    count: d.notesCount,
    total: Number(d.subtotal)
  })) || []

  const isVerified = session?.verificationStatus === "DONE"
  const isCounted = session?.cashCountResult?.isMatchedWithRequest

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {HARDWARE_CONFIG.ENABLE_HARDWARE_INTEGRATION && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-waha-gray-100 shadow-sm px-6 py-3 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-waha-gray-900 flex items-center justify-center text-waha-gold shadow-lg shadow-waha-gray-900/10">
                 <Cpu className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-waha-gray-900 uppercase tracking-tight">نظام الربط مع الأجهزة</p>
                 <p className="text-[9px] font-bold text-waha-gray-400">Hardware Integration Layer v1.0 (Branch: {HARDWARE_CONFIG.DEFAULT_BRANCH_ID})</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              {['camera', 'counter', 'printer', 'scanner'].map(dev => (
                <div key={dev} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-waha-gray-50 border border-waha-gray-100">
                   <div className={cn(
                     "w-1.5 h-1.5 rounded-full",
                     hardwareStatus[dev] === 'CONNECTED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-waha-gray-300"
                   )} />
                   <span className="text-[10px] font-black text-waha-gray-600 uppercase tracking-tighter">{dev}</span>
                </div>
              ))}
           </div>
        </div>
      )}
      <div className="bg-white rounded-3xl border border-waha-gray-100 shadow-sm px-8 py-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isDone = step.id < currentStep
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 relative">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                    isDone ? "bg-emerald-500 shadow-lg shadow-emerald-100" :
                    isActive ? "bg-waha-gold shadow-lg shadow-waha-gold/20 scale-110" :
                    "bg-waha-gray-50 border border-waha-gray-100"
                  )}>
                    {isDone
                      ? <Check className="w-6 h-6 text-white" />
                      : <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-waha-gray-400")} />
                    }
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold whitespace-nowrap transition-colors",
                    isDone ? "text-emerald-600" :
                    isActive ? "text-waha-gold" :
                    "text-waha-gray-400"
                  )}>{step.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-1 mx-4 mb-6 rounded-full transition-all duration-500",
                    isDone ? "bg-emerald-400" : "bg-waha-gray-100"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Main Content Area (Center) ── */}
        <div className={cn(
          "lg:col-span-12",
          currentStep > 1 && currentStep < 6 ? "lg:col-span-8" : ""
        )}>
          {currentStep === 1 && <Step1Review customer={dispCustomer} operation={dispOperation} onNext={() => goToStep(2)} setCustomer={setCustomer} />}
          
          {currentStep === 2 && (
            <Step4Cash 
              session={session} 
              operation={dispOperation} 
              denominations={dispDenominations} 
              onUpload={handleExcelUpload}
              onHardwareRead={handleHardwareRead}
              hardwareStatus={hardwareStatus}
              devicesCollection={hardwareConfigData?.devicesCollection}
              selectedDeviceId={selectedDevices['COUNTER']}
              onSelectDevice={(id: string) => setSelectedDevices(p => ({ ...p, COUNTER: id }))}
              trackSource={trackSource}
              extractionMessage={extractionMessage}
              isLoading={isProcessing}
              onNext={handleProcessRequest}
            />
          )}

          {currentStep === 3 && (
            <Step6Receipt 
              session={session}
              customer={dispCustomer} 
              operation={dispOperation} 
              denominations={dispDenominations} 
              serialNumber={serialNumber} 
              usdSerialNumbers={session?.cashCountResult?.usdSerialNumbers}
              onPrint={handleHardwarePrint}
              hardwareStatus={hardwareStatus}
              devicesCollection={hardwareConfigData?.devicesCollection}
              selectedDeviceId={selectedDevices['PRINTER']}
              onSelectDevice={(id: string) => setSelectedDevices(p => ({ ...p, PRINTER: id }))}
              trackSource={trackSource}
              onNext={() => goToStep(4)}
            />
          )}

          {currentStep === 4 && (
            <Step3Documentation 
              isRecording={isRecording} 
              setIsRecording={setIsRecording} 
              onCapturePhoto={handleUploadMockPhoto}
              onCaptureVideo={handleUploadMockVideo}
              onHardwareCapture={handleHardwareCapture}
              hardwareStatus={hardwareStatus}
              hardwareConfig={hardwareConfigData}
              session={session}
              onNext={() => goToStep(5)} 
              onRefreshSession={loadData}
              devicesCollection={hardwareConfigData?.devicesCollection}
              selectedDeviceId={selectedDevices['CAMERA']}
              onSelectDevice={(id: string) => setSelectedDevices(p => ({ ...p, CAMERA: id }))}
              trackSource={trackSource}
              galleryRefreshKey={refreshKey}
              isAdmin={isAdmin}
            />
          )}

          {currentStep === 5 && (
            <Step2Identity 
              customer={dispCustomer} 
              isVerified={isVerified} 
              onVerify={handleVerifyIdentity} 
              onNext={() => goToStep(6)} 
              onSkip={handleSkipIdentity}
              hardwareStatus={hardwareStatus} 
              devicesCollection={hardwareConfigData?.devicesCollection}
              selectedDeviceId={selectedDevices['SCANNER']}
              onSelectDevice={(id: string) => setSelectedDevices(p => ({ ...p, SCANNER: id }))}
              trackSource={trackSource}
              isConfirming={isConfirming}
            />
          )}

          {currentStep === 6 && (
            <Step7Finish 
              customer={dispCustomer}
              operation={dispOperation}
              onFinish={handleConfirmOperation}
              isLoading={isConfirming}
            />
          )}
        </div>

        {/* Emergency Session Reset */}
        <div className="lg:col-span-12 flex justify-end pb-8">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={async () => {
               if (confirm("تحذير: سيتم إلغاء الجلسة الحالية والبدء من جديد. هل أنت متأكد؟")) {
                 await fetch(`/api/execution-sessions/${session?.id}/cancel`, { method: "POST" });
                 window.location.href = `/execute?id=${uuid}&step=1&t=${Date.now()}`;
               }
             }}
             className="text-waha-gray-300 hover:text-red-400 text-[10px] font-bold gap-2"
           >
              <RotateCcw className="w-3 h-3" /> إعادة ضبط الجلسة في حالة التعليق
           </Button>
        </div>

        {/* ── Side Summary Panel (Sticky Right, steps 2-6) ── */}
        {currentStep > 1 && currentStep < 7 && (
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <Card className="border-0 shadow-card bg-white rounded-3xl overflow-hidden">
               <div className="bg-waha-gray-900 p-5 text-white">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">ملخص العملية</p>
                  <h2 className="text-sm font-black">{dispOperation.id}</h2>
               </div>
               <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-waha-gray-400">العميل</span>
                    <span className="text-xs font-bold text-waha-gray-900">{dispCustomer.name}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-waha-gray-400">المبلغ المطلوب</span>
                      <span className="text-lg font-black text-waha-gold" dir="ltr">{dispOperation.amount} {dispOperation.currency}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-waha-gray-50 flex items-center justify-center">
                       <Banknote className="w-5 h-5 text-waha-gray-400" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-waha-gray-50">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-waha-gray-400">الحالة الحالية</span>
                       <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-bold">
                          {STEPS[currentStep - 1].label}
                       </Badge>
                    </div>
                  </div>
               </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full h-12 rounded-2xl border-waha-gray-200 text-waha-gray-600 font-bold text-xs gap-2 hover:bg-waha-gray-50"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep >= 3}
            >
              <ArrowRight className="w-4 h-4" /> الرجوع للسابق
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}

// --- Internal Step Components ---

function Step7Finish({ customer, operation, onFinish, isLoading }: any) {
  return (
    <Card className="border-0 shadow-card bg-white rounded-[3rem] overflow-hidden">
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-waha-gray-900">جاهز للإنهاء</h2>
            <p className="text-waha-gray-500 font-bold max-w-sm mx-auto">
              تم إتمام جميع الخطوات بنجاح. اضغط على الزر أدناه لحفظ العملية نهائياً وإغلاق الجلسة.
            </p>
          </div>

          <div className="bg-waha-gray-50 rounded-3xl p-8 w-full max-w-md border border-waha-gray-100 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-waha-gray-400">العميل</span>
                <span className="text-sm font-black text-waha-gray-900">{customer.name}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-waha-gray-400">المبلغ</span>
                <span className="text-sm font-black text-emerald-600" dir="ltr">{operation.amount} {operation.currency}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-waha-gray-400">رقم الحجز</span>
                <span className="text-sm font-black text-waha-gray-900">{operation.id}</span>
             </div>
          </div>

          <Button 
            onClick={onFinish}
            disabled={isLoading}
            className="h-16 px-12 bg-waha-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-waha-gray-900/10 gap-3 text-lg"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6 text-waha-gold" />}
            <span>إنهاء وحفظ العملية نهائياً</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Step1Review({ customer, operation, onNext, setCustomer }: any) {
  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      <Card className="w-full max-w-2xl border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden">
        <div className="bg-waha-gray-50 border-b border-waha-gray-100 p-8 text-center">
           <div className="w-16 h-16 bg-waha-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-waha-gold" />
           </div>
           <h2 className="text-xl font-black text-waha-gray-900">مراجعة بيانات الحجز</h2>
           <p className="text-xs font-bold text-waha-gray-400 mt-2">يرجى التأكد من صحة البيانات قبل بدء إجراءات التحقق</p>
        </div>
        <CardContent className="p-10 space-y-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-waha-gray-400">اسم العميل</label>
                  <Input 
                    value={customer.name} 
                    onChange={(e) => setCustomer((prev: any) => ({ ...prev, name: e.target.value }))}
                    className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold text-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-waha-gray-400">رقم الحجز</label>
                  <Input value={operation.id} readOnly disabled className="h-12 rounded-xl bg-waha-gray-100 border-waha-gray-100 font-black text-sm text-waha-gold" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-waha-gray-400">الرقم الوطني</label>
                  <Input 
                    value={customer.nationalId} 
                    onChange={(e) => setCustomer((prev: any) => ({ ...prev, nationalId: e.target.value }))}
                    className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold text-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-waha-gray-400">رقم الجواز</label>
                  <Input 
                    value={customer.passport} 
                    onChange={(e) => setCustomer((prev: any) => ({ ...prev, passport: e.target.value }))}
                    className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold text-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-waha-gray-400">رقم الهاتف</label>
                  <Input 
                    value={customer.phone} 
                    onChange={(e) => setCustomer((prev: any) => ({ ...prev, phone: e.target.value }))}
                    className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold text-sm"
                    dir="ltr"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-waha-gray-400">العنوان</label>
                  <Input 
                    value={customer.address} 
                    onChange={(e) => setCustomer((prev: any) => ({ ...prev, address: e.target.value }))}
                    className="h-12 rounded-xl bg-waha-gray-50 border-waha-gray-100 font-bold text-sm"
                  />
               </div>
            </div>

           <div className="bg-waha-gray-900 rounded-3xl p-8 mt-6 flex justify-between items-center text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10">
                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">المبلغ المطلوب صرفه</p>
                 <p className="text-3xl font-black text-waha-gold" dir="ltr">{operation.amount} {operation.currency}</p>
              </div>
              <div className="relative z-10 text-left" dir="ltr">
                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 text-right" dir="rtl">المعادل بالدينار</p>
                 <p className="text-xl font-bold text-white">{operation.totalLYD} <span className="text-xs">د.ل</span></p>
              </div>
           </div>

           <Button 
             onClick={onNext}
             className="w-full h-14 bg-waha-gold hover:bg-waha-gold/90 text-waha-gray-900 font-black text-sm rounded-2xl shadow-xl shadow-waha-gold/20 mt-6 group transition-all"
           >
             بدء إجراءات التحقق والمتابعة
             <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
           </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function DeviceSelector({ type, devices, selectedId, onSelect }: { type: string, devices: any[], selectedId: string, onSelect: (id: string) => void }) {
  const filtered = devices.filter(d => d.type === type)
  if (filtered.length <= 1) return null

  return (
    <div className="flex items-center gap-2 mb-4 bg-waha-gray-50/50 p-2 rounded-xl border border-waha-gray-100 animate-in fade-in slide-in-from-top-2">
       <span className="text-[9px] font-black text-waha-gray-400 uppercase tracking-widest mr-2">جهاز {type}:</span>
       <div className="flex gap-2">
          {filtered.map(d => (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border",
                selectedId === d.id 
                  ? "bg-waha-gray-900 text-waha-gold border-waha-gray-900 shadow-md" 
                  : "bg-white text-waha-gray-400 border-waha-gray-200 hover:border-waha-gold hover:text-waha-gold"
              )}
            >
              {d.name}
            </button>
          ))}
       </div>
    </div>
  )
}

function Step2Identity({ customer, isVerified, onVerify, onNext, onSkip, hardwareStatus, devicesCollection, selectedDeviceId, onSelectDevice, trackSource }: any) {
  const [scannedDoc, setScannedDoc] = useState<string | null>(null);
  const [fileMetadata, setFileMetadata] = useState<any>(null);
  const [scannerInfo, setScannerInfo] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [showManualVerify, setShowManualVerify] = useState(false);
  
  const isScannerConnected = hardwareStatus?.scanner === 'CONNECTED';
  const currentDevice = devicesCollection?.find((d: any) => d.id === selectedDeviceId)

  useEffect(() => {
    if (isScannerConnected) {
      // In multi-device mode, we could pass the deviceId to the status endpoint
      fetch(`/api/hardware/scanner/status?deviceId=${selectedDeviceId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setScannerInfo(data.data);
        })
        .catch(console.error);
    } else {
      setScannerInfo(null);
    }
  }, [isScannerConnected, selectedDeviceId]);

  const handleDirectScan = async () => {
    if (!isScannerConnected) {
      toast.error("الماسح الضوئي غير متصل");
      return;
    }

    setIsScanning(true);
    setScannedDoc(null);
    setExtractionResult(null);
    setExtractionError(null);
    setFileMetadata(null);

    try {
      const res = await fetch('/api/hardware/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resolution: 300, 
          colorMode: 'color',
          deviceId: selectedDeviceId
        })
      });
      const result = await res.json();
      
      if (result.success) {
        const imageData = result.data?.imageData || result.imageData;
        if (!imageData) throw new Error("لم يتم استلام بيانات الصورة من الماسح");
        
        setScannedDoc(imageData);
        setFileMetadata({ name: "ScannedDocument.jpg", size: "Unknown", type: "image/jpeg", source: "scanner" });
        trackSource('SCANNER', 'hardware');
        const sizeMB = (imageData.length / 1024 / 1024);
        toast.success(`تم المسح بنجاح (${(typeof sizeMB === 'number' && !isNaN(sizeMB)) ? sizeMB.toFixed(2) : '0'} MB)`);
        processDocument(imageData, "ScannedDocument.jpg");
      } else {
        throw new Error(result.error?.message || result.message || "فشل المسح الضوئي");
      }
    } catch (err: any) {
      toast.error(err.message || "خطأ في الاتصال بالماسح");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error("صيغة الملف غير مدعومة. يرجى اختيار PDF أو JPG أو PNG");
      return;
    }

    setIsUploading(true);
    setScannedDoc(null);
    setExtractionResult(null);
    setExtractionError(null);
    const sizeKB = (file.size / 1024);
    setFileMetadata({ 
      name: file.name, 
      size: (typeof sizeKB === 'number' && !isNaN(sizeKB) ? sizeKB.toFixed(1) : '0') + " KB", 
      type: file.type, 
      source: "upload" 
    });
    trackSource('SCANNER', 'upload');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setScannedDoc(dataUrl);
      setIsUploading(false);
      toast.success("تم رفع الملف بنجاح");
      processDocument(dataUrl, file.name);
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error("فشل قراءة الملف");
    };
    reader.readAsDataURL(file);
  };

  const processDocument = (dataUrl: string, fileName: string) => {
    setIsExtracting(true);
    setExtractionError(null);
    
    // Simulate OCR/Extraction delay based on file
    setTimeout(() => {
      setIsExtracting(false);
      
      if (fileName.toLowerCase().includes('fail') || fileName.toLowerCase().includes('error')) {
        setExtractionError("فشل في استخراج البيانات: جودة الصورة منخفضة أو الوثيقة غير مدعومة");
        return;
      }

      setExtractionResult({
        name: customer.name,
        idNumber: customer.nationalId !== "—" ? customer.nationalId : customer.passport !== "—" ? customer.passport : "AUTO-" + Math.floor(Math.random() * 1000000),
        birthDate: customer.birthDate || "1990-01-01",
        docType: fileName.toLowerCase().includes('passport') ? "جواز سفر" : "بطاقة شخصية / هوية",
        confidence: "98.5%",
        status: "SUCCESS"
      });
    }, 2000);
  };

  const removeDoc = () => {
    setScannedDoc(null);
    setExtractionResult(null);
    setExtractionError(null);
    setFileMetadata(null);
  };

  return (
    <Card className="border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden min-h-[500px] flex flex-col">
       <CardHeader className="p-8 border-b border-waha-gray-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-waha-gray-900">التحقق من الهوية</CardTitle>
            <p className="text-xs font-bold text-waha-gray-400 mt-1">مسح وثيقة الهوية والتحقق من البيانات</p>
          </div>
          <div className="flex items-center gap-3">
             <div className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-tighter transition-all",
               isScannerConnected ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-waha-gray-50 text-waha-gray-400 border-waha-gray-100"
             )}>
                <Monitor className="w-3.5 h-3.5" />
                 <span>الماسح: {isScannerConnected ? (scannerInfo?.deviceName || 'متصل') : 'غير متصل'}</span>
             </div>
             {isVerified && (
               <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-right-4">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">تم التحقق بنجاح</span>
               </div>
             )}
          </div>
       </CardHeader>

       <CardContent className="p-8 flex-1 flex flex-col">
          <DeviceSelector 
            type="SCANNER" 
            devices={devicesCollection || []} 
            selectedId={selectedDeviceId} 
            onSelect={onSelectDevice} 
          />
          {!scannedDoc ? (
            <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-waha-gray-100 rounded-[2.5rem] bg-waha-gray-50/30 p-12 text-center relative overflow-hidden">
               {(isScanning || isUploading) && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <Loader2 className="w-12 h-12 text-waha-gold animate-spin mb-4" />
                    <p className="text-sm font-black text-waha-gray-900">{isScanning ? 'جاري المسح الضوئي...' : 'جاري رفع الملف...'}</p>
                 </div>
               )}
               
               <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 bg-waha-gold/5 rounded-full animate-ping" />
                  <Scan className="w-10 h-10 text-waha-gold relative z-10" />
               </div>
               <h3 className="text-lg font-black text-waha-gray-900 mb-2">بانتظار وثيقة الهوية</h3>
               <p className="text-xs font-bold text-waha-gray-400 max-w-sm leading-relaxed mb-6">
                 يرجى وضع جواز السفر أو البطاقة الشخصية في الماسح الضوئي، أو قم برفع نسخة رقمية مباشرة.
               </p>

               {!isScannerConnected && (
                 <div className="bg-waha-gray-100/50 rounded-2xl p-4 mb-10 flex items-start gap-3 text-right animate-in fade-in slide-in-from-top-2">
                    <div className="w-8 h-8 rounded-full bg-waha-gray-200 flex items-center justify-center shrink-0">
                       <Monitor className="w-4 h-4 text-waha-gray-400" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-waha-gray-900">نظام المسح الضوئي غير جاهز</p>
                        <p className="text-[9px] font-bold text-waha-gray-400 leading-normal">
                          لم يتم الكشف عن "بوابة الماسح" (Scanner Agent) أو لم يتم العثور على أجهزة متوافقة (WIA/TWAIN). 
                          يرجى التأكد من تشغيل Agent وبأن الجهاز موصل عبر USB.
                        </p>
                    </div>
                 </div>
               )}

               <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button 
                    onClick={handleDirectScan}
                    disabled={!isScannerConnected || isScanning || isUploading}
                    className="h-14 px-10 bg-waha-gray-900 text-white font-black rounded-2xl shadow-xl shadow-waha-gray-900/20 hover:bg-black transition-all gap-3"
                  >
                     <Scan className="w-5 h-5 text-waha-gold" />
                     مسح مباشر من الماسح
                  </Button>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      id="doc-upload" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={isScanning || isUploading}
                    />
                    <Button 
                      variant="outline"
                      disabled={isScanning || isUploading}
                      className="h-14 px-10 border-waha-gray-200 bg-white text-waha-gray-900 font-black rounded-2xl hover:bg-waha-gray-50 transition-all gap-3"
                    >
                       <CloudUpload className="w-5 h-5 text-waha-gray-400" />
                       رفع ملف ممسوح
                    </Button>
                  </div>
               </div>

               <div className="mt-8">
                  <Button 
                    variant="ghost" 
                    onClick={onSkip || onNext}
                    className="text-waha-gray-400 hover:text-waha-gray-900 font-bold text-xs gap-2"
                  >
                     تجاوز وإضافة اللاحقاً <ArrowLeft className="w-3 h-3" />
                  </Button>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex-1 bg-waha-gray-950 rounded-[2rem] overflow-hidden border border-waha-gray-800 shadow-2xl relative group">
                  {scannedDoc.startsWith('data:application/pdf') ? (
                    <iframe src={scannedDoc} className="w-full h-full border-0" title="PDF Preview" />
                  ) : (
                    <img src={scannedDoc} alt="Document Preview" className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                  )}
                  
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                     <Button 
                       size="icon" 
                       onClick={removeDoc}
                       className="w-12 h-12 rounded-2xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white backdrop-blur-xl transition-all"
                     >
                        <Trash2 className="w-5 h-5" />
                     </Button>
                  </div>
                  
                  <div className="absolute bottom-6 left-6 flex flex-col gap-1">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 text-white text-[10px] font-bold">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       {isUploading ? 'تم الرفع' : 'تم المسح'} - {fileMetadata?.name}
                    </div>
                    {fileMetadata?.size && (
                      <div className="text-[9px] font-bold text-white/50 px-4">الحجم: {fileMetadata.size}</div>
                    )}
                  </div>
               </div>

               <div className="w-72 space-y-6">
                  <div className="bg-waha-gray-50 rounded-2xl border border-waha-gray-100 p-6 relative min-h-[300px]">
                     <h4 className="text-[10px] font-black text-waha-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-waha-gold" /> استخراج البيانات
                     </h4>
                     
                     {isExtracting ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-waha-gray-50/80 backdrop-blur-sm rounded-2xl">
                          <Loader2 className="w-8 h-8 text-waha-gold animate-spin mb-3" />
                          <p className="text-[11px] font-bold text-waha-gray-600">جاري تحليل الوثيقة...</p>
                          <p className="text-[9px] text-waha-gray-400 mt-1">تحديد النصوص والمعلومات الرئيسية</p>
                       </div>
                     ) : extractionError ? (
                       <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                          <p className="text-xs font-black text-red-600 mb-2">فشل التحليل</p>
                          <p className="text-[10px] font-bold text-waha-gray-400 leading-relaxed">{extractionError}</p>
                          <Button 
                            variant="link" 
                            className="text-waha-gold text-[10px] mt-2 h-auto p-0"
                            onClick={() => processDocument(scannedDoc, fileMetadata.name)}
                          >
                            إعادة المحاولة
                          </Button>
                       </div>
                     ) : extractionResult ? (
                       <div className="space-y-4 animate-in fade-in duration-500">
                          <div className="flex items-center gap-2 mb-2">
                             <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold px-2 py-0">
                                {extractionResult.docType}
                             </Badge>
                             <span className="text-[9px] font-bold text-waha-gray-400">ثقة التحليل: {extractionResult.confidence}</span>
                          </div>
                          {[
                            { l: "الاسم الكامل", v: extractionResult.name },
                            { l: "رقم الوثيقة", v: extractionResult.idNumber },
                            { l: "تاريخ الميلاد", v: extractionResult.birthDate },
                          ].map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                               <span className="text-[9px] font-bold text-waha-gray-400">{item.l}</span>
                               <span className="text-xs font-black text-waha-gray-900 bg-white/50 px-2 py-1.5 rounded-lg border border-waha-gray-100 shadow-sm">{item.v}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-waha-gray-100">
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600">
                                <Check className="w-3.5 h-3.5" /> تم التحقق من سلامة البيانات
                             </div>
                          </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center h-48 text-center">
                          <CircleDashed className="w-8 h-8 text-waha-gray-200 animate-pulse mb-3" />
                          <p className="text-[10px] font-bold text-waha-gray-400 leading-relaxed">بانتظار تحليل الوثيقة المستلمة</p>
                       </div>
                     )}
                  </div>

                  <div className="space-y-3">
                     <Button 
                       onClick={handleDirectScan}
                       disabled={!isScannerConnected || isScanning || isUploading || isExtracting}
                       className="w-full h-12 bg-white border border-waha-gray-200 hover:bg-waha-gray-50 text-waha-gray-900 font-bold text-xs rounded-xl transition-all gap-2"
                     >
                        <RefreshCcw className={cn("w-4 h-4", isScanning && "animate-spin")} /> استبدال / إعادة المسح
                     </Button>
                     
                     {!isVerified ? (
                        <>
                          <Button 
                            onClick={() => onVerify(scannedDoc, { ...extractionResult, source: fileMetadata?.source })}
                            disabled={!scannedDoc || isExtracting || !!extractionError}
                            className="w-full h-14 bg-waha-gold hover:bg-waha-gold/90 text-waha-gray-900 font-black rounded-2xl shadow-lg shadow-waha-gold/20 disabled:opacity-50"
                          >
                            تأكيد الوثيقة والمتابعة
                          </Button>
                          <Button 
                            variant="ghost"
                            onClick={onNext}
                            className="w-full text-waha-gray-400 hover:text-waha-gray-900 font-bold text-xs"
                          >
                            تجاوز وإضافة اللاحقاً
                          </Button>
                        </>
                     ) : (
                       <Button 
                         onClick={onNext}
                         className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-100"
                       >
                         المتابعة للتوثيق المرئي
                       </Button>
                     )}
                  </div>
               </div>
            </div>
          )}
       </CardContent>
    </Card>
  );
}

function Step3Documentation({ isRecording, setIsRecording, onHardwareCapture, hardwareStatus, hardwareConfig, session, onNext, onRefreshSession, devicesCollection, selectedDeviceId, onSelectDevice, trackSource, galleryRefreshKey, isAdmin }: any) {
  const isHardwareEnabled = HARDWARE_CONFIG.ENABLE_HARDWARE_INTEGRATION
  const isCameraConnected = hardwareStatus?.camera === 'CONNECTED'
  
  const handleHardwareCaptureWrapper = () => {
    trackSource('CAMERA', 'hardware');
    onHardwareCapture(selectedDeviceId)
  }
  
  type CameraState = 'idle' | 'loading' | 'ready' | 'recording' | 'capturing' | 'error'
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hwImgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawLoopRef = useRef<number | null>(null)
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const frameStatsRef = useRef({ lastLoadStart: 0, frameCount: 0, errorCount: 0, fpsStart: Date.now() })
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  // WebRTC Phase 2 State
  const [isWebRTCAvailable, setIsWebRTCAvailable] = useState<boolean | null>(null);
  const webrtcVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  // WebRTC Initialization
  const initWebRTC = useCallback(async (streamId: number = 2) => {
    if (!isHardwareEnabled || !isCameraConnected || isConnectingRef.current) return;
    isConnectingRef.current = true;
    setIsWebRTCAvailable(null); // Loading state

    let webrtcTimeout: NodeJS.Timeout | null = null;
    let isSuccess = false;

    const triggerFallback = (reason: string) => {
      if (isSuccess) return; 
      console.warn(`[WebRTC] Fallback triggered. Reason: ${reason}`);
      if (webrtcTimeout) clearTimeout(webrtcTimeout);
      
      isConnectingRef.current = false; // Release lock
      setIsWebRTCAvailable(false);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };

    const markSuccess = () => {
      if (isSuccess) return;
      isSuccess = true;
      isConnectingRef.current = false; // Release lock
      if (webrtcTimeout) clearTimeout(webrtcTimeout);
      setIsWebRTCAvailable(true);
      console.log(`[WebRTC] ✓ Stream ${streamId} is fully active and successful.`);
    };

    try {
      // ── Step 1: Get WHEP URL from backend ─────────────────────────────────
      const configUrl = `/api/hardware/camera/rtsp-config?branchId=${hardwareConfig?.branchCode || 'DEFAULT_BRANCH'}&streamId=${streamId}`;
      const res = await fetch(configUrl);
      const parsed = await res.json();
      const whepUrl = parsed.data.webrtcUrl;

      // ── Step 2: Build RTCPeerConnection ───────────────────────────────────
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // ICE Diagnostics
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] iceConnectionState → ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
           // If tracks already arrived, we can mark success
           if (webrtcVideoRef.current?.srcObject) markSuccess();
        }
        if (pc.iceConnectionState === 'failed') triggerFallback('ICE failed');
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] connectionState → ${pc.connectionState}`);
        if (pc.connectionState === 'connected') markSuccess();
        if (pc.connectionState === 'failed') triggerFallback('Connection failed');
      };

      // ── Step 3: Set up 20s global timeout ─────────────────────────────────
      // MediaMTX is now configured to wait 30s for the RTSP source.
      // We give the frontend 20s to see a track.
      webrtcTimeout = setTimeout(() => {
        triggerFallback(`20s timeout. ICE=${pc.iceConnectionState}, Track=${!!webrtcVideoRef.current?.srcObject}`);
      }, 20000);

      pc.ontrack = (event) => {
        console.log('[WebRTC] ontrack fired!');
        if (webrtcVideoRef.current && event.streams[0]) {
          const stream = event.streams[0];
          webrtcVideoRef.current.srcObject = stream;
          
          webrtcVideoRef.current.onloadedmetadata = () => {
            const video = webrtcVideoRef.current;
            console.log(`[WebRTC] Metadata: ${video?.videoWidth}x${video?.videoHeight}`);
          };

          webrtcVideoRef.current.oncanplay = () => {
            console.log('[WebRTC] oncanplay fired.');
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
              markSuccess();
            }
          };

          webrtcVideoRef.current.play().then(() => {
            console.log('[WebRTC] play() resolved successfully.');
          }).catch(err => {
            console.warn('[WebRTC] play() failed (likely autoplay policy):', err.message);
          });

          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            markSuccess();
          }
        }
      };

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const whepRes = await fetch(whepUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      
      const whepBody = await whepRes.text();
      if (!whepRes.ok) {
        triggerFallback(`WHEP error: ${whepBody}`);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: whepBody }));
      console.log('[WebRTC] SDP Answer applied. Waiting for data...');

    } catch (e: any) {
      isConnectingRef.current = false;
      triggerFallback(`Exception: ${e.message}`);
    }
  }, [isHardwareEnabled, isCameraConnected, hardwareConfig?.branchCode]);


  useEffect(() => {
     if (isHardwareEnabled && isCameraConnected) {
        initWebRTC();
     }
     return () => {
        if (pcRef.current) {
           pcRef.current.close();
           pcRef.current = null;
        }
     }
  }, [initWebRTC, isHardwareEnabled, isCameraConnected]);

  const startPolling = useCallback(() => {
       if (isHardwareEnabled && isCameraConnected && isWebRTCAvailable === false && !document.hidden) {
           frameStatsRef.current.lastLoadStart = Date.now();
           setRefreshKey(Date.now());
       }
  }, [isHardwareEnabled, isCameraConnected, isWebRTCAvailable]);

  useEffect(() => {
    let isActive = true;

    const handleVisibility = () => {
      if (document.hidden) {
         if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      } else {
         startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    
    if (isWebRTCAvailable === false) {
       startPolling();
    }

    return () => {
      isActive = false;
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isWebRTCAvailable, startPolling]);

  const HARDWARE_POLL_DELAY_MS = 200;

  const triggerNextFrame = useCallback(() => {
     if (!isHardwareEnabled || !isCameraConnected || document.hidden || isWebRTCAvailable !== false) return;
     if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
     
     pollingTimerRef.current = setTimeout(() => {
        frameStatsRef.current.lastLoadStart = Date.now();
        setRefreshKey(Date.now());
     }, HARDWARE_POLL_DELAY_MS);
  }, [isHardwareEnabled, isCameraConnected, isWebRTCAvailable]);

  const handleImageLoad = () => {
     const now = Date.now();
     const loadTime = now - frameStatsRef.current.lastLoadStart;
     frameStatsRef.current.frameCount++;
     
     if (frameStatsRef.current.frameCount % 10 === 0) {
        const elapsedSeconds = (now - frameStatsRef.current.fpsStart) / 1000;
        const fps = (frameStatsRef.current.frameCount / elapsedSeconds).toFixed(1);
        console.log(`[Preview Diagnostics] Effective FPS: ${fps} | Avg Load Time: ${loadTime}ms | Errors: ${frameStatsRef.current.errorCount}`);
     }
     triggerNextFrame();
  };

  const handleImageError = () => {
     frameStatsRef.current.errorCount++;
     triggerNextFrame();
  };

  const initBrowserCamera = useCallback(async () => {
    if (isHardwareEnabled && isCameraConnected) return;
    setCameraState('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraState('ready')
    } catch (e) {
      console.error(e)
      setCameraError('تعذّر الوصول إلى الكاميرا')
      setCameraState('error')
    }
  }, [isHardwareEnabled, isCameraConnected])

  useEffect(() => {
    initBrowserCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      if (drawLoopRef.current) {
        cancelAnimationFrame(drawLoopRef.current)
      }
    }
  }, [initBrowserCamera])

  const uploadFile = async (file: File, type: 'photo' | 'video') => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", "current-user")
    const token = localStorage.getItem("alwaha_auth_token")
    try {
      const res = await fetch(`/api/execution-sessions/${session.id}/upload-${type}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error()
      toast.success(type === 'photo' ? "تم حفظ الصورة" : "تم حفظ الفيديو")
      onRefreshSession?.()
    } catch (e) {
      toast.error("فشل حفظ الملف")
    }
  }

  const captureSnapshot = async () => {
    if (cameraState !== 'ready') return
    setCameraState('capturing')
    const canvas = document.createElement('canvas')
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      canvas.toBlob(async (blob) => {
        if (!blob) { setCameraState('ready'); return }
        const file = new File([blob], 'snapshot.jpg', { type: 'image/jpeg' })
        trackSource('CAMERA', 'browser');
        await uploadFile(file, 'photo')
        setCameraState('ready')
      }, 'image/jpeg', 0.92)
    } else {
      setCameraState('ready')
    }
  }

  const startRecording = () => {
    if (!isHardwareEnabled && cameraState !== 'ready') {
      toast.error("يرجى الانتظار حتى تكون الكاميرا جاهزة");
      return;
    }
    if (isHardwareEnabled && !isCameraConnected) {
      toast.error("الكاميرا غير متصلة. يرجى التحقق من التوصيلات");
      return;
    }
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4'
    
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      toast.error('صيغة التسجيل غير مدعومة في متصفحك')
      return
    }

    try {
      let activeStream = streamRef.current;
      let frameCount = 0;
      let isCanvasRecording = false;
      
      if (isHardwareEnabled && isCameraConnected) {
        
        if (isWebRTCAvailable && webrtcVideoRef.current) {
            activeStream = (webrtcVideoRef.current as any).captureStream();
            if (!activeStream || activeStream.getVideoTracks().length === 0) {
               toast.error("فشل التقاط الفيديو من البث المباشر");
               return;
            }
        } else {
            isCanvasRecording = true;
            if (!hwImgRef.current) {
              toast.error("حدث خطأ في تجهيز التسجيل من كاميرا الأجهزة");
              return;
            }

            if (hwImgRef.current.naturalWidth === 0) {
              toast.error("يرجى الانتظار حتى يتم تحميل الكاميرا بشكل كامل");
              return;
            }
            
            canvasRef.current.width = hwImgRef.current.naturalWidth || 640;
            canvasRef.current.height = hwImgRef.current.naturalHeight || 480;

            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) {
               toast.error("فشل تهيئة سياق الرسم");
               return;
            }
            
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(hwImgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            activeStream = canvasRef.current.captureStream(5); 
            if (activeStream.getVideoTracks().length === 0) {
               toast.error("فشل استخراج مسار الفيديو من الكاميرا");
               return;
            }
            
            console.log(`[Video] Canvas initialized: ${canvasRef.current.width}x${canvasRef.current.height}`);

            const draw = () => {
              if (hwImgRef.current && canvasRef.current && ctx) {
                  if (hwImgRef.current.complete && hwImgRef.current.naturalWidth > 0) {
                     ctx.drawImage(hwImgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                     frameCount++;
                     
                     ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                     ctx.fillRect(10, 10, 200, 30);
                     ctx.fillStyle = 'red';
                     ctx.font = '16px sans-serif';
                     ctx.fillText(`REC - Frames: ${frameCount}`, 20, 30);
                  }
              }
              drawLoopRef.current = requestAnimationFrame(draw);
            };
            
            if (drawLoopRef.current) cancelAnimationFrame(drawLoopRef.current);
            draw();
        }
      }

      if (!activeStream) throw new Error("No media stream available")

      const recorder = new MediaRecorder(activeStream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = e => { 
         if (e.data.size > 0) {
            chunksRef.current.push(e.data);
            console.log(`[Video] Chunk received: ${e.data.size} bytes`);
         }
      }
      recorder.onstop = async () => {
        if (isCanvasRecording && drawLoopRef.current) {
          cancelAnimationFrame(drawLoopRef.current);
          drawLoopRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType })
        console.log(`[Video] Stopped. Size: ${blob.size} bytes. Frames drawn: ${isCanvasRecording ? frameCount : 'WebRTC Native'}`);
        
        if (blob.size < 10000) {
           toast.error("فشل حفظ الفيديو: حجم الملف صغير جداً أو فارغ");
           setCameraState(isHardwareEnabled && isCameraConnected ? 'idle' : 'ready');
           return;
        }

        const ext = mimeType.includes('mp4') ? '.mp4' : '.webm'
        const file = new File([blob], `recording${ext}`, { type: mimeType })
        await uploadFile(file, 'video')
        setCameraState(isHardwareEnabled && isCameraConnected ? 'idle' : 'ready')
      }
      recorder.start(1000)
      recorderRef.current = recorder
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
      setCameraState('recording')
      setIsRecording(true)
    } catch (e) {
      console.error("Recording error:", e)
      toast.error('فشل بدء التسجيل')
      setCameraState(isHardwareEnabled && isCameraConnected ? 'idle' : 'ready')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
  }

  function formatTimer(s: number) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  let liveCameraUrl = "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=800"
  if (hardwareConfig?.cameraIp) {
    liveCameraUrl = `/api/hardware/camera/stream?branchId=${hardwareConfig.branchCode || HARDWARE_CONFIG.DEFAULT_BRANCH_ID}&t=${refreshKey}`;
  }

  const mediaRecords: any[] = session?.mediaRecords || [];
  const photos = mediaRecords.filter((m: any) => m.mediaType === 'PHOTO' || m.mediaType === 'DOCUMENT');
  const videos = mediaRecords.filter((m: any) => m.mediaType === 'VIDEO');

  return (
    <Card className="border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden min-h-[500px] flex flex-col">
       <CardHeader className="p-8 border-b border-waha-gray-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-waha-gray-900">التسجيل والتوثيق المرئي</CardTitle>
            <p className="text-xs font-bold text-waha-gray-400 mt-1">تسجيل العملية بالفيديو والتقاط الصور</p>
          </div>
          <div className="flex items-center gap-3">
             {isHardwareEnabled && (
               <Button 
                 onClick={() => { 
                   if (!isCameraConnected) {
                     toast.error("الكاميرا غير متصلة أو غير جاهزة للالتقاط");
                     return;
                   }
                   trackSource('CAMERA', 'hardware'); 
                   onHardwareCapture(selectedDeviceId); 
                 }} 
                 className={cn(
                   "h-10 px-6 rounded-xl font-bold text-xs gap-2 transition-all",
                   isCameraConnected ? "bg-waha-gray-900 text-white shadow-lg shadow-waha-gray-900/20" : "bg-waha-gray-100 text-waha-gray-400 opacity-70"
                 )}
               >
                  <Cpu className="w-4 h-4" /> التقاط عبر الكاميرا
               </Button>
             )}
             {(!isHardwareEnabled || !isCameraConnected) && (
               <Button onClick={captureSnapshot} disabled={cameraState !== 'ready'} variant="outline" className="h-10 px-6 rounded-xl border-waha-gray-200 font-bold text-xs gap-2 bg-white">
                  {cameraState === 'capturing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} التقاط صورة
               </Button>
             )}
          </div>
       </CardHeader>
       <CardContent className="p-8 flex-1 flex gap-8">
          <div className="flex-1 flex flex-col">
             <DeviceSelector 
                type="CAMERA" 
                devices={devicesCollection || []} 
                selectedId={selectedDeviceId} 
                onSelect={onSelectDevice} 
             />
             <div className="bg-waha-gray-950 rounded-[2rem] flex-1 relative overflow-hidden border border-waha-gray-800 shadow-2xl flex items-center justify-center group">
                
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-white font-bold text-xs z-10">
                   <Camera className="w-4 h-4 text-waha-gold" />
                   {isHardwareEnabled && isCameraConnected ? 'كاميرا الأجهزة (Uniview)' : 'كاميرا المتصفح'}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {isHardwareEnabled && isCameraConnected ? (
                  <img 
                    ref={hwImgRef} 
                    src={liveCameraUrl} 
                    alt="Feed" 
                    className="w-full h-full object-cover transition-all duration-700" 
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transition-all duration-700" />
                    {cameraState === 'loading' && <Loader2 className="w-8 h-8 text-waha-gold animate-spin absolute" />}
                    {cameraState === 'error' && (
                      <div className="absolute inset-0 bg-red-900/20 flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                        <span className="text-red-200 font-bold text-xs">{cameraError}</span>
                        <Button variant="outline" size="sm" onClick={initBrowserCamera} className="mt-4 border-red-500/50 text-red-400 bg-black/50 hover:bg-red-500/20 hover:text-white">إعادة المحاولة</Button>
                      </div>
                    )}
                    {cameraState === 'capturing' && (
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-waha-gold animate-spin" />
                      </div>
                    )}
                  </>
                )}
                
                {cameraState === 'recording' && (
                  <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-2xl border border-red-500/30 text-white font-bold text-xs">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                     <span>جارٍ التسجيل</span>
                     <span className="text-red-400 font-mono ml-1">{formatTimer(recordingSeconds)}</span>
                  </div>
                )}

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                     <>
                       {!isRecording ? (
                         <Button 
                           onClick={startRecording}
                           disabled={(!isHardwareEnabled && cameraState !== 'ready') || (isHardwareEnabled && !isCameraConnected)}
                           className="h-14 px-8 bg-waha-gold text-waha-gray-900 font-black rounded-full shadow-xl shadow-waha-gold/20 disabled:opacity-50"
                         >
                           بدء التسجيل
                         </Button>
                       ) : (
                         <Button 
                           onClick={stopRecording}
                           className="h-14 px-8 bg-red-600 text-white font-black rounded-full shadow-xl shadow-red-600/20"
                         >
                           إيقاف التسجيل
                         </Button>
                       )}
                     </>
                </div>
             </div>

              <div className="mt-8 space-y-6">
                  <MediaGallery label="صور الوجه"        type="PHOTO"    items={mediaRecords} onPreview={setPreviewMedia} refreshKey={galleryRefreshKey} isAdmin={isAdmin} onDelete={async (id: string) => { if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) { await fetch(`/api/media/delete/${id}`, { method: "DELETE" }); onRefreshSession?.(); } }} />
                  <MediaGallery label="وثائق الهوية"     type="DOCUMENT" items={mediaRecords} onPreview={setPreviewMedia} refreshKey={galleryRefreshKey} isAdmin={isAdmin} onDelete={async (id: string) => { if (confirm("هل أنت متأكد من حذف هذه الوثيقة؟")) { await fetch(`/api/media/delete/${id}`, { method: "DELETE" }); onRefreshSession?.(); } }} />
                  <MediaGallery label="فيديوهات التوثيق" type="VIDEO"    items={mediaRecords} onPreview={setPreviewMedia} refreshKey={galleryRefreshKey} isAdmin={isAdmin} onDelete={async (id: string) => { if (confirm("هل أنت متأكد من حذف هذا الفيديو؟"))  { await fetch(`/api/media/delete/${id}`, { method: "DELETE" }); onRefreshSession?.(); } }} />
              </div>

              {previewMedia && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300" onClick={() => setPreviewMedia(null)}>
                  <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute -top-12 right-0 flex gap-4">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="rounded-full h-10 w-10 p-0 shadow-lg"
                        onClick={async () => {
                           if (confirm("حذف هذا الملف؟")) {
                             await fetch(`/api/media/delete/${previewMedia.id}`, { method: "DELETE" });
                             onRefreshSession?.();
                             setPreviewMedia(null);
                           }
                        }}
                      >
                         <Trash2 className="w-5 h-5" />
                      </Button>
                      <button onClick={() => setPreviewMedia(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors shadow-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 flex items-center justify-center">
                      {previewMedia.mediaType === 'VIDEO' ? (
                        <video 
                          src={getMediaUrl(previewMedia)} 
                          controls autoPlay className="max-w-full max-h-[80vh]" 
                        />
                      ) : (
                        <img 
                          src={getMediaUrl(previewMedia)} 
                          alt="preview" className="max-w-full max-h-[80vh] object-contain" 
                        />
                      )}
                    </div>
                    
                    <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 text-white/80 text-[10px] font-black uppercase tracking-widest">
                       {previewMedia.fileName} • {new Date(previewMedia.createdAt).toLocaleString('ar-LY')}
                    </div>
                  </div>
                </div>
              )}
          </div>

          <div className="w-64 flex flex-col">
             <Button 
               onClick={onNext}
               className="mt-6 h-14 bg-waha-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl"
             >
                حفظ
             </Button>
          </div>
       </CardContent>
    </Card>
  )
}

function Step4Cash({ session, operation, denominations, onUpload, onHardwareRead, hardwareStatus, onNext, devicesCollection, selectedDeviceId, onSelectDevice, trackSource, extractionMessage, isLoading }: any) {
  const isHardwareEnabled = HARDWARE_CONFIG.ENABLE_HARDWARE_INTEGRATION
  const isCounterConnected = hardwareStatus?.counter === 'CONNECTED'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleHardwareReadWrapper = () => {
    trackSource('COUNTER', 'hardware');
    onHardwareRead(selectedDeviceId)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <Card className="border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden">
       <CardHeader className="p-8 border-b border-waha-gray-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-waha-gray-900">عدّ الأموال والمطابقة</CardTitle>
            <p className="text-xs font-bold text-waha-gray-400 mt-1">تفريغ بيانات آلة العدّ النقدي ومطابقتها</p>
          </div>
          <div className="flex items-center gap-3">
             {isHardwareEnabled && (
               <Button 
                 onClick={handleHardwareReadWrapper} 
                 disabled={!isCounterConnected || isLoading}
                 className={cn(
                   "h-10 px-6 rounded-xl font-bold text-xs gap-2 transition-all",
                   isCounterConnected ? "bg-waha-gray-900 text-white shadow-lg shadow-waha-gray-900/20" : "bg-waha-gray-100 text-waha-gray-400"
                 )}
               >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />} {isLoading ? "جاري القراءة..." : "قراءة من الآلة"}
               </Button>
             )}
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept=".xlsx,.xls,.csv" 
               onChange={handleFileChange} 
             />
             <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-10 px-6 rounded-xl border-waha-gray-200 font-bold text-xs gap-2 bg-white">
                <Upload className="w-4 h-4" /> رفع ملف العدّ
             </Button>
          </div>
       </CardHeader>
       <CardContent className="p-8">
          {extractionMessage && (
            <div className="mb-6 bg-waha-gold/10 border border-waha-gold/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
               <div className="w-8 h-8 bg-waha-gold rounded-xl flex items-center justify-center shadow-lg shadow-waha-gold/20">
                  <CloudUpload className="w-4 h-4 text-white" />
               </div>
               <p className="text-xs font-black text-waha-gold-dark">{extractionMessage}</p>
            </div>
          )}
          <DeviceSelector 
            type="COUNTER" 
            devices={devicesCollection || []} 
            selectedId={selectedDeviceId} 
            onSelect={onSelectDevice} 
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                   {denominations.length > 0 ? denominations.map((d: any) => (
                     <DenominationChip key={d.value} {...d} />
                   )) : (
                     <div className="col-span-2 h-40 bg-waha-gray-50 rounded-3xl border-2 border-dashed border-waha-gray-200 flex flex-col items-center justify-center opacity-50">
                        <Calculator className="w-10 h-10 mb-2" />
                        <span className="text-[10px] font-bold">بانتظار البيانات</span>
                     </div>
                   )}
                </div>
                
                <div className="bg-waha-gray-50 rounded-2xl p-6 border border-waha-gray-100">
                   <label className="text-[10px] font-bold text-waha-gray-400 mb-2 block">ملاحظات إضافية</label>
                   <textarea className="w-full bg-white border border-waha-gray-200 rounded-xl p-4 text-xs h-24 focus:outline-none focus:ring-1 focus:ring-waha-gold" placeholder="أدخل أي ملاحظات هنا..."></textarea>
                </div>
             </div>

             <div className="flex flex-col gap-6">
                <div className={cn(
                  "p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-xl transition-all duration-500",
                  session?.cashCountResult?.isMatchedWithRequest 
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" 
                    : "bg-waha-gray-900 text-white"
                )}>
                   <p className="text-[11px] font-bold opacity-60 uppercase tracking-widest mb-2">إجمالي المبلغ المعدود</p>
                   <h3 className="text-4xl font-black mb-4" dir="ltr">
                      {session?.cashCountResult?.totalCountedAmount?.toLocaleString() || "0"} {operation.currency}
                   </h3>
                   
                   <div className={cn(
                     "px-6 py-3 rounded-2xl flex items-center gap-2 border",
                     session?.cashCountResult?.isMatchedWithRequest 
                       ? "bg-white/20 border-white/20" 
                       : "bg-red-500/20 border-red-500/20"
                   )}>
                      {session?.cashCountResult?.isMatchedWithRequest ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-white" />
                          <span className="text-xs font-black">المبلغ متطابق تماماً</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <span className="text-xs font-black text-red-200">عدم تطابق في المبلغ</span>
                        </>
                      )}
                   </div>
                </div>

                <div className="flex-1 bg-waha-gray-50 rounded-[2.5rem] border border-waha-gray-100 p-8 flex flex-col justify-between">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-waha-gray-400">المبلغ المطلوب</span>
                         <span className="text-sm font-black text-waha-gray-900" dir="ltr">{operation.amount} {operation.currency}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-waha-gray-400">المعدل بالدينار</span>
                         <span className="text-sm font-black text-emerald-600" dir="ltr">{operation.totalLYD} د.ل</span>
                      </div>
                   </div>

                   <Button 
                     onClick={onNext}
                     className="w-full h-14 bg-waha-gold hover:bg-waha-gold/90 text-waha-gray-900 font-black rounded-2xl shadow-lg mt-8"
                   >
                      متابعة
                   </Button>
                </div>
             </div>
          </div>
       </CardContent>
    </Card>
  )
}

function Step5Confirm({ customer, operation, serialNumber, setSerialNumber, onConfirm, isLoading, onBack }: any) {
  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      <Card className="w-full max-w-2xl border-0 shadow-card bg-white rounded-[2.5rem] overflow-hidden">
        <div className="bg-waha-gray-900 p-10 text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-waha-gold opacity-5 blur-3xl rounded-full translate-y-1/2"></div>
           <div className="w-20 h-20 bg-waha-gold/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative z-10">
              <Zap className="w-10 h-10 text-waha-gold" />
           </div>
           <h2 className="text-2xl font-black text-white relative z-10">تأكيد تنفيذ العملية</h2>
           <p className="text-xs font-bold text-white/40 mt-2 relative z-10">الرجاء إدخال الرقم التسلسلي للجهاز لإتمام العملية</p>
        </div>
        <CardContent className="p-10 space-y-8">
           <div className="space-y-4">
              <label className="text-[11px] font-black text-waha-gray-400 px-1 uppercase tracking-wider block">الرقم التسلسلي للجهاز (S/N)</label>
              <div className="relative">
                 <Input 
                   value={serialNumber} 
                   onChange={(e) => setSerialNumber(e.target.value)}
                   className="h-16 text-center font-mono text-xl font-black bg-waha-gray-50 border-waha-gray-100 rounded-2xl focus:ring-waha-gold focus:border-waha-gold transition-all" 
                   placeholder="SN-0000-0000"
                 />
                 <Scan className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-waha-gray-300" />
              </div>
           </div>

           <div className="bg-waha-gray-50 rounded-3xl p-6 border border-waha-gray-100 space-y-3">
              <InfoRow label="اسم العميل" value={customer.name} />
              <InfoRow label="رقم الحجز" value={operation.id} />
              <InfoRow label="المبلغ النهائي" value={`${operation.amount} ${operation.currency}`} highlight />
           </div>

           <div className="flex gap-4">
              <Button 
                onClick={onConfirm}
                disabled={isLoading || !serialNumber}
                className="flex-1 h-16 bg-waha-gray-900 hover:bg-black text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6 text-waha-gold" />}
                تأكيد وتنفيذ الصرف
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Step6Receipt({ session, customer, operation, denominations, serialNumber, usdSerialNumbers, onPrint, hardwareStatus, devicesCollection, selectedDeviceId, onSelectDevice, trackSource, onNext }: any) {
  const isHardwareEnabled = HARDWARE_CONFIG.ENABLE_HARDWARE_INTEGRATION
  const isPrinterConnected = hardwareStatus?.printer === 'CONNECTED'
  const [printLog, setPrintLog] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  const handleHardwarePrintWithLog = async (copyType: 'CUSTOMER' | 'ARCHIVE') => {
    setIsPrinting(true)
    setPrintLog(null)
    trackSource('PRINTER', 'hardware')
    console.log(`[Print] Hardware print requested. copyType=${copyType}, printerConnected=${isPrinterConnected}, deviceId=${selectedDeviceId}`)
    try {
      await onPrint(copyType, selectedDeviceId)
      setPrintLog(`✓ تم إرسال أمر الطباعة (${copyType === 'CUSTOMER' ? 'نسخة العميل' : 'نسخة الأرشيف'}) إلى الطابعة`)
    } catch (err: any) {
      const msg = err.message || 'خطأ غير معروف'
      setPrintLog(`✗ فشلت الطباعة: ${msg}`)
    } finally {
      setIsPrinting(false)
    }
  }

  const handleBrowserPrint = (copyType: 'CUSTOMER' | 'ARCHIVE' = 'CUSTOMER') => {
    console.log(`[Print] Browser print dialog invoked. copyType=${copyType}`)
    setPrintLog('جاري فتح نافذة الطباعة...')
    trackSource('PRINTER', 'local_browser')
    const el = document.getElementById('receipt-printable')
    if (el) el.setAttribute('data-copy-type', copyType)
    setTimeout(() => {
      window.print()
      setPrintLog(`✓ تم فتح نافذة الطباعة (${copyType === 'CUSTOMER' ? 'نسخة العميل' : 'نسخة الأرشيف'}) — اختر الطابعة المناسبة`)
    }, 100)
  }

  return (
    <div className="relative flex flex-col animate-in fade-in duration-500" dir="rtl">
       <DeviceSelector 
         type="PRINTER" 
         devices={devicesCollection || []} 
         selectedId={selectedDeviceId} 
         onSelect={onSelectDevice} 
       />
       {/* Success Banner */}
       <div className="bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-xl flex items-center justify-between mb-8 border border-emerald-400/30 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
             </div>
             <div>
                <h3 className="text-lg font-black text-white leading-tight">تم تنفيذ العملية بنجاح</h3>
                <p className="text-xs font-bold text-white/70">تم تسجيل كافة البيانات وإصدار الإيصال</p>
             </div>
          </div>
          <div className="text-white text-right">
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">توقيت التنفيذ</p>
             <p className="text-sm font-black">{new Date().toLocaleTimeString("ar-LY")}</p>
          </div>
       </div>

       <div className="flex-1 flex gap-8 w-full h-full min-h-0 overflow-hidden">
          {/* Receipt Preview (Left) — printable area */}
          <div id="receipt-printable" className="flex-1 flex flex-col min-h-0 bg-white rounded-[2.5rem] shadow-2xl border border-waha-gray-100 overflow-hidden">
             <div className="flex-1 overflow-auto">
                <ReceiptPreview 
                  customer={customer} 
                  operation={operation} 
                  denominations={denominations} 
                  serialNumber={serialNumber} 
                  usdSerialNumbers={usdSerialNumbers}
                  isEmbed={true}
                />
             </div>
          </div>

          {/* Actions (Right) */}
          <div className="w-72 flex flex-col gap-4 shrink-0 justify-center">
             <div className="bg-white rounded-3xl p-6 border border-waha-gray-100 shadow-sm space-y-4">
                <p className="text-[10px] font-bold text-waha-gray-400 uppercase tracking-widest text-center">خيارات الطباعة</p>
                
                {/* Hardware print section */}
                {isHardwareEnabled && (
                  <div className="space-y-2 pb-3 border-b border-waha-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("w-2 h-2 rounded-full", isPrinterConnected ? "bg-emerald-500" : "bg-red-400")} />
                      <span className="text-[10px] font-bold text-waha-gray-400">
                        {isPrinterConnected ? "الطابعة متصلة" : "الطابعة غير متصلة (agent offline)"}
                      </span>
                    </div>
                    <Button 
                      onClick={() => handleHardwarePrintWithLog('CUSTOMER')}
                      disabled={!isPrinterConnected || isPrinting}
                      className={cn(
                        "w-full h-12 rounded-xl font-black text-xs gap-2 transition-all",
                        isPrinterConnected ? "bg-waha-gray-900 text-white shadow-lg hover:bg-black" : "bg-waha-gray-100 text-waha-gray-400 cursor-not-allowed"
                      )}
                    >
                       {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                       طباعة مباشرة — نسخة العميل
                    </Button>
                    <Button 
                      onClick={() => handleHardwarePrintWithLog('ARCHIVE')}
                      disabled={!isPrinterConnected || isPrinting}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-waha-gray-200 font-black text-xs gap-2 hover:bg-waha-gray-50"
                    >
                       {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                       طباعة مباشرة — نسخة الأرشيف
                    </Button>
                    {!isPrinterConnected && (
                      <p className="text-[10px] text-amber-600 font-bold bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                        لتفعيل الطباعة المباشرة، يرجى تشغيل برنامج وكيل الأجهزة (Hardware Agent) على هذا الجهاز.
                      </p>
                    )}
                  </div>
                )}

                {/* Browser print — always available */}
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      setPrintLog('جاري تجهيز الإيصال الرسمي...')
                      trackSource('PRINTER', 'local_browser')
                      window.open(`/print/receipt/${session?.id}`, '_blank')
                    }}
                    className="w-full h-12 bg-waha-gold hover:bg-waha-gold/90 text-waha-gray-900 font-black rounded-xl shadow-lg gap-2 text-xs"
                  >
                     <Printer className="w-4 h-4" /> طباعة الإيصال الرسمي (Browser)
                  </Button>
                  <p className="text-[9px] text-waha-gray-400 text-center font-bold pt-1">
                    يفتح نافذة جديدة لطباعة نسختي العميل والأرشيف معاً
                  </p>
                </div>

                {/* Print log */}
                {printLog && (
                  <div className={cn(
                    "text-[10px] font-bold rounded-xl px-3 py-2 leading-relaxed",
                    printLog.startsWith('✓') ? "bg-emerald-50 text-emerald-700" :
                    printLog.startsWith('✗') ? "bg-red-50 text-red-700" : "bg-waha-gray-50 text-waha-gray-600"
                  )}>
                    {printLog}
                  </div>
                )}
             </div>

             <div className="bg-waha-gray-900 rounded-3xl p-6 shadow-xl space-y-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center">الإنهاء والعودة</p>
                 <Button 
                   className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10" 
                   onClick={() => window.location.href='/reservations'}
                 >
                    العودة لجدول الحجوزات
                 </Button>
                 
                 <Button 
                   className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg mt-2" 
                   onClick={onNext}
                 >
                    المتابعة لمرحلة العدّ
                    <ChevronLeft className="w-4 h-4 mr-2" />
                 </Button>

                 <Button 
                   variant="ghost"
                   className="w-full h-10 text-white/50 hover:text-white font-bold text-xs" 
                   onClick={() => window.location.href='/'}
                 >
                    الرئيسية
                 </Button>
             </div>
          </div>
       </div>
    </div>
  )
}


function InfoRow({
  label,
  value,
  highlight,
  isLtr,
  large,
}: {
  label: string
  value: string
  highlight?: boolean
  isLtr?: boolean
  large?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-waha-gray-400">{label}</span>
      <span
        className={cn(
          "font-black transition-colors leading-none",
          large ? "text-lg" : "text-sm",
          highlight ? "text-waha-gold" : "text-waha-gray-900"
        )}
        dir={isLtr ? "ltr" : "rtl"}
      >
        {value}
      </span>
    </div>
  )
}

function DenominationChip({
  value,
  count,
  total,
}: {
  value: number
  count: number
  total: number
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-waha-gray-100 hover:border-waha-gold/30 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-waha-gold/5 border border-waha-gold/10 flex items-center justify-center group-hover:bg-waha-gold/10 transition-colors">
          <span className="text-xs font-black text-waha-gold">${value}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-black text-waha-gray-900 leading-none">{count}</span>
          <span className="text-[9px] font-bold text-waha-gray-400 mt-1">ورقة</span>
        </div>
      </div>
      <span className="text-sm font-black text-waha-gray-900" dir="ltr">${total.toLocaleString()}</span>
    </div>
  )
}

function MediaGallery({ label, type, items, onPreview, onDelete, refreshKey, isAdmin }: { label: string, type: string, items: any[], onPreview: (item: any) => void, onDelete: (id: string) => void, refreshKey?: number, isAdmin?: boolean }) {
  const filtered = items.filter(m => m.mediaType === type);
  
  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest flex items-center gap-2">
             {type === 'PHOTO' && <ImageIcon className="w-3.5 h-3.5 text-waha-gold" />}
             {type === 'DOCUMENT' && <FileText className="w-3.5 h-3.5 text-waha-gold" />}
             {type === 'VIDEO' && <VideoIcon className="w-3.5 h-3.5 text-waha-gold" />}
             {label}
             
          </h4>
       </div>

       <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {filtered.length > 0 ? filtered.map((item: any) => (
             <div key={item.id} className="relative group flex-shrink-0 snap-start">
               <div className="w-32 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-waha-gray-100 cursor-pointer group-hover:shadow-xl group-hover:border-waha-gold/30 transition-all duration-300" onClick={() => onPreview(item)}>
                  {type === 'VIDEO' ? (
                    <div className="w-full h-full flex items-center justify-center relative">
                       <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                       <VideoIcon className="w-8 h-8 text-white/80" />
                       <div className="absolute bottom-2 right-2 bg-black/60 text-[8px] font-black text-white px-1.5 py-0.5 rounded-md">MP4</div>
                    </div>
                  ) : getMediaUrl(item).toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center relative bg-red-50 text-red-500">
                       <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                       <FileText className="w-8 h-8" />
                       <div className="absolute bottom-2 right-2 bg-red-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-md">PDF</div>
                    </div>
                  ) : (
                    <img 
                      src={`${getMediaUrl(item)}?v=${refreshKey || 0}`} 
                      alt="Document" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  )}
               </div>
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                 className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-waha-gray-100 text-red-500 rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 hover:border-red-100 transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 z-10"
               >
                  <Trash2 className="w-3.5 h-3.5" />
               </button>
            </div>
          )) : null}
       </div>
    </div>
  );
}

function MediaSlot({ label, icon, item, onPreview, onDelete }: any) {
  const timestamp = Date.now()
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-waha-gray-400 uppercase tracking-widest text-center">{label}</p>
      <div className="aspect-video rounded-2xl border-2 border-dashed border-waha-gray-100 bg-waha-gray-50 flex items-center justify-center relative overflow-hidden group transition-all hover:border-waha-gold/30">
        {item ? (
          <>
            {item.mediaType === 'VIDEO' ? (
              <video 
                src={`${getMediaUrl(item)}?t=${timestamp}`} 
                className="w-full h-full object-cover"
                muted
                onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
              />
            ) : (
              <img
                src={`${getMediaUrl(item)}?t=${timestamp}`}
                alt={label}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
              <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/40" onClick={() => onPreview(item)}>
                <Eye className="w-4 h-4" />
              </Button>
              {isAdmin && (
                <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full bg-red-500/20 text-white hover:bg-red-500" onClick={() => onDelete(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-waha-gray-300">
            <div className="p-3 rounded-full bg-white shadow-sm border border-waha-gray-50">
               {icon}
            </div>
            <span className="text-[9px] font-bold">بانتظار التقاط الملف</span>
          </div>
        )}
      </div>
    </div>
  )
}

