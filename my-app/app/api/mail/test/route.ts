import { NextRequest, NextResponse } from "next/server";
import { sendTestMail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to = body?.to;

    if (!to) {
      return NextResponse.json(
        {
          ok: false,
          message: "to is required",
        },
        { status: 400 }
      );
    }

    const result = await sendTestMail(to);

    return NextResponse.json({
      ok: true,
      message: "Test mail sent",
      data: result,
    });
  } catch (error) {
    console.error("[MAIL_TEST_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Mail test failed",
      },
      { status: 500 }
    );
  }
}
