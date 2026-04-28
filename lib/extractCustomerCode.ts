// lib/extractCustomerCode.ts
// Extracts the 6-digit customer code from an FX API bank account number.
// Example: "001812302000012" → "812302" (chars at index 3..8)

export function extractCustomerCode(bankAccountNumber: string): string | null {
  if (!bankAccountNumber || typeof bankAccountNumber !== "string") return null
  const cleaned = bankAccountNumber.trim()
  if (cleaned.length < 9) return null
  const code = cleaned.substring(3, 9)
  // Strip leading zeros as CBS API expects customer codes without them
  return parseInt(code, 10).toString()
}
