"use client"

import React from "react"
import { OfficialReceiptPrint } from "@/components/execute/official-receipt-print"

export default function ReceiptPreviewPage() {
  // Mock session data based on user input
  const session = {
    id: "40e33049-4106-4dd7-b60e-6e06b7468c63",
    customerFullNameAr: "عبدالناصر عبدالكريم محمد الصويعي",
    customerFullNameEn: "ABDUNNASER A MOHAMED ALSEWIE",
    customerNid: "120030036751",
    customerPassportNo: "AC046896",
    customerPhone: "0941444415",
    requestSnapshot: {
      uuid: "40e33049-4106-4dd7-b60e-6e06b7468c63",
      reference: "FCPR-012-20260426-DW5N368897MM",
      amount_requested: "2000",
      cost: "12914.251",
      exchange_rate: {
        date: "2026-04-28",
        rate: 6.3617
      },
      bankAccount: {
        iban: "LY50012002001220888000016",
      },
      contract: {
        currency_code: "USD",
        bank_transfer_price: 6.3617
      },
      usd_provider_branch: {
        name: "فرع الزويتينة للخدمات الاسلامية"
      }
    },
    cashCountResult: {
      totalCountedAmount: 2000,
      usdSerialNumbers: [
        "QH56696801A", "QH56696802A", "QH56696804A", "QH56696806A", "QH56696805A",
        "QH56696808A", "QH56696807A", "QH56696809A", "QH56696810A", "QH56696811A",
        "QH56696812A", "QH56696814A", "QH56696813A", "QH56696815A", "QH56696816A",
        "QH56696818A", "QH56696817A", "QH56696819A", "QH56696820A", "QH56696821A"
      ]
    },
    transactionRecord: {
      serialNumber: "SN-2026-0503-0001",
      exchangeRate: 6.3617
    }
  }

  const cbsData = {
    branch: "فرع الزويتينة للخدمات الاسلامية",
    customerName: "عبدالناصر عبدالكريم محمد الصويعي",
    nationalId: "120030036751",
    passportNo: "AC046896",
    phoneNumber: "0941444415",
    iban: "LY50012002001220888000016"
  }

  return <OfficialReceiptPrint session={session} cbsData={cbsData} noPrint />
}
