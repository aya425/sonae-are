import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY が未設定です" },
        { status: 500 },
      );
    }

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: "「疎通確認OK」とだけ返してください。",
    });

    return NextResponse.json({
      ok: true,
      output_text: response.output_text,
    });
  } catch (error) {
    console.error("OpenAI test error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
