import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not set");

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Application URL is not configured",
          },
        },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      // 継続課金前提なら subscription の方が自然
      mode: "subscription",
      line_items: [
        {
          // 本来は env などから price_id を渡す想定
          // まだ Price ID を作っていない場合は一旦コメントアウトして
          // 下の暫定実装を使う
          // price: process.env.STRIPE_PRICE_ID_PREMIUM,
          // quantity: 1,

          // 暫定実装（ローカル検証用）
          price_data: {
            currency: "jpy",
            product_data: {
              name: "プレミアムプラン（テスト）",
            },
            unit_amount: 500,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payments/success`,
      cancel_url: `${appUrl}/payments/cancel`,
    });

    if (!session.url) {
      console.error("Stripe Checkout session.url is null");

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CHECKOUT_SESSION_URL_NOT_FOUND",
            message: "Checkout URL was not returned by Stripe",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        url: session.url,
      },
      error: null,
    });
  } catch (error) {
    console.error("Failed to create Stripe Checkout session", error);

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CHECKOUT_SESSION_CREATE_FAILED",
          message: "Failed to create Stripe Checkout session",
        },
      },
      { status: 500 }
    );
  }
}