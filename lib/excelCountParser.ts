// lib/excelCountParser.ts
// Parses Excel files output by the money counting machine.
// Uses the 'xlsx' npm package (Apache POI equivalent for Node.js).

import * as XLSX from "xlsx"

export interface DenominationRow {
  denomination: number
  notesCount: number
  subtotal: number
}

export interface CountingResult {
  denominations: DenominationRow[]
  totalCountedAmount: number
  currency: string
  usdSerialNumbers: string[]
}

// Column name candidates — we try multiple variants since different
// machine models output different column headers.
const DENOM_COLS  = ["Denomination", "Denom", "فئة", "القيمة"]
const COUNT_COLS  = ["Count", "Notes", "Pieces", "عدد"]
const TOTAL_COLS  = ["Subtotal", "Total", "Amount", "المجموع"]
const CURR_COLS   = ["Currency", "العملة"]

const SERIAL_SHEET_NAME = "Serial Result"
const SERIAL_TEXT_COLS = ["TEXT", "Serial", "S/N", "رقم"]

/**
 * Finds the index of a column that matches any of the candidate names (case-insensitive).
 */
function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(c => c.toLowerCase());
  return headers.findIndex(h => {
    const nh = String(h || "").trim().toLowerCase();
    return normalizedCandidates.includes(nh);
  });
}

export function parseCountingExcel(buffer: Buffer): CountingResult {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  
  // --- 1. Parse Denominations from the first sheet ---
  const firstSheetName = workbook.SheetNames[0]
  const mainSheet = workbook.Sheets[firstSheetName]
  // Convert to array of arrays to find header row dynamically
  const mainData: any[][] = XLSX.utils.sheet_to_json(mainSheet, { header: 1 })

  if (!mainData.length) {
    throw new Error("Excel file is empty or has no data in the main sheet")
  }

  // Find the header row by looking for "Denomination" or "Denom"
  let headerRowIndex = -1
  let denomIdx = -1, countIdx = -1, totalIdx = -1, currIdx = -1

  for (let i = 0; i < mainData.length; i++) {
    const row = mainData[i].map(cell => String(cell || "").trim())
    denomIdx = findColumnIndex(row, DENOM_COLS)
    countIdx = findColumnIndex(row, COUNT_COLS)
    
    if (denomIdx !== -1 && countIdx !== -1) {
      headerRowIndex = i
      totalIdx = findColumnIndex(row, TOTAL_COLS)
      currIdx = findColumnIndex(row, CURR_COLS)
      break
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Could not find the header row (Denomination, Count) in the Excel file.")
  }

  const denominations: DenominationRow[] = []
  let currency = "USD"

  // Process rows after the header
  for (let i = headerRowIndex + 1; i < mainData.length; i++) {
    const row = mainData[i]
    if (!row || row.length === 0) continue

    const rawDenom = row[denomIdx]
    const rawCount = row[countIdx]

    if (rawDenom === undefined || rawDenom === null || rawDenom === "" ||
        rawCount === undefined || rawCount === null || rawCount === "") continue

    const denomination = Number(rawDenom)
    const notesCount   = Number(rawCount)

    if (isNaN(denomination) || isNaN(notesCount) || denomination <= 0 || notesCount <= 0) continue

    const subtotal = (totalIdx !== -1 && row[totalIdx] && !isNaN(Number(row[totalIdx])))
      ? Number(row[totalIdx])
      : denomination * notesCount

    denominations.push({ denomination, notesCount, subtotal })

    // Also pick up currency if present in this row
    if (currIdx !== -1 && row[currIdx]) {
      const c = String(row[currIdx]).trim()
      if (c.length >= 2) currency = c.toUpperCase()
    }
  }

  if (!denominations.length) {
    throw new Error("Could not parse any valid denomination rows from the Excel file.")
  }

  const totalCountedAmount = denominations.reduce((sum, d) => sum + d.subtotal, 0)

  // --- 2. Parse USD Serial Numbers from 'Serial Result' sheet ---
  const usdSerialNumbers: string[] = []
  const serialSheet = workbook.Sheets[SERIAL_SHEET_NAME]
  
  if (serialSheet) {
    const serialData: any[][] = XLSX.utils.sheet_to_json(serialSheet, { header: 1 })
    if (serialData.length > 0) {
      let sHeaderRowIndex = -1
      let sCurrIdx = -1, sTextIdx = -1

      // Find header row in serial sheet
      for (let i = 0; i < serialData.length; i++) {
        const row = serialData[i].map(cell => String(cell || "").trim())
        sTextIdx = findColumnIndex(row, SERIAL_TEXT_COLS)
        if (sTextIdx !== -1) {
          sHeaderRowIndex = i
          sCurrIdx = findColumnIndex(row, CURR_COLS)
          break
        }
      }

      if (sHeaderRowIndex !== -1) {
        const serialsSet = new Set<string>()
        for (let i = sHeaderRowIndex + 1; i < serialData.length; i++) {
          const row = serialData[i]
          const rowCurrency = sCurrIdx !== -1 ? String(row[sCurrIdx] || "").trim().toUpperCase() : "USD"
          const serialText = String(row[sTextIdx] || "").trim()

          if (rowCurrency === "USD" && serialText.length > 0) {
            serialsSet.add(serialText)
          }
        }
        usdSerialNumbers.push(...Array.from(serialsSet))
      }
    }
  }

  return { 
    denominations, 
    totalCountedAmount, 
    currency, 
    usdSerialNumbers 
  }
}
