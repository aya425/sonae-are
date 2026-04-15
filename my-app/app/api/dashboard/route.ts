import { NextResponse } from "next/server";
import type { DashboardResponse } from "@/lib/types/dashboard";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Unauthorized",
        },
      },
      { status: 401 }
    );
  }

  const { count: memberCount, error: familyError } = await supabase
    .from("family_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (familyError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "家族情報の取得に失敗しました。",
        },
      },
      { status: 500 }
    );
  }

  const { count: stockCount, error: stockError } = await supabase
    .from("stock_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  console.log("[dashboard] user.id", user.id);
  console.log("[dashboard] stockCount", stockCount);
  console.log("[dashboard] stockError", stockError);

  if (stockError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "備蓄品情報の取得に失敗しました。",
        },
      },
      { status: 500 }
    );
  }

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("id, title, days, total_estimated_cost, annual_cost, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (process.env.NODE_ENV === "development") {
    console.log("[dashboard] plans", plans);
  }

  if (plansError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "保存済みプランの取得に失敗しました。",
        },
      },
      { status: 500 }
    );
  }

  const latestPlanWithAnnualCost =
    plans?.find((plan) => plan.annual_cost !== null && plan.annual_cost !== undefined) ?? null;

  if (process.env.NODE_ENV === "development") {
    console.log("[dashboard] latestPlanWithAnnualCost", latestPlanWithAnnualCost);
  }

  const response: DashboardResponse = {
    data: {
      familySummary: {
        memberCount: memberCount ?? 0,
        hasFamily: (memberCount ?? 0) > 0,
      },
      costSummary: {
        annualCost: latestPlanWithAnnualCost?.annual_cost ?? null,
        sourcePlanId: latestPlanWithAnnualCost?.id ?? null,
      },
      expiringItems: {
        count: 0,
        items: [],
      },
      stockSummary: {
        count: stockCount ?? 0,
      },
      savedPlans:
        plans?.map((plan) => ({
          id: plan.id,
          title: plan.title,
          days: plan.days,
          totalEstimatedCost: plan.total_estimated_cost,
          annualCost: plan.annual_cost,
          updatedAt: plan.updated_at,
        })) ?? [],
      billingSummary: {
        planCode: "free",
        maxSavedPlans: 1,
      },
    },
    error: null,
  };

  return NextResponse.json(response);
}
