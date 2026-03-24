import { NextRequest, NextResponse } from "next/server";
import { appendExpense, getRecentExpenses } from "@/lib/sheets";
import { CATEGORIES, UNITS } from "@/lib/constants";
import type { ExpenseInput } from "@/types/expense";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { date, category, item, quantity, unit, total_price } = body;

    if (!date || !category || !item || quantity == null || !unit || total_price == null) {
      return NextResponse.json(
        { error: "缺少必填欄位" },
        { status: 400 }
      );
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "無效的類別" },
        { status: 400 }
      );
    }

    if (!UNITS.includes(unit)) {
      return NextResponse.json(
        { error: "無效的單位" },
        { status: 400 }
      );
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json(
        { error: "數量必須為正數" },
        { status: 400 }
      );
    }

    if (typeof total_price !== "number" || total_price < 0) {
      return NextResponse.json(
        { error: "總價不可為負數" },
        { status: 400 }
      );
    }

    const input: ExpenseInput = {
      date,
      category,
      item,
      quantity,
      unit,
      total_price,
      supplier: body.supplier || "",
      purchaser: body.purchaser || "",
      note: body.note || "",
    };

    const expense = await appendExpense(input);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "儲存失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const expenses = await getRecentExpenses(30);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "讀取失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
