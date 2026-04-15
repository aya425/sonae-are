import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type PlanRow = {
  id: string;
  title: string;
  family_member_count: number;
  total_estimated_cost: number;
  annual_cost: number | null;
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
      .select("id, title, family_member_count, total_estimated_cost, annual_cost, updated_at")
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
      annualCost: plan.annual_cost,
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
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("id");

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

    const { error } = await supabase.from("plans").delete().eq("id", planId).eq("user_id", user.id);

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
