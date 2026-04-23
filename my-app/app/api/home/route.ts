import { NextResponse } from "next/server";
import type { HomeResponse } from "@/src/types/home";
import { logger } from "@/src/lib/logger";
import { getRedis } from "@/src/lib/redis";
import { createClient } from "@/src/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  logger.info("home api started", {
    feature: "home",
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("home api unauthorized", {
      feature: "home",
      error: authError?.message ?? "user not found",
    });
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

  logger.info("home api authorized", {
    feature: "home",
    userId: user.id,
  });

  const cacheKey = `home:${user.id}`;
  const redis = getRedis();

  if (redis) {
    try {
      const cachedResponse = await redis.get<HomeResponse>(cacheKey);

      if (cachedResponse) {
        logger.info("home cache hit", {
          userId: user.id,
          cacheKey,
        });
        return NextResponse.json(cachedResponse);
      }

      logger.info("home cache miss", {
        userId: user.id,
        cacheKey,
      });
    } catch (error) {
      logger.warn("home cache read failed", {
        userId: user.id,
        cacheKey,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  const { count: memberCount, error: familyError } = await supabase
    .from("family_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (familyError) {
    logger.error("home api family fetch failed", {
      feature: "home",
      userId: user.id,
      error: familyError.message,
    });
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
    logger.error("home api stock fetch failed", {
      feature: "home",
      userId: user.id,
      error: stockError.message,
    });
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
    logger.error("home api expiring items fetch failed", {
      feature: "home",
      userId: user.id,
      error: expiringItemsError.message,
    });
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
    .select("id, title, days, family_member_count, total_estimated_cost, annual_cost, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (plansError) {
    logger.error("home api plans fetch failed", {
      feature: "home",
      userId: user.id,
      error: plansError.message,
    });
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

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("status, plan_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (subscriptionError) {
    logger.error("home api subscriptions fetch failed", {
      feature: "home",
      userId: user.id,
      error: subscriptionError.message,
    });
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "プラン情報の取得に失敗しました。",
        },
      },
      { status: 500 }
    );
  }

  const subscription =
    subscriptions?.find((item) => item.status === "active" || item.status === "trialing") ?? null;

  const latestPlanWithAnnualCost =
    plans?.find((plan) => plan.annual_cost !== null && plan.annual_cost !== undefined) ?? null;

  let planMaster: { plan_code: "free" | "premium"; max_saved_plans: number } | null = null;

  if (subscription?.plan_id) {
    const { data: planMasterData, error: planMasterError } = await supabase
      .from("plans_master")
      .select("plan_code, max_saved_plans")
      .eq("id", subscription.plan_id)
      .maybeSingle();

    if (planMasterError) {
      logger.error("home api plan master fetch failed", {
        feature: "home",
        userId: user.id,
        error: planMasterError.message,
      });
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "プラン情報の取得に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    planMaster = planMasterData;
  }

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
          familyMemberCount: plan.family_member_count,
          totalEstimatedCost: plan.total_estimated_cost,
          annualCost: plan.annual_cost,
          updatedAt: plan.updated_at,
        })) ?? [],
      billingSummary: {
        planCode: planMaster?.plan_code ?? "free",
        maxSavedPlans: planMaster?.max_saved_plans ?? 1,
      },
    },
    error: null,
  };

  logger.info("home api response built", {
    feature: "home",
    userId: user.id,
    familyMemberCount: memberCount ?? 0,
    stockCount: stockCount ?? 0,
    savedPlanCount: plans?.length ?? 0,
    expiringItemCount: expiringStockItems?.length ?? 0,
  });

  if (redis) {
    try {
      await redis.set(cacheKey, response, { ex: 60 });
      logger.info("home cache saved", {
        userId: user.id,
        cacheKey,
        ttlSeconds: 60,
      });
    } catch (error) {
      logger.warn("home cache write failed", {
        userId: user.id,
        cacheKey,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  logger.info("home api succeeded", {
    feature: "home",
    userId: user.id,
  });
  return NextResponse.json(response);
}
