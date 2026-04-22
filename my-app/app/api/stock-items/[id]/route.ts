import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

    const { id: stockItemId } = await context.params;

    if (!stockItemId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "stockItemIdが必要です。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const { data: deletedItems, error } = await supabase
      .from("stock_items")
      .delete()
      .eq("id", stockItemId)
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

    if (!deletedItems || deletedItems.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "STOCK_ITEM_NOT_FOUND",
            message: "対象の備蓄商品が見つかりません。",
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

    const { id: stockItemId } = await context.params;

    if (!stockItemId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "stockItemIdが必要です。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const quantity = Number(body.quantity);
    const unitPrice = Number(body.unitPrice);
    const expiresAt = String(body.expiresAt ?? "");

    // --- バリデーション ---
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_QUANTITY",
            message: "数量は1以上で入力してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_UNIT_PRICE",
            message: "単価は0以上で入力してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    if (!expiresAt || expiresAt <= today) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_EXPIRES_AT",
            message: "賞味期限は今日より後の日付を入力してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    // --- 更新 ---
    const { data, error } = await supabase
      .from("stock_items")
      .update({
        quantity,
        unit_price: unitPrice,
        expires_at: expiresAt,
      })
      .eq("id", stockItemId)
      .eq("user_id", user.id)
      .select("id, product_name, quantity, expires_at, unit_price")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "STOCK_ITEM_NOT_FOUND",
              message: "対象の備蓄商品が見つかりません。",
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
            code: "UPDATE_FAILED",
            message: "更新に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "STOCK_ITEM_NOT_FOUND",
            message: "対象の備蓄商品が見つかりません。",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.product_name,
        quantity: data.quantity,
        expiresAt: data.expires_at,
        unitPrice: data.unit_price,
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
