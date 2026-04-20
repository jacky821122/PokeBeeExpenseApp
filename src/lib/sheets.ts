import { google } from "googleapis";
import type { ExpenseInput, Expense } from "@/types/expense";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_NAME = "Sheet1";
const ITEMS_SHEET_NAME = "Items";

// In-memory cache for getAllExpenses (server process lifetime)
let expensesCache: { data: Expense[]; expiresAt: number } | null = null;
const EXPENSES_CACHE_TTL = 60_000; // 60 seconds

export function isExpenseCacheValid(): boolean {
  return expensesCache !== null && Date.now() < expensesCache.expiresAt;
}

function invalidateExpensesCache() {
  expensesCache = null;
}

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

  const unit_price = input.quantity > 0 ? input.total_price / input.quantity : 0;
  // Store timestamp in UTC+8 (Asia/Taipei)
  const now = new Date();
  const twTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const created_at = twTime.toISOString().replace("Z", "+08:00");

  const row = [
    input.date,
    input.category,
    input.item,
    input.quantity,
    input.unit,
    unit_price,
    input.total_price,
    input.supplier || "",
    input.purchaser || "",
    input.note || "",
    created_at,
  ];

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:K`,
    valueInputOption: "USER_ENTERED",
    includeValuesInResponse: false,
    requestBody: { values: [row] },
  });

  // Parse row index from updatedRange, e.g. "Sheet1!A42:K42" → 42
  const updatedRange = res.data.updates?.updatedRange ?? "";
  const match = updatedRange.match(/:([A-Z]+)(\d+)$/);
  const row_index = match ? parseInt(match[2], 10) : undefined;

  invalidateExpensesCache();
  return { ...input, unit_price, created_at, row_index };
}

export async function deleteExpenseRow(row_index: number, created_at: string): Promise<void> {
  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;
  const sheetGid = parseInt(process.env.SHEET_GID ?? "0", 10);

  // Fetch the specific row to verify created_at and time window
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A${row_index}:K${row_index}`,
  });

  const row = res.data.values?.[0];
  if (!row) throw new Error("找不到該筆記錄");

  const rowCreatedAt = row[10] ?? "";
  if (rowCreatedAt !== created_at) throw new Error("記錄不符，無法撤回");

  // Check within 15 minutes
  const createdDate = new Date(rowCreatedAt);
  const now = new Date();
  if (now.getTime() - createdDate.getTime() > 15 * 60 * 1000) {
    throw new Error("已超過 15 分鐘，無法撤回");
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetGid,
              dimension: "ROWS",
              startIndex: row_index - 1, // 0-based
              endIndex: row_index,
            },
          },
        },
      ],
    },
  });
  invalidateExpensesCache();
}

export async function getAllExpenses(): Promise<Expense[]> {
  if (isExpenseCacheValid()) return expensesCache!.data;

  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:K`,
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) {
    expensesCache = { data: [], expiresAt: Date.now() + EXPENSES_CACHE_TTL };
    return [];
  }

  const data = rows.slice(1).map((row) => ({
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

  expensesCache = { data, expiresAt: Date.now() + EXPENSES_CACHE_TTL };
  return data;
}

export async function getAllPurchasers(): Promise<string[]> {
  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!I:I`, // purchaser column
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) return [];

  // Count frequency, skip header
  const freq: Record<string, number> = {};
  for (const row of rows.slice(1)) {
    const name = (row[0] ?? "").trim();
    if (name) freq[name] = (freq[name] ?? 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

export async function getItemsByCategory(): Promise<Record<string, string[]>> {
  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${ITEMS_SHEET_NAME}!A:B`,
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) return {};

  const result: Record<string, string[]> = {};
  for (const row of rows.slice(1)) {
    const category = (row[0] ?? "").trim();
    const item = (row[1] ?? "").trim();
    if (category && item) {
      if (!result[category]) result[category] = [];
      result[category].push(item);
    }
  }
  return result;
}

export async function addItem(category: string, item: string): Promise<void> {
  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${ITEMS_SHEET_NAME}!A:B`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[category, item]] },
  });
}

export async function removeItem(category: string, item: string): Promise<void> {
  const sheets = getSheets();
  const sheetId = process.env.SHEET_ID!;

  // Find the Items sheet GID
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const itemsSheet = meta.data.sheets?.find(
    (s) => s.properties?.title === ITEMS_SHEET_NAME
  );
  if (!itemsSheet) throw new Error("Items sheet not found");
  const itemsGid = itemsSheet.properties?.sheetId ?? 0;

  // Find the row to delete
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${ITEMS_SHEET_NAME}!A:B`,
  });

  const rows = res.data.values ?? [];
  // Find first matching row (1-indexed, skip header at index 0)
  const rowIndex = rows.findIndex(
    (r, i) => i > 0 && r[0]?.trim() === category && r[1]?.trim() === item
  );
  if (rowIndex === -1) throw new Error("找不到該品項");

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: itemsGid,
              dimension: "ROWS",
              startIndex: rowIndex, // already 0-based from findIndex
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
}
