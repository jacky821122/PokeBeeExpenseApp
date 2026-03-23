import { google } from "googleapis";
import type { ExpenseInput, Expense } from "@/types/expense";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_NAME = "Sheet1";

// Column order in the Google Sheet:
// date | category | item | quantity | unit | unit_price | total_price | supplier | purchaser | note | created_at

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export async function appendExpense(input: ExpenseInput): Promise<Expense> {
  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;

  const total_price = input.quantity * input.unit_price;
  const created_at = new Date().toISOString();

  const row = [
    input.date,
    input.category,
    input.item,
    input.quantity,
    input.unit,
    input.unit_price,
    total_price,
    input.supplier || "",
    input.purchaser || "",
    input.note || "",
    created_at,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:K`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return { ...input, total_price, created_at };
}

export async function getRecentExpenses(n: number = 30): Promise<Expense[]> {
  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:K`,
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) return []; // No data (only header or empty)

  // Skip header row, take last n entries
  const dataRows = rows.slice(1);
  const recent = dataRows.slice(-n).reverse();

  return recent.map((row) => ({
    date: row[0] || "",
    category: row[1] || "",
    item: row[2] || "",
    quantity: Number(row[3]) || 0,
    unit: row[4] || "",
    unit_price: Number(row[5]) || 0,
    total_price: Number(row[6]) || 0,
    supplier: row[7] || "",
    purchaser: row[8] || "",
    note: row[9] || "",
    created_at: row[10] || "",
  }));
}
