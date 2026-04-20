import { NextRequest, NextResponse } from "next/server";
import { appendExpense, getAllExpenses, deleteExpenseRow, isExpenseCacheValid } from "@/lib/sheets";
import { verifyApiKey } from "@/lib/auth";
import { CATEGORIES, UNITS } from "@/lib/constants";
import type { ExpenseInput } from "@/types/expense";

export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

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

export async function GET(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  try {
    const scope = request.nextUrl.searchParams.get("scope");
    const month = request.nextUrl.searchParams.get("month");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 30;

    const isValidMonth = month ? /^\d{4}-\d{2}$/.test(month) : false;
    const isValidLimit = Number.isFinite(limit) && limit > 0;

    const cacheHit = isExpenseCacheValid();
    let expenses = await getAllExpenses();

    if (scope !== "all") {
      expenses = expenses.reverse();
    }

    if (isValidMonth) {
      expenses = expenses.filter((e) => e.date.startsWith(month!));
    }

    if (scope !== "all" && isValidLimit) {
      expenses = expenses.slice(0, limit);
    }

    return NextResponse.json(expenses, {
      headers: { "X-Cache": cacheHit ? "HIT" : "MISS" },
    });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "讀取失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  try {
    const { row_index, created_at } = await request.json();

    if (typeof row_index !== "number" || !created_at) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }

    await deleteExpenseRow(row_index, created_at);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "撤回失敗";
    console.error("Failed to delete expense:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
