import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const testKey = "test:redis";
    const ttlKey = "test:redis:ttl";

    // 普通のset/get
    await redis.set(testKey, "hello");
    const value = await redis.get<string>(testKey);

    // TTL付き保存（60秒で消える）
    await redis.set(ttlKey, "ttl-hello", { ex: 60 });
    const ttlValue = await redis.get<string>(ttlKey);

    return NextResponse.json({
      ok: true,
      data: {
        message: "Redis set/get success",
        value,
        ttlValue,
      },
    });
  } catch (error) {
    console.error("[REDIS_TEST_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Redis test failed",
      },
      { status: 500 }
    );
  }
}
