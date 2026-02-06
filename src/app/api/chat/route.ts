import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  return NextResponse.json({
    response: `Chat mode is under construction. You asked: "${message}". Type /command to return to terminal mode.`,
  });
}
