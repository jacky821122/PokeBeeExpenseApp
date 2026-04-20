import { NextRequest, NextResponse } from "next/server";
import { getItemsByCategory, addItem, removeItem } from "@/lib/sheets";
import { verifyApiKey } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  return token === process.env.STATS_SECRET;
}

export async function GET(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  try {
    const items = await getItemsByCategory();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return NextResponse.json({}, { status: 200 }); // Graceful degradation
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { category, item } = await request.json();
    if (!category || !item) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "無效的類別" }, { status: 400 });
    }
    await addItem(category, item.trim());
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to add item:", error);
    return NextResponse.json({ error: "新增失敗" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { category, item } = await request.json();
    if (!category || !item) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    await removeItem(category, item);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "刪除失敗";
    console.error("Failed to remove item:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
