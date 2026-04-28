"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Video, Upload, X, Check, RotateCcw, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface MediaCaptureProps {
  onCapture: (files: File[]) => void
  disabled?: boolean
}

export function MediaCapture({ onCapture, disabled }: MediaCaptureProps) {
  const [mode, setMode] = useState<"none" | "camera" | "video" | "upload">("none")
  const [isRecording, setIsRecording] = useState(false)
  const [capturedMedia, setCapturedMedia] = useState<{ file: File; preview: string; type: "image" | "video" }[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // --- Start Stream ---
  const startStream = async (requestedMode: "camera" | "video") => {
    try {
      const constraints = {
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: requestedMode === "video"
      }
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
      setMode(requestedMode)
    } catch (err) {
      console.error("Camera access error:", err)
      toast.error("تعذر الوصول إلى الكاميرا. يرجى التحقق من الأذونات.")
    }
  }

  // --- Stop Stream ---
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  // --- Capture Photo ---
  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" })
            const preview = URL.createObjectURL(blob)
            setCapturedMedia(prev => [...prev, { file, preview, type: "image" }])
            toast.success("تم التقاط الصورة")
          }
        }, "image/jpeg", 0.9)
      }
    }
  }

  // --- Start/Stop Video Recording ---
  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      if (!stream) return
      chunksRef.current = []
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        const file = new File([blob], `video_${Date.now()}.webm`, { type: "video/webm" })
        const preview = URL.createObjectURL(blob)
        setCapturedMedia(prev => [...prev, { file, preview, type: "video" }])
        toast.success("تم تسجيل الفيديو")
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    }
  }

  // --- File Upload Fallback ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newMedia = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" as const : "image" as const
    }))
    setCapturedMedia(prev => [...prev, ...newMedia])
    setMode("none")
  }

  // --- Delete Captured Item ---
  const removeMedia = (index: number) => {
    setCapturedMedia(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  // --- Finish and Pass Files ---
  const handleFinish = () => {
    stopStream()
    onCapture(capturedMedia.map(m => m.file))
  }

  return (
    <div className="space-y-4">
      {/* Captured Gallery */}
      {capturedMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {capturedMedia.map((m, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden group border border-border">
              {m.type === "image" ? (
                <img src={m.preview} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <video src={m.preview} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => removeMedia(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Action Area */}
      <Card className="p-1 border-dashed border-2 flex flex-col items-center justify-center min-h-[200px] bg-muted/10">
        {mode === "none" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-muted-foreground font-medium">اختر طريقة المرفقات</p>
            <div className="flex gap-2">
              <Button onClick={() => startStream("camera")} variant="outline" size="sm" className="gap-2">
                <Camera className="w-4 h-4" /> صورة حية
              </Button>
              <Button onClick={() => startStream("video")} variant="outline" size="sm" className="gap-2">
                <Video className="w-4 h-4" /> فيديو حي
              </Button>
              <div className="relative">
                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="w-4 h-4" /> رفع ملفات
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted={mode === "camera"} className="w-full aspect-video object-cover" />
            
            {/* Shutter / Recording UI */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
              {mode === "camera" && (
                <Button onClick={takePhoto} className="w-12 h-12 rounded-full border-4 border-white bg-red-600 hover:bg-red-700 shadow-xl" />
              )}
              {mode === "video" && (
                <Button onClick={toggleRecording} className={`w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-xl transition-all ${isRecording ? "bg-red-600 animate-pulse" : "bg-black"}`}>
                   {isRecording ? <div className="w-4 h-4 bg-white rounded-sm" /> : <div className="w-4 h-4 bg-red-600 rounded-full" />}
                </Button>
              )}
              <Button variant="secondary" size="icon" className="rounded-full shadow-lg" onClick={() => { stopStream(); setMode("none") }}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs animate-pulse">
                <div className="w-2 h-2 bg-red-600 rounded-full" /> جاري التسجيل...
              </div>
            )}
          </div>
        )}
      </Card>

      {capturedMedia.length > 0 && mode === "none" && (
        <Button onClick={handleFinish} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Check className="w-4 h-4" /> تأكيد المرفقات ({capturedMedia.length})
        </Button>
      )}
    </div>
  )
}
