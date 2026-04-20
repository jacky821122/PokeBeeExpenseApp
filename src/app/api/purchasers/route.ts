import { NextRequest, NextResponse } from "next/server";
import { getAllPurchasers } from "@/lib/sheets";
import { verifyApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  try {
    const purchasers = await getAllPurchasers();
    return NextResponse.json(purchasers);
  } catch (error) {
    console.error("Failed to fetch purchasers:", error);
    return NextResponse.json([], { status: 200 }); // Graceful degradation
  }
}
