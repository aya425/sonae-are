import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type FamilyMemberUpdateInput = {
  role?: string;
  age_group?: string;
  notes?: string | null;
};

function validateFamilyMemberUpdate(input: FamilyMemberUpdateInput) {
  if (typeof input.role !== "string" || input.role.trim() === "") {
    return "role is required";
  }

  if (typeof input.age_group !== "string" || !["adult", "child"].includes(input.age_group)) {
    return "age_group must be adult or child";
  }

  if (!(typeof input.notes === "string" || input.notes === null || input.notes === undefined)) {
    return "notes must be string or null";
  }

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: "family member id is required",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const body = (await request.json()) as FamilyMemberUpdateInput;
    const validationError = validateFamilyMemberUpdate(body);

    if (validationError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: validationError,
            details: null,
          },
        },
        { status: 400 }
      );
    }

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
            details: null,
          },
        },
        { status: 401 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Family member not found",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    if (member.user_id !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FORBIDDEN",
            message: "Forbidden",
            details: null,
          },
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("family_members")
      .update({
        role: body.role,
        age_group: body.age_group,
        notes: body.notes ?? "",
      })
      .eq("id", id)
      .select("id, role, age_group, notes, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update family member",
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
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/family-members/[id] error:", error);

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "BAD_REQUEST",
            message: "family member id is required",
            details: null,
          },
        },
        { status: 400 }
      );
    }

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
            details: null,
          },
        },
        { status: 401 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Family member not found",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    if (member.user_id !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FORBIDDEN",
            message: "Forbidden",
            details: null,
          },
        },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase.from("family_members").delete().eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete family member",
            details: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: { id },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/family-members/[id] error:", error);

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
