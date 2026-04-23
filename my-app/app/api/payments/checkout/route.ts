import { NextResponse } from "next/server";
import { stripe } from "@/src/lib/stripe";
import { createClient } from "@/src/lib/supabase/server";

export async function POST() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;

    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not set");

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "決済画面の準備に必要な設定が不足しています。時間をおいて再度お試しください。",
          },
        },
        { status: 500 }
      );
    }

    if (!premiumPriceId) {
      console.error("STRIPE_PRICE_ID_PREMIUM is not set");

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "現在、決済画面を開けません。管理者に設定内容を確認してください。",
          },
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Failed to get authenticated user", userError);

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "ログイン情報を確認できませんでした。もう一度ログインしてからお試しください。",
          },
        },
        { status: 401 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      line_items: [
        {
          price: premiumPriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing/success`,
      cancel_url: `${appUrl}/billing`,
    });

    if (!session.url) {
      console.error("Stripe Checkout session.url is null");

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CHECKOUT_SESSION_URL_NOT_FOUND",
            message: "決済画面の作成に失敗しました。時間をおいて再度お試しください。",
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
          message: "決済画面への遷移に失敗しました。時間をおいて再度お試しください。",
        },
      },
      { status: 500 }
    );
  }
}
