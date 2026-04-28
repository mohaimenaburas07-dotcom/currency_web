const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = XLSX.utils.book_new();

// Sheet 1: Count Result
const countData = [
  ["Count Result"],
  ["ID: 000000"],
  ["Date: 26.04.2026 17:54"],
  [],
  ["Currency: USD"],
  [],
  ["DENOM", "COUNT", "VALUE"],
  [100, 20, 2000]
];
const countSheet = XLSX.utils.aoa_to_sheet(countData);
XLSX.utils.book_append_sheet(workbook, countSheet, "Count Result");

// Sheet 2: Serial Result
const serialData = [
  ["NO.", "CURRENCY", "DENOM", "TEXT", "IMAGE"]
];

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function getRandomChar() {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function generateSerialNumber() {
  // e.g. PB54500673M
  return getRandomChar() + getRandomChar() + 
         Math.floor(Math.random() * 100000000).toString().padStart(8, '0') + 
         getRandomChar();
}

for (let i = 1; i <= 20; i++) {
  serialData.push([i, "USD", 100, generateSerialNumber(), ""]);
}

const serialSheet = XLSX.utils.aoa_to_sheet(serialData);
XLSX.utils.book_append_sheet(workbook, serialSheet, "Serial Result");

const filePath = path.join(__dirname, 'public', 'test_count_20_serials.xlsx');
XLSX.writeFile(workbook, filePath);
console.log(`Successfully generated Excel file at ${filePath}`);
