import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type PriorityPolicy = "minimum" | "balance" | "balanced";
type PlanDays = 3 | 7 | 14;

type RecalculateRequest = {
  familyMemberCount?: number;
  family_member_count?: number;
  days?: number;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  product_type: "emergency_food" | "daily_item";
  is_free_from_28: boolean;
  price: number;
  purchase_url: string;
  shelf_life_months: number;
  is_active: boolean;
};

type PlanItemRow = {
  id: string;
  product_id: string;
  priority: string | null;
  purpose_note: string | null;
  products: ProductRow | ProductRow[] | null;
};

function isValidPlanDays(value: number): value is PlanDays {
  return value === 3 || value === 7 || value === 14;
}

function normalizePriorityPolicy(value: string | null | undefined): PriorityPolicy {
  if (value === "minimum") return "minimum";
  if (value === "balanced") return "balanced";
  return "balance";
}

function getQuantityByCategory(params: {
  category: string;
  familyMemberCount: number;
  days: PlanDays;
  priorityPolicy: PriorityPolicy;
}): number {
  const { category, familyMemberCount, days, priorityPolicy } = params;

  const baseQuantity = familyMemberCount * days;
  const isMinimum = priorityPolicy === "minimum";

  switch (category) {
    case "主食":
      return baseQuantity;
    case "飲料":
      return baseQuantity;
    case "おかず":
      return Math.max(1, Math.ceil(baseQuantity * (isMinimum ? 0.6 : 1)));
    case "汁物":
      return Math.max(1, Math.ceil(baseQuantity * (isMinimum ? 0.3 : 0.5)));
    case "おやつ":
      return Math.max(1, Math.ceil(baseQuantity * (isMinimum ? 0.2 : 0.4)));
    default:
      return Math.max(1, Math.ceil(baseQuantity * (isMinimum ? 0.5 : 0.8)));
  }
}

function getProductFromRelation(products: PlanItemRow["products"]): ProductRow | null {
  if (!products) return null;
  return Array.isArray(products) ? (products[0] ?? null) : products;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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
          },
        },
        { status: 401 }
      );
    }

    const { id: planId } = await context.params;

    const body = (await request.json()) as RecalculateRequest;
    const familyMemberCount = body.familyMemberCount ?? body.family_member_count;
    const days = body.days;

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
          },
        },
        { status: 400 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, user_id, title, priority_policy")
      .eq("id", planId)
      .eq("user_id", user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PLAN_NOT_FOUND",
            message: "対象のプランが見つかりません。",
          },
        },
        { status: 404 }
      );
    }

    const { data: planItems, error: planItemsError } = await supabase
      .from("plan_items")
      .select(
        `
          id,
          product_id,
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
        `
      )
      .eq("plan_id", planId)
      .order("created_at", { ascending: true });

    if (planItemsError) {
      console.error("[plans/recalculate] failed to fetch plan items", planItemsError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PLAN_ITEMS_FETCH_FAILED",
            message: "プラン商品の取得に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    if (!planItems || planItems.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PLAN_ITEMS_REQUIRED",
            message: "再計算対象の商品がありません。",
          },
        },
        { status: 422 }
      );
    }

    const priorityPolicy = normalizePriorityPolicy(plan.priority_policy);

    const recalculatedItems = (planItems as PlanItemRow[])
      .map((item) => {
        const product = getProductFromRelation(item.products);

        if (!product) {
          return null;
        }

        const quantity = getQuantityByCategory({
          category: product.category,
          familyMemberCount,
          days,
          priorityPolicy,
        });

        const subtotal = product.price * quantity;

        return {
          id: item.id,
          productId: item.product_id,
          name: product.name,
          category: product.category,
          productType: product.product_type,
          isFreeFrom28: product.is_free_from_28,
          price: product.price,
          purchaseUrl: product.purchase_url,
          shelfLifeMonths: product.shelf_life_months,
          isActive: product.is_active,
          quantity,
          subtotal,
          priority: item.priority ?? "medium",
          purposeNote: item.purpose_note,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const totalEstimatedCost = recalculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const annualCost = Math.round(
      recalculatedItems.reduce((sum, item) => {
        if (item.shelfLifeMonths <= 0) {
          return sum;
        }

        return sum + (item.price * item.quantity * 12) / item.shelfLifeMonths;
      }, 0)
    );

    return NextResponse.json({
      data: {
        summary: {
          title: plan.title,
          familyMemberCount,
          days,
          totalEstimatedCost,
          annualCost,
        },
        items: recalculatedItems,
      },
      error: null,
    });
  } catch (error) {
    console.error("[plans/recalculate] unexpected error", error);

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "数量の再計算に失敗しました。",
        },
      },
      { status: 500 }
    );
  }
}
