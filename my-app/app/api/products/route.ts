import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type ProductType = "emergency_food" | "daily_item";

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

export async function GET() {
  try {
    const supabase = await createClient();

    // const {
    //   data: { user },
    //   error: userError,
    // } = await supabase.auth.getUser();

    // if (userError || !user) {
    //   return NextResponse.json(
    //     {
    //       data: null,
    //       error: {
    //         code: "UNAUTHORIZED",
    //         message: "認証が必要です。",
    //         details: null,
    //       },
    //     },
    //     { status: 401 },
    //   );
    // }

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, category, product_type, is_free_from_28, price, purchase_url, shelf_life_months, is_active",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PRODUCTS_FETCH_FAILED",
            message: "商品の取得に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 },
      );
    }

    const items = ((data ?? []) as ProductRow[]).map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      productType: product.product_type,
      isFreeFrom28: product.is_free_from_28,
      price: product.price,
      purchaseUrl: product.purchase_url,
      shelfLifeMonths: product.shelf_life_months,
      isActive: product.is_active,
    }));

    return NextResponse.json(
      {
        data: {
          items,
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
