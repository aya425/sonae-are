import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
