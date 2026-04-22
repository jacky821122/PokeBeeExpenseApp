export interface ExpenseInput {
  date: string; // YYYY-MM-DD
  category: string;
  item: string;
  quantity: number;
  unit: string;
  total_price: number; // User inputs total price; unit_price is derived
  supplier?: string;
  purchaser?: string;
  note?: string;
  store_id?: string; // Multi-store support (optional, defaults to "main")
}

export interface Expense extends ExpenseInput {
  unit_price: number; // Derived: total_price / quantity
  created_at: string; // ISO datetime
  row_index?: number; // 1-based row in Sheet1, returned on append, used for undo
}
