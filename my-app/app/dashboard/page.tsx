import Link from "next/link";

function DashboardCard({
  title,
  children,
  href,
  linkLabel,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="flex h-full flex-col rounded-lg border bg-white p-3 shadow-sm">
      <div className="mb-3 text-center">
        <h2 className="text-sm font-semibold leading-snug text-gray-900">{title}</h2>
      </div>

      <div className="flex-1 text-center">{children}</div>

      {href && linkLabel ? (
        <div className="mt-3 pt-2 text-center">
          <Link href={href} className="text-xs font-semibold text-blue-600 hover:underline">
            {linkLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export default function DashboardPage() {
  const savedPlans = [
    {
      id: "plan_1",
      title: "3日分プラン",
      days: 3,
      totalEstimatedCost: 5400,
      updatedAt: "2026-04-13",
    },
  ];

  const expiringItems = [
    {
      id: "stock_1",
      productName: "アレルギー対応ビスケット",
      daysLeft: 30,
    },
    {
      id: "stock_2",
      productName: "保存水",
      daysLeft: 37,
    },
  ];

  const nearExpiryItems = expiringItems.filter((item) => item.daysLeft <= 30);

  return (
    <main className="min-h-screen bg-gray-50 px-3 py-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="mt-1 text-xs text-gray-600">
              家族情報、備えの費用、期限が近い商品、保存済みプランをまとめて確認できます。
            </p>
          </div>

          <Link
            href="/plan/new"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 xl:w-auto"
          >
            新しく備えプランを作る
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <DashboardCard title="家族情報" href="/family" linkLabel="家族情報を見る">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">登録人数: 3人</p>
              <p>
                家族条件を
                <br />
                確認・編集できます
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="コスト概要" href="/plans" linkLabel="保存済みプランを見る">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">年間維持コスト: ¥12,800</p>
              <p>算出元の保存済みプランをあとで参照できる想定</p>
            </div>
          </DashboardCard>

          <DashboardCard title="期限が近い商品" href="/inventory" linkLabel="確認する">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">件数: {nearExpiryItems.length}件</p>
              <ul className="space-y-0.5 text-center">
                {nearExpiryItems.map((item) => (
                  <li key={item.id} className="list-none">
                    {item.productName}（あと{item.daysLeft}日）
                  </li>
                ))}
              </ul>
            </div>
          </DashboardCard>

          <DashboardCard title="備蓄品一覧" href="/inventory" linkLabel="備蓄品一覧へ">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">登録済み備蓄品: 6件</p>
              <p>備蓄の登録・確認・削除ができます</p>
            </div>
          </DashboardCard>

          <DashboardCard title="料金プラン" href="/billing" linkLabel="料金プランを見る">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">現在のプラン: 無料プラン</p>
              <p>保存可能件数: 1件</p>
            </div>
          </DashboardCard>
        </div>

        <section className="mt-4 inline-block max-w-fit space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold leading-relaxed text-gray-900">
            賞味期限が近い商品があります。必要に応じて備蓄品一覧から確認してください。
          </p>

          <div className="rounded-md bg-white/70 p-3">
            <h2 className="text-sm font-semibold leading-snug text-gray-900">期限が近い商品</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-800">
              {nearExpiryItems.map((item) => (
                <li key={item.id} className="ml-5 list-disc leading-relaxed">
                  {item.productName}（あと{item.daysLeft}日）
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold leading-snug text-gray-900">保存済みプラン</h2>
            <Link href="/plans" className="text-xs font-semibold text-blue-600 hover:underline">
              一覧へ
            </Link>
          </div>

          {savedPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              {savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="h-full rounded-lg border bg-white p-3 text-center shadow-sm"
                >
                  <p className="text-sm font-semibold leading-snug text-gray-900">{plan.title}</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-700">
                    <p>{plan.days}日分</p>
                    <p>初期費用: ¥{plan.totalEstimatedCost.toLocaleString()}</p>
                    <p>更新日: {plan.updatedAt}</p>
                  </div>

                  <div className="mt-3 text-center">
                    <Link
                      href={`/plans/${plan.id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      詳細を見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">まだ保存済みプランはありません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
