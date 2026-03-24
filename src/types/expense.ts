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
}

export interface Expense extends ExpenseInput {
  unit_price: number; // Derived: total_price / quantity
  created_at: string; // ISO datetime
}
