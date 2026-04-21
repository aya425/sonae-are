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

type UpdatePlanRequest = {
  title?: string;
  familyMemberCount?: number;
  days?: 3 | 7 | 14;
  totalEstimatedCost?: number;
  annualCost?: number;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
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

function isValidPlanDays(value: number): value is 3 | 7 | 14 {
  return value === 3 || value === 7 || value === 14;
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

export async function PATCH(request: Request, context: RouteContext) {
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

    const body = (await request.json()) as UpdatePlanRequest;
    const { title, familyMemberCount, days, totalEstimatedCost, annualCost, items } = body;

    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_TITLE",
            message: "プラン名を入力してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (
      typeof familyMemberCount !== "number" ||
      !Number.isInteger(familyMemberCount) ||
      familyMemberCount <= 0
    ) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_FAMILY_MEMBER_COUNT",
            message: "人数は1以上の整数で指定してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (typeof days !== "number" || !isValidPlanDays(days)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_DAYS",
            message: "日数は3・7・14のいずれかで指定してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (
      typeof totalEstimatedCost !== "number" ||
      Number.isNaN(totalEstimatedCost) ||
      totalEstimatedCost < 0
    ) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_TOTAL_ESTIMATED_COST",
            message: "初期費用は0以上の数値で指定してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (typeof annualCost !== "number" || Number.isNaN(annualCost) || annualCost < 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_ANNUAL_COST",
            message: "年間維持コストは0以上の数値で指定してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_ITEMS",
            message: "更新対象の商品がありません。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item ||
        typeof item.productId !== "string" ||
        item.productId.length === 0 ||
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    );

    if (hasInvalidItem) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_ITEM_QUANTITY",
            message: "商品の数量は1以上の整数で指定してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const { data: existingPlan, error: fetchPlanError } = await supabase
      .from("plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", user.id)
      .single();

    if (fetchPlanError || !existingPlan) {
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

    const updatedAt = new Date().toISOString();

    const { error: updatePlanError } = await supabase
      .from("plans")
      .update({
        title: title.trim(),
        family_member_count: familyMemberCount,
        days,
        total_estimated_cost: totalEstimatedCost,
        annual_cost: annualCost,
        updated_at: updatedAt,
      })
      .eq("id", planId)
      .eq("user_id", user.id);

    if (updatePlanError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "UPDATE_PLAN_FAILED",
            message: "プランの更新に失敗しました。",
            details: updatePlanError.message,
          },
        },
        { status: 500 }
      );
    }

    for (const item of items) {
      const { error: updateItemError } = await supabase
        .from("plan_items")
        .update({
          quantity: item.quantity,
          updated_at: updatedAt,
        })
        .eq("plan_id", planId)
        .eq("product_id", item.productId);

      if (updateItemError) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "UPDATE_PLAN_ITEMS_FAILED",
              message: "プラン商品の更新に失敗しました。",
              details: updateItemError.message,
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        id: planId,
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
