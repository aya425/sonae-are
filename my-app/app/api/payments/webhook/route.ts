import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Missing stripe signature" } },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook signature error";

    console.error("Stripe webhook signature verification failed", {
      message,
    });

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "WEBHOOK_SIGNATURE_VERIFICATION_FAILED",
          message: "Invalid Stripe webhook signature",
        },
      },
      { status: 400 }
    );
  }

  console.info("Stripe webhook received", {
    stripe_event_id: event.id,
    stripe_event_type: event.type,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.info("checkout.session.completed received", {
          stripe_event_id: event.id,
          session_id: session.id,
          customer_id: session.customer,
          subscription_id: session.subscription,
          payment_status: session.payment_status,
        });

        /**
         * TODO:
         * ここで subscriptions テーブルを更新する
         *
         * 最低方針:
         * - session.customer から stripe_customer_id を取得
         * - session.subscription から stripe_subscription_id を取得
         * - 対象ユーザーの subscriptions を active に更新
         * - plan_id を premium に変更
         * - current_period_end を Stripe API から取得して保存
         *
         * 冪等性:
         * - 同じ event.id を二重処理しないこと
         * - MVPではまず event.id をログに残す
         * - 将来的には webhook_events / payments などで event.id を永続化して重複防止
         */

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        console.info("subscription event received", {
          stripe_event_id: event.id,
          subscription_id: subscription.id,
          status: subscription.status,
          customer_id: subscription.customer,
        });

        /**
         * TODO:
         * subscriptions テーブルの status / current_period_end を更新する
         */
        break;
      }

      default:
        console.info("Unhandled Stripe webhook event", {
          stripe_event_id: event.id,
          stripe_event_type: event.type,
        });
    }

    return NextResponse.json(
      { data: { received: true }, error: null },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook handler error";

    console.error("Stripe webhook handler failed", {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      message,
    });

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "WEBHOOK_HANDLER_FAILED",
          message: "Failed to process Stripe webhook",
        },
      },
      { status: 500 }
    );
  }
}