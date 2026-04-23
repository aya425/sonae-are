import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type SubscriptionRow = {
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  plans_master:
    | {
        plan_code: string;
      }
    | Array<{
        plan_code: string;
      }>
    | null;
};

function isPremiumSubscriptionStatus(status: string | null): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Not logged in",
        },
      },
      { status: 401 }
    );
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      `
        status,
        current_period_end,
        cancel_at_period_end,
        plans_master (
          plan_code
        )
      `
    )
    .eq("user_id", user.id)
    .maybeSingle<SubscriptionRow>();

  if (subscriptionError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "SUBSCRIPTION_FETCH_FAILED",
          message: "Failed to fetch subscription",
        },
      },
      { status: 500 }
    );
  }

  const rawPlan = subscription?.plans_master;
  const plan = Array.isArray(rawPlan) ? (rawPlan[0] ?? null) : rawPlan;

  const planCode = plan?.plan_code ?? "free";
  const status = subscription?.status ?? null;
  const currentPeriodEnd = subscription?.current_period_end ?? null;
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end === true;
  const isPremium = planCode === "premium" && isPremiumSubscriptionStatus(status);

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      planCode,
      isPremium,
      subscription: {
        planCode,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
    },
    error: null,
  });
}
