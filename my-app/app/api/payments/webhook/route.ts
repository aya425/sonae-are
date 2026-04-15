import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const verifiedWebhookSecret: string = webhookSecret ?? "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

const supabase = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function getPlanId(planCode: "free" | "premium") {
  const { data, error } = await supabase
    .from("plans_master")
    .select("id")
    .eq("plan_code", planCode)
    .single();

  if (error || !data) {
    throw new Error(`${planCode} plan was not found in plans_master`);
  }

  return data.id as string;
}

function toIsoDate(value?: number | null) {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "BAD_REQUEST",
          message: "Stripe署名ヘッダーが見つかりません。",
        },
      },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();

    event = stripe.webhooks.constructEvent(body, signature, verifiedWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook signature error";

    console.error("Stripe webhook signature verification failed", {
      message,
    });

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "WEBHOOK_SIGNATURE_VERIFICATION_FAILED",
          message: "Stripe Webhookの署名検証に失敗しました。",
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
        const userId = session.metadata?.user_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null);

        console.info("checkout.session.completed received", {
          stripe_event_id: event.id,
          session_id: session.id,
          customer_id: customerId,
          subscription_id: subscriptionId,
          payment_status: session.payment_status,
          user_id: userId,
        });

        if (!userId) {
          throw new Error("user_id is missing in checkout session metadata");
        }

        if (!subscriptionId) {
          throw new Error("subscription_id is missing in checkout session");
        }

        const premiumPlanId = await getPlanId("premium");
        const subscription = (await stripe.subscriptions.retrieve(
          subscriptionId
        )) as unknown as Stripe.Subscription;
        const currentPeriodEnd = toIsoDate(
          (subscription as Stripe.Subscription & { current_period_end?: number | null })
            .current_period_end
        );

        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan_id: premiumPlanId,
            status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "user_id" }
        );

        if (error) {
          throw new Error(`Failed to upsert subscription: ${error.message}`);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : (subscription.customer?.id ?? null);
        const currentPeriodEnd = toIsoDate(
          (subscription as Stripe.Subscription & { current_period_end?: number | null })
            .current_period_end
        );

        console.info("customer.subscription.updated received", {
          stripe_event_id: event.id,
          subscription_id: subscription.id,
          status: subscription.status,
          customer_id: customerId,
        });

        const updates: {
          status: string;
          current_period_end: string | null;
          stripe_customer_id?: string | null;
        } = {
          status: subscription.status,
          current_period_end: currentPeriodEnd,
        };

        if (customerId) {
          updates.stripe_customer_id = customerId;
        }

        const { error } = await supabase
          .from("subscriptions")
          .update(updates)
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          throw new Error(`Failed to update subscription: ${error.message}`);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : (subscription.customer?.id ?? null);
        const freePlanId = await getPlanId("free");

        console.info("customer.subscription.deleted received", {
          stripe_event_id: event.id,
          subscription_id: subscription.id,
          status: subscription.status,
          customer_id: customerId,
        });

        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan_id: freePlanId,
            status: "canceled",
            current_period_end: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          throw new Error(`Failed to cancel subscription: ${error.message}`);
        }

        break;
      }

      default:
        console.info("Unhandled Stripe webhook event", {
          stripe_event_id: event.id,
          stripe_event_type: event.type,
        });
    }

    return NextResponse.json({ data: { received: true }, error: null }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook handler error";

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
          message: "Stripe Webhookの処理に失敗しました。",
        },
      },
      { status: 500 }
    );
  }
}
