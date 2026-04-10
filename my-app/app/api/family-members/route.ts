import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type FamilyMemberInput = {
  role?: string;
  age_group?: string;
  notes?: string | null;
};

function isValidFamilyMemberInput(input: FamilyMemberInput): input is {
  role: string;
  age_group: "adult" | "child";
  notes?: string | null;
} {
  return (
    typeof input.role === "string" &&
    input.role.trim() !== "" &&
    (input.age_group === "adult" || input.age_group === "child")
  );
}

function validateFamilyMember(input: FamilyMemberInput) {
  if (!input.role || input.role.trim() === "") {
    return "続柄は必須です";
  }

  if (!input.age_group || !["adult", "child"].includes(input.age_group)) {
    return "区分は大人または子供を選択してください";
  }

  return null;
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
        { status: 401 },
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
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("family_members select error:", error);

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "家族情報の取得に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 },
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
        (item: { allergen_name: string }) => item.allergen_name,
      ),
    }));

    return NextResponse.json({
      data: response,
      error: null,
    });
  } catch (error) {
    console.error("GET /api/family-members error:", error);

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
        { status: 401 },
      );
    }

    const body = (await request.json()) as FamilyMemberInput;

    const validationError = validateFamilyMember(body);
    if (validationError || !isValidFamilyMemberInput(body)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: validationError ?? "家族情報の入力値が不正です。",
            details: null,
          },
        },
        { status: 400 },
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
      console.error("family_members insert error:", error);

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "家族情報の登録に失敗しました。",
            details: error.message,
          },
        },
        { status: 500 },
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
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/family-members error:", error);

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
