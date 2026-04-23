import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type FamilyMemberInput = {
  role?: string;
  age_group?: string;
  notes?: string | null;
};

function validateFamilyMember(input: FamilyMemberInput): input is {
  role: string;
  age_group: "adult" | "child";
  notes?: string | null;
} {
  if (typeof input.role !== "string" || input.role.trim() === "") {
    return false;
  }

  if (typeof input.age_group !== "string" || !["adult", "child"].includes(input.age_group)) {
    return false;
  }

  if (!(typeof input.notes === "string" || input.notes == null)) {
    return false;
  }

  return true;
}

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

    const { data, error } = await supabase
      .from("family_members")
      .select(
        `
        id,
        role,
        age_group,
        notes,
        created_at,
        updated_at,
        member_allergens (
          allergen_name
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET /api/family-members family_members select error", {
        path: "/api/family-members",
        method: "GET",
        user_id: user.id,
        error_code: error.code ?? null,
        error_message: error.message,
      });

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "家族情報の取得に失敗しました。",
            details: null,
          },
        },
        { status: 500 }
      );
    }

    const response = (data ?? []).map((member) => ({
      id: member.id,
      role: member.role,
      age_group: member.age_group,
      notes: member.notes ?? "",
      created_at: member.created_at,
      updated_at: member.updated_at,
      allergens: (member.member_allergens ?? []).map(
        (item: { allergen_name: string }) => item.allergen_name
      ),
    }));

    return NextResponse.json({
      data: response,
      error: null,
    });
  } catch (error) {
    console.error("GET /api/family-members unexpected error", {
      path: "/api/family-members",
      method: "GET",
      error_message: error instanceof Error ? error.message : null,
    });

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "予期しないエラーが発生しました。",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    let body: FamilyMemberInput;

    try {
      body = (await request.json()) as FamilyMemberInput;
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: "JSON形式が不正です。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (!validateFamilyMember(body)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: "家族情報の入力値が不正です。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        user_id: user.id,
        role: body.role.trim(),
        age_group: body.age_group,
        notes: body.notes ?? "",
      })
      .select("id, role, age_group, notes, created_at, updated_at")
      .single();

    if (error) {
      console.error("POST /api/family-members family_members insert error", {
        path: "/api/family-members",
        method: "POST",
        user_id: user.id,
        error_code: error.code ?? null,
        error_message: error.message,
      });

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "家族情報の登録に失敗しました。",
            details: null,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          ...data,
          allergens: [],
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/family-members unexpected error", {
      path: "/api/family-members",
      method: "POST",
      error_message: error instanceof Error ? error.message : null,
    });

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "予期しないエラーが発生しました。",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
