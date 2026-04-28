import { prisma } from "@/lib/prisma"
import { OfficialReceiptPrint } from "@/components/execute/official-receipt-print"
import { fetchCustomerFromCBS } from "@/lib/cbsApiClient"
import { serializeBigInt } from "@/lib/serialize"

export default async function PrintReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const session = await prisma.executionSession.findUnique({
    where: { id },
    include: {
      identityVerification: true,
      mediaRecords: true,
      cashCountResult: {
        include: { denominations: true },
      },
      receipt: true,
      transactionRecord: true,
    },
  })

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen font-sans">
        <h1 className="text-2xl font-bold text-gray-400">Session not found</h1>
      </div>
    )
  }

  let cbsData = null
  if (session.customerCode) {
    try {
      cbsData = await fetchCustomerFromCBS(session.customerCode)
    } catch (err) {
      console.error("Failed to fetch CBS data for print:", err)
    }
  }

  return <OfficialReceiptPrint session={serializeBigInt(session)} cbsData={cbsData} />
}
