import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const serials = Array.from({ length: 20 }, (_, i) => {
    // Generate serials from QH56695921A to QH56695940A
    const num = 56695921 + i
    return `QH${num}A`
  })

  const session = await prisma.executionSession.create({
    data: {
      purchaseRequestUuid: `MOCK-${Date.now()}`,
      amountRequested: 2000,
      customerFullNameAr: 'سارة عبدالكبير عطية',
      customerFullNameEn: 'Sarah Abdulkabir Ateeyah',
      customerNid: '219940480171',
      customerPassportNo: 'AA248677',
      customerPhone: '0918282946',
      customerBirthDate: new Date('1994-03-25T00:00:00Z'),
      passportExpiryDate: new Date('2027-12-01T00:00:00Z'),
      startedByUserId: 'system',
      status: 'READY_FOR_CONFIRMATION',
      receiptStatus: 'PENDING',
      
      cashCountResult: {
        create: {
          currency: 'USD',
          totalCountedAmount: 2000,
          usdSerialNumbers: serials,
          isMatchedWithRequest: true,
          countedAt: new Date('2026-05-03T15:45:00Z'),
          denominations: {
            create: [
              {
                denomination: 100,
                notesCount: 20,
                subtotal: 2000
              }
            ]
          }
        }
      },
      transactionRecord: {
        create: {
          purchaseRequestUuid: `MOCK-TX-${Date.now()}`,
          transactionNumber: `TX-${Date.now()}`,
          currency: 'USD',
          amountForeign: 2000,
          exchangeRate: 6.3617,
          amountLocal: 12914.25,
          executedByUserId: 'system',
          status: 'COMPLETED'
        }
      },
      requestSnapshot: {
        cost: 12914.25,
        exchange_rate: 6.3617,
        accountNumber: 'LY52012001001034767000013',
        contract: {
          currency_code: 'USD'
        },
        fcms_reference: 'cmoo97k2x00001gi1qid737st'
      }
    }
  })

  console.log(`Receipt generated successfully.`)
  console.log(`You can view it at: http://localhost:3000/print/receipt/${session.id}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
