import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type PlanRow = {
  id: string;
  title: string;
  family_member_count: number;
  total_estimated_cost: number;
  updated_at: string;
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
        { status: 401 }
      );
    }

    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("id, title, family_member_count, total_estimated_cost, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (plansError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PLANS_FETCH_FAILED",
            message: "保存済みプラン一覧の取得に失敗しました。",
            details: plansError.message,
          },
        },
        { status: 500 }
      );
    }

    const normalizedPlans = ((plans ?? []) as PlanRow[]).map((plan) => ({
      id: plan.id,
      title: plan.title,
      familyMemberCount: plan.family_member_count,
      totalEstimatedCost: plan.total_estimated_cost,
      updatedAt: plan.updated_at,
    }));

    return NextResponse.json({
      data: normalizedPlans,
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
            message: "認証が必要です。",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { title, familyMemberCount, days, totalCost } = body;

    const { data, error } = await supabase
      .from("plans")
      .insert({
        user_id: user.id,
        title,
        family_member_count: familyMemberCount,
        days,
        total_estimated_cost: totalCost,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "プランの保存に失敗しました。",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "予期しないエラー",
        },
      },
      { status: 500 }
    );
  }
}
