import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type SubscriptionRow = {
  id: string;
  status: string | null;
  stripe_subscription_id: string | null;
};

type StripeSubscriptionWithPeriodEnd = Stripe.Subscription & {
  current_period_end?: number | null;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    })
  : null;

export async function POST() {
  if (!stripe) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "STRIPE_NOT_CONFIGURED",
          message: "Stripeの設定が不足しています。",
        },
      },
      { status: 500 }
    );
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "ログインが必要です。",
          },
        },
        { status: 401 }
      );
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id, status, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>();

    if (subscriptionError) {
      console.error("[payments/cancel] failed to fetch subscription", subscriptionError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "SUBSCRIPTION_FETCH_FAILED",
            message: "契約情報の取得に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    if (!subscription || !subscription.stripe_subscription_id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "SUBSCRIPTION_NOT_FOUND",
            message: "解約対象の契約が見つかりません。",
          },
        },
        { status: 404 }
      );
    }

    if (subscription.status === "canceled") {
      return NextResponse.json({
        data: {
          message: "すでに解約済みです。",
        },
        error: null,
      });
    }

    const canceledSubscriptionResponse = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    const canceledSubscription = canceledSubscriptionResponse as StripeSubscriptionWithPeriodEnd;

    const currentPeriodEnd = canceledSubscription.current_period_end
      ? new Date(canceledSubscription.current_period_end * 1000).toISOString()
      : null;

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[payments/cancel] failed to update subscription", updateError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "SUBSCRIPTION_UPDATE_FAILED",
            message: "解約状態の更新に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        message: canceledSubscription.cancel_at_period_end
          ? "自動更新を停止しました。次回更新日までは利用できます。"
          : "解約しました。",
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        currentPeriodEnd,
      },
      error: null,
    });
  } catch (error) {
    console.error("[payments/cancel] unexpected error", error);

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "解約に失敗しました。",
        },
      },
      { status: 500 }
    );
  }
}
