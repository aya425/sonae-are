import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    data: {
      access_token: "dummy-token",
    },
    error: null,
  });
}