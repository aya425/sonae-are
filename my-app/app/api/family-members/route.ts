import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(_request: NextRequest) {
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

    const { data, error } = await supabase
      .from("family_members")
      .select("id, role, age_group, notes, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch family members",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    const response = (data ?? []).map((member) => ({
      ...member,
      notes: member.notes ?? "",
      allergens: [],
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
          message: "Internal Server Error",
        },
      },
      { status: 500 }
    );
  }
}

type FamilyMemberInput = {
  role?: string;
  age_group?: string;
  notes?: string | null;
};

function validateFamilyMember(input: FamilyMemberInput) {
  if (!input.role || input.role.trim() === "") {
    return "role is required";
  }

  if (!input.age_group || !["adult", "child"].includes(input.age_group)) {
    return "age_group must be adult or child";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
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

    const body = (await request.json()) as FamilyMemberInput;

    const validationError = validateFamilyMember(body);
    if (validationError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: validationError,
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        user_id: user.id,
        role: body.role,
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
            message: "Failed to create family member",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data,
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/family-members error:", error);

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