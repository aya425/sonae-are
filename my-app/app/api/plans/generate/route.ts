import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { generatePlan } from "@/lib/services/plan-generator";
import type { ProductType } from "@/lib/types/product";
import type { GeneratePlanRequest } from "@/lib/types/plan";

type FamilyMemberRow = {
  id: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  product_type: ProductType;
  is_free_from_28: boolean;
  price: number;
  purchase_url: string;
  shelf_life_months: number;
  is_active: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePlanRequest;
    const { days, includeDailyItems, priorityPolicy } = body;

    if (![3, 7].includes(days)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_DAYS",
            message: "daysは3または7を指定してください。",
            details: null,
          },
        },
        { status: 400 },
      );
    }

    if (!["minimum", "balanced"].includes(priorityPolicy)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_PRIORITY_POLICY",
            message: "priorityPolicyが不正です。",
            details: null,
          },
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // TODO: 認証ありで family_members を本人データに絞って確認する
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
        { status: 401 },
      );
    }

    const { data: familyMembers, error: familyError } = await supabase
      .from("family_members")
      .select("id");

    if (familyError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FAMILY_MEMBERS_FETCH_FAILED",
            message: "家族情報の取得に失敗しました。",
            details: familyError.message,
          },
        },
        { status: 500 },
      );
    }

    const familyMemberCount = ((familyMembers ?? []) as FamilyMemberRow[])
      .length;

    if (familyMemberCount === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FAMILY_MEMBERS_REQUIRED",
            message: "家族情報が未登録のため、備えプランを生成できません。",
            details: null,
          },
        },
        { status: 422 },
      );
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, name, category, product_type, is_free_from_28, price, purchase_url, shelf_life_months, is_active",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (productsError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PRODUCTS_FETCH_FAILED",
            message: "商品の取得に失敗しました。",
            details: productsError.message,
          },
        },
        { status: 500 },
      );
    }

    const normalizedProducts = ((products ?? []) as ProductRow[]).map(
      (product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        productType: product.product_type,
        isFreeFrom28: product.is_free_from_28,
        price: product.price,
        purchaseUrl: product.purchase_url,
        shelfLifeMonths: product.shelf_life_months,
        isActive: product.is_active,
      }),
    );

    const plan = generatePlan({
      familyMemberCount,
      days,
      includeDailyItems,
      priorityPolicy,
      products: normalizedProducts,
    });

    return NextResponse.json(
      {
        data: {
          plan,
        },
        error: null,
      },
      { status: 200 },
    );
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
      { status: 500 },
    );
  }
}
