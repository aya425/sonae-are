import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

type AllergenRequestBody = {
  allergens?: string[];
};

function normalizeAllergens(allergens: string[]) {
  return [...new Set(allergens.map((item) => item.trim()).filter(Boolean))];
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
            message: "Unauthorized",
          },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = (await request.json()) as AllergenRequestBody;

    if (!Array.isArray(body.allergens)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: "allergens must be an array",
          },
        },
        { status: 400 }
      );
    }

    const allergens = normalizeAllergens(body.allergens);

    // まず、この family_member が本人のものか確認
    const { data: familyMember, error: familyMemberError } = await supabase
      .from("family_members")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (familyMemberError || !familyMember) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Family member not found",
          },
        },
        { status: 404 }
      );
    }

    // 既存アレルゲンを全削除
    const { error: deleteError } = await supabase
      .from("member_allergens")
      .delete()
      .eq("family_member_id", id);

    if (deleteError) {
      console.error("member_allergens delete error:", deleteError);

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to replace allergens",
            details: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

    // 空配列なら削除だけで終了
    if (allergens.length === 0) {
      return NextResponse.json({
        data: {
          family_member_id: id,
          allergens: [],
        },
        error: null,
      });
    }

    const insertRows = allergens.map((allergenName) => ({
      family_member_id: id,
      allergen_name: allergenName,
    }));

    const { error: insertError } = await supabase
      .from("member_allergens")
      .insert(insertRows);

    if (insertError) {
      console.error("member_allergens insert error:", insertError);

      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save allergens",
            details: insertError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        family_member_id: id,
        allergens,
      },
      error: null,
    });
  } catch (error) {
    console.error("PUT /api/family-members/:id/allergens error:", error);

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        },
      },
      { status: 500 }
    );
  }
}