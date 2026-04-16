import { NextResponse } from "next/server";
import type { HomeResponse } from "@/lib/types/home";
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

  const today = new Date();
  const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const within30Days = new Date(todayDate);
  within30Days.setUTCDate(within30Days.getUTCDate() + 30);

  const todayString = todayDate.toISOString().slice(0, 10);
  const within30DaysString = within30Days.toISOString().slice(0, 10);

  const { data: expiringStockItems, error: expiringItemsError } = await supabase
    .from("stock_items")
    .select("id, product_name, expires_at")
    .eq("user_id", user.id)
    .gte("expires_at", todayString)
    .lte("expires_at", within30DaysString)
    .order("expires_at", { ascending: true });

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

  if (expiringItemsError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "賞味期限が近い備蓄品情報の取得に失敗しました。",
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

  const response: HomeResponse = {
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
        count: expiringStockItems?.length ?? 0,
        items:
          expiringStockItems?.map((item) => {
            const expiresAtDate = new Date(`${item.expires_at}T00:00:00Z`);
            const diffMs = expiresAtDate.getTime() - todayDate.getTime();
            const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            return {
              id: item.id,
              productName: item.product_name,
              expiresAt: item.expires_at,
              daysLeft,
            };
          }) ?? [],
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
