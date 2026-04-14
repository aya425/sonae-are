import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type StockItemRow = {
  id: string;
  product_name: string;
  quantity: number;
  expires_at: string;
  unit_price: number;
};

type CreateStockItemRequest = {
  productName: string;
  quantity: number;
  expiresAt: string;
  unitPrice: number;
};

export async function GET() {
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
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("stock_items")
      .select("id, product_name, quantity, expires_at, unit_price")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FETCH_FAILED",
            message: "備蓄一覧の取得に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 },
      );
    }

    const normalized = ((data ?? []) as StockItemRow[]).map((item) => ({
      id: item.id,
      name: item.product_name,
      quantity: item.quantity,
      expiresAt: item.expires_at,
      unitPrice: item.unit_price,
    }));

    return NextResponse.json({
      data: normalized,
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
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
        { status: 401 },
      );
    }

    const body = (await request.json()) as CreateStockItemRequest;
    const { productName, quantity, expiresAt, unitPrice } = body;

    if (!productName || !expiresAt) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "商品名と賞味期限は必須です。",
            details: null,
          },
        },
        { status: 400 },
      );
    }

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
        { status: 400 },
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
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("stock_items")
      .insert({
        user_id: user.id,
        product_id: null,
        product_name: productName,
        quantity,
        purchased_at: today,
        expires_at: expiresAt,
        unit_price: unitPrice,
      })
      .select("id, product_name, quantity, expires_at, unit_price")
      .single();

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CREATE_FAILED",
            message: "備蓄商品の登録に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        data: {
          id: data.id,
          name: data.product_name,
          quantity: data.quantity,
          expiresAt: data.expires_at,
          unitPrice: data.unit_price,
        },
        error: null,
      },
      { status: 201 },
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
