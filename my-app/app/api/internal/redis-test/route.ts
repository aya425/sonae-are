import { NextResponse } from "next/server";
import { getRedis } from "@/src/lib/redis";

export async function GET() {
  try {
    const redis = getRedis();

    if (!redis) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Upstash Redis environment variables are not set.",
          },
        },
        { status: 500 }
      );
    }

    const result = await redis.ping();

    return NextResponse.json({
      data: {
        result,
      },
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Redis test failed.",
        },
      },
      { status: 500 }
    );
  }
}
