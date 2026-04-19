import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlanDetailRow = {
  id: string;
  title: string;
  days: 3 | 7 | 14;
  family_member_count: number;
  total_estimated_cost: number;
  annual_cost: number | null;
  priority_policy: "minimum" | "balanced" | null;
  include_daily_items: boolean | null;
  ai_comment: string | null;
  warnings: string[] | null;
  plan_items: Array<{
    quantity: number;
    priority: "high" | "medium" | "low" | null;
    purpose_note: string | null;
    products: {
      id: string;
      name: string;
      category: string;
      product_type: "emergency_food" | "daily_item";
      is_free_from_28: boolean;
      price: number;
      purchase_url: string;
      shelf_life_months: number;
      is_active: boolean;
    } | null;
  }> | null;
};

function getPriorityByCategory(category: string): "high" | "medium" | "low" {
  if (category === "主食" || category === "飲料") return "high";
  if (category === "おかず" || category === "汁物") {
    return "medium";
  }
  if (category === "おやつ") {
    return "low";
  }
  return "low";
}

export async function GET(_request: Request, context: RouteContext) {
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
            message: "認証が必要です。",
            details: null,
          },
        },
        { status: 401 }
      );
    }

    const { id: planId } = await context.params;

    if (!planId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "planIdが必要です。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const { data: planDetail, error } = await supabase
      .from("plans")
      .select(
        `
          id,
          title,
          days,
          family_member_count,
          total_estimated_cost,
          annual_cost,
          priority_policy,
          include_daily_items,
          ai_comment,
          warnings,
          plan_items (
            quantity,
            priority,
            purpose_note,
            products (
              id,
              name,
              category,
              product_type,
              is_free_from_28,
              price,
              purchase_url,
              shelf_life_months,
              is_active
            )
          )
        `
      )
      .eq("id", planId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "PLAN_NOT_FOUND",
              message: "対象のプランが見つかりません。",
              details: null,
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FETCH_FAILED",
            message: "プランの取得に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    const normalizedPlan = planDetail as unknown as PlanDetailRow;

    return NextResponse.json({
      data: {
        id: normalizedPlan.id,
        title: normalizedPlan.title,
        days: normalizedPlan.days,
        familyMemberCount: normalizedPlan.family_member_count,
        totalEstimatedCost: normalizedPlan.total_estimated_cost,
        annualCost: normalizedPlan.annual_cost ?? 0,
        priorityPolicy: normalizedPlan.priority_policy ?? "minimum",
        includeDailyItems: normalizedPlan.include_daily_items ?? false,
        aiComment: normalizedPlan.ai_comment ?? "",
        warnings: normalizedPlan.warnings ?? [],
        items: (normalizedPlan.plan_items ?? [])
          .map((item) => {
            const product = item.products ?? null;
            if (!product) return null;

            return {
              id: product.id,
              name: product.name,
              category: product.category,
              productType: product.product_type,
              isFreeFrom28: product.is_free_from_28,
              price: product.price,
              purchaseUrl: product.purchase_url,
              shelfLifeMonths: product.shelf_life_months,
              isActive: product.is_active,
              quantity: item.quantity,
              subtotal: product.price * item.quantity,
              priority: getPriorityByCategory(product.category),
              reason: item.purpose_note ?? "家族条件と備えのバランスを見て提案しています。",
            };
          })
          .filter((item) => item !== null),
      },
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "予期しないエラーが発生しました。",
          details: error instanceof Error ? error.message : null,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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
            message: "認証が必要です。",
            details: null,
          },
        },
        { status: 401 }
      );
    }

    const { id: planId } = await context.params;

    if (!planId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "planIdが必要です。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const { data: deletedPlans, error } = await supabase
      .from("plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "DELETE_FAILED",
            message: "削除に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    if (!deletedPlans || deletedPlans.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PLAN_NOT_FOUND",
            message: "対象のプランが見つかりません。",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { success: true },
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "予期しないエラーが発生しました。",
          details: error instanceof Error ? error.message : null,
        },
      },
      { status: 500 }
    );
  }
}
