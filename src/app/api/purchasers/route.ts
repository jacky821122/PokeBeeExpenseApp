import { NextResponse } from "next/server";
import { getAllPurchasers } from "@/lib/sheets";

export async function GET() {
  try {
    const purchasers = await getAllPurchasers();
    return NextResponse.json(purchasers);
  } catch (error) {
    console.error("Failed to fetch purchasers:", error);
    return NextResponse.json([], { status: 200 }); // Graceful degradation
  }
}
