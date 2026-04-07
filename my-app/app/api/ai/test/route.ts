import { NextResponse } from "next/server";
import { generateTestMessage } from "@/lib/ai/testMessage";

type AiTestRequestBody = {
  message?: string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY が未設定です" },
        { status: 500 },
      );
    }

    const body = (await req.json()) as AiTestRequestBody;
    const message =
      body.message?.trim() ||
      "固定メッセージです。疎通確認OKと返してください。";

    const outputText = await generateTestMessage({
      userMessage: message,
    });

    return NextResponse.json({
      ok: true,
      outputText,
    });
  } catch (error) {
    console.error("POST /api/ai/test error:", error);

    // 方針:
    // AI呼び出し失敗時も画面全体は壊さず、このAPIはJSONで失敗を返す。
    // 画面側では toast / エラーメッセージ表示に留め、再試行可能にする。
    // AIは補助用途であり、最終安全判定は行わない。
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "AI request failed",
      },
      { status: 500 },
    );
  }
}
