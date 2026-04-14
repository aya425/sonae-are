import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type Plan = {
  id: string;
  title: string;
  familyMemberCount: number;
  totalEstimatedCost: number;
  updatedAt: string;
};

type PlanRow = {
  id: string;
  title: string;
  family_member_count: number;
  total_estimated_cost: number;
  updated_at: string;
};

async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, title, family_member_count, total_estimated_cost, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("保存済みプラン一覧の取得に失敗しました:", error.message);
    return [];
  }

  return ((plans ?? []) as PlanRow[]).map((plan) => ({
    id: plan.id,
    title: plan.title,
    familyMemberCount: plan.family_member_count,
    totalEstimatedCost: plan.total_estimated_cost,
    updatedAt: plan.updated_at,
  }));
}

export default async function PlansPage() {
  const plans = await getPlans();
  const hasPlans = plans.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">保存済みプラン一覧</h1>
        <p className="mt-1 text-sm text-gray-600">
          保存済みプラン数: {plans.length}件
        </p>
      </div>

      {!hasPlans ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold">
            保存済みプランはまだありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            新しく備えプランを作成して保存すると、ここに一覧表示されます。
          </p>
          <div className="mt-4">
            <Link
              href="/plan/new"
              className="inline-block rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              備えプランを作る
            </Link>
          </div>
        </section>
      ) : (
        <section className="flex flex-wrap gap-4">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="w-full rounded-xl border p-5 shadow-sm sm:w-[calc(50%-0.5rem)]"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{plan.title}</h2>
                <p className="text-sm text-gray-600">
                  家族人数: {plan.familyMemberCount}人
                </p>
                <p className="text-sm text-gray-600">
                  初期費用: ¥{plan.totalEstimatedCost.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  更新日: {new Date(plan.updatedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/plans/${plan.id}`}
                  className="rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  詳細を見る
                </Link>
                <button
                  type="button"
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
