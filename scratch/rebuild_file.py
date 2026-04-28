
import sys

filepath = r'd:\currency_web\components\execute\execute-operation.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Part 1: Lines 1 to 124 (indices 0 to 123)
part1 = lines[:124]

# New Part 2: The restored functions and state
part2 = [
    '  const [customer, setCustomer] = useState<any>(null)\n',
    '\n',
    '  const [isRecording, setIsRecording] = useState(false)\n',
    '  const [serialNumber, setSerialNumber] = useState("")\n',
    '  const [showReceipt, setShowReceipt] = useState(false)\n',
    '  const [isConfirming, setIsConfirming] = useState(false)\n',
    '\n',
    '  const goToStep = (step: number) => {\n',
    '    const params = new URLSearchParams(searchParams.toString())\n',
    '    params.set("step", step.toString())\n',
    '    router.push(`${pathname}?${params.toString()}`)\n',
    '  }\n',
    '\n',
    '  const loadData = useCallback(async () => {\n',
    '    if (!uuid || isInitializing.current) {\n',
    '      setLoading(false)\n',
    '      return\n',
    '    }\n',
    '\n',
    '    try {\n',
    '      isInitializing.current = true\n',
    '      setLoading(true)\n',
    '      const token = localStorage.getItem("alwaha_auth_token")\n',
    '      const headers = {\n',
    '        "Authorization": `Bearer ${token}`,\n',
    '        "Content-Type": "application/json"\n',
    '      }\n',
    '\n',
    '      const sessionRes = await fetch(`/api/purchase-requests/${uuid}/start-execution`, {\n',
    '        method: "POST",\n',
    '        headers,\n',
    '        body: JSON.stringify({ userId: "current-user" })\n',
    '      })\n',
    '\n',
    '      if (!sessionRes.headers.get("content-type")?.includes("application/json")) {\n',
    '        const text = await sessionRes.text()\n',
    '        console.error(`[LoadData] Non-JSON response from start-execution: ${sessionRes.status}`, text.substring(0, 200))\n',
    '        throw new Error(`Server returned ${sessionRes.status}: ${text.substring(0, 50)}...`)\n',
    '      }\n',
    '\n',
    '      const sessionData = await sessionRes.json()\n',
    '      if (!sessionRes.ok && sessionData.code !== "SESSION_ALREADY_EXISTS") {\n',
    '        throw new Error(sessionData.error || "Failed to initialize session")\n',
    '      }\n',
    '      const sessionId = sessionData.sessionId || sessionData.id\n',
    '\n',
    '      const fullSessionRes = await fetch(`/api/execution-sessions/${sessionId}?t=${Date.now()}`, { headers })\n',
    '      if (!fullSessionRes.ok) {\n',
    '        throw new Error(`Failed to fetch session details: ${fullSessionRes.status}`)\n',
    '      }\n',
    '      const fullSession = await fullSessionRes.json()\n',
    '      setSession(fullSession)\n',
    '      setRequest(fullSession.requestSnapshot)\n',
    '\n',
    '      if (fullSession.customerCode) {\n',
    '        const previewRes = await fetch(`/api/execution-sessions/${sessionId}/receipt-preview?t=${Date.now()}`, { headers })\n',
    '        if (previewRes.ok) {\n',
    '          const preview = await previewRes.json()\n',
    '          setCustomer(preview.customer)\n',
    '        }\n',
    '      }\n',
    '\n',
    '      setLoading(false)\n',
    '    } catch (err: any) {\n',
    '      console.error("Execution error:", err)\n',
    '      setError(err.message || "حدث خطأ أثناء تحميل بيانات العملية")\n',
    '      setLoading(false)\n',
    '    } finally {\n',
    '      isInitializing.current = false\n',
    '    }\n',
    '  }, [uuid, searchParams, pathname, router])\n',
    '\n',
    '  useEffect(() => {\n',
    '    loadData()\n',
    '  }, [loadData])\n',
    '\n',
    '  const handleVerifyIdentity = async (docData?: string, metadata?: any) => {\n',
    '    if (!session?.id) return\n',
    '    try {\n',
    '      const token = localStorage.getItem("alwaha_auth_token")\n',
    '      const headers = { "Authorization": `Bearer ${token}` }\n',
    '      \n',
    '      if (docData) {\n'
]

# Part 3: The rest of the file (from line 126 in the current broken version)
part3 = lines[125:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(part1 + part2 + part3)
