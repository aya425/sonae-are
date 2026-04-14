import Link from "next/link";

type Plan = {
  id: string;
  title: string;
  familyMemberCount: number;
  totalEstimatedCost: number;
  updatedAt: string;
};

const mockPlans: Plan[] = [
  {
    id: "plan-1",
    title: "3日分プラン",
    familyMemberCount: 3,
    totalEstimatedCost: 6800,
    updatedAt: "2026-04-13",
  },
  {
    id: "plan-2",
    title: "7日分プラン",
    familyMemberCount: 4,
    totalEstimatedCost: 12800,
    updatedAt: "2026-04-12",
  },
];

export default function PlansPage() {
  const plans = mockPlans;
  const hasPlans = plans.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">保存済みプラン一覧</h1>
          <p className="mt-1 text-sm text-gray-600">保存済みプラン数: {plans.length}件</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/billing"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            料金プランを見る
          </Link>
          <Link
            href="/home"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            ダッシュボードへ戻る
          </Link>
        </div>
      </div>

      {!hasPlans ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold">保存済みプランはまだありません</h2>
          <p className="mt-2 text-sm text-gray-600">
            新しく備えプランを作成して保存すると、ここに一覧表示されます。
          </p>
          <div className="mt-4">
            <Link
              href="/plan/new"
              className="inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              備えプランを作る
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-4">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-xl border p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">{plan.title}</h2>
                  <p className="text-sm text-gray-600">家族人数: {plan.familyMemberCount}人</p>
                  <p className="text-sm text-gray-600">
                    初期費用: ¥{plan.totalEstimatedCost.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">更新日: {plan.updatedAt}</p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/plans/${plan.id}`}
                    className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
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
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
