export interface ExpenseInput {
  date: string; // YYYY-MM-DD
  category: string;
  item: string;
  quantity: number;
  unit: string;
  unit_price: number;
  supplier?: string;
  purchaser?: string;
  note?: string;
}

export interface Expense extends ExpenseInput {
  total_price: number;
  created_at: string; // ISO datetime
}
