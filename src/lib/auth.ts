import { NextRequest, NextResponse } from "next/server";

/**
 * Verify the request carries a valid API key in the x-api-key header.
 * Returns null if authorised, or a 401 NextResponse if not.
 */
export function verifyApiKey(request: NextRequest): NextResponse | null {
  const secret = process.env.API_SECRET;
  if (!secret) {
    // If API_SECRET is not configured, skip auth (dev convenience)
    return null;
  }
  const key = request.headers.get("x-api-key") ?? "";
  if (key === secret) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
