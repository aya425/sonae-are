import { createClient } from "../../../src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { data: null, error: "未認証です。" },
        { status: 401 }
      );
    }

    const { data: members, error: membersError } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (membersError) {
      return Response.json(
        { data: null, error: membersError.message },
        { status: 500 }
      );
    }

    const memberIds = (members ?? []).map((member) => member.id);

    let allergensByMemberId: Record<string, string[]> = {};

    if (memberIds.length > 0) {
      const { data: allergens, error: allergensError } = await supabase
        .from("member_allergens")
        .select("family_member_id, allergen_name")
        .in("family_member_id", memberIds);

      if (allergensError) {
        return Response.json(
          { data: null, error: allergensError.message },
          { status: 500 }
        );
      }

      allergensByMemberId = (allergens ?? []).reduce<Record<string, string[]>>(
        (acc, item) => {
          if (!acc[item.family_member_id]) {
            acc[item.family_member_id] = [];
          }
          acc[item.family_member_id].push(item.allergen_name);
          return acc;
        },
        {}
      );
    }

    const formatted = (members ?? []).map((member) => ({
      id: member.id,
      role: member.role,
      age_group: member.age_group,
      notes: member.notes,
      allergens: allergensByMemberId[member.id] ?? [],
      created_at: member.created_at,
      updated_at: member.updated_at,
    }));

    return Response.json({ data: formatted, error: null }, { status: 200 });
  } catch (error) {
    console.error("GET /api/family error:", error);
    return Response.json(
      { data: null, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const body = await req.json();
    const { role, age_group, notes } = body;

    if (!role || !age_group) {
      return Response.json(
        { data: null, error: "role と age_group は必須です。" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { data: null, error: "未認証です。" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        role,
        age_group,
        notes: notes ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { data: null, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    console.error("POST /api/family error:", error);
    return Response.json(
      { data: null, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}