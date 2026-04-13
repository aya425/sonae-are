import { NextResponse } from "next/server";
import { mockDashboardResponse } from "@/lib/types/dashboard";

export async function GET() {
  return NextResponse.json(mockDashboardResponse, { status: 200 });
}
