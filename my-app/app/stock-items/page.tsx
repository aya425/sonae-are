import Link from "next/link";

type ExpiringItem = {
  id: string;
  name: string;
  daysLeft: number;
};

type StockItem = {
  id: string;
  name: string;
  quantity: number;
  expiresAt: string;
  unitPrice: number;
};

const mockExpiringItems: ExpiringItem[] = [
  { id: "exp-1", name: "アレルギー対応ビスケット", daysLeft: 12 },
  { id: "exp-2", name: "レトルトカレー", daysLeft: 25 },
];

const mockStockItems: StockItem[] = [
  {
    id: "stock-1",
    name: "アルファ米 白飯",
    quantity: 3,
    expiresAt: "2026-05-20",
    unitPrice: 320,
  },
  {
    id: "stock-2",
    name: "野菜スープ",
    quantity: 4,
    expiresAt: "2026-06-15",
    unitPrice: 280,
  },
];

export default function StockItemsPage() {
  const expiringItems = mockExpiringItems;
  const stockItems = mockStockItems;

  const totalEstimatedCost = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">備蓄品一覧</h1>
          <p className="mt-1 text-sm text-gray-600">
            登録済み備蓄品を確認し、期限やコストを管理できます。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/plans"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            保存済みプラン一覧へ
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            ダッシュボードへ戻る
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold">期限が近い商品</h2>
          <div className="mt-4 space-y-3">
            {expiringItems.length === 0 ? (
              <p className="text-sm text-gray-600">
                期限が近い商品はありません。
              </p>
            ) : (
              expiringItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-700">
                    残り {item.daysLeft} 日
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">備蓄登録フォーム</h2>
          <form className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">商品名</label>
              <input
                type="text"
                placeholder="例: アレルギー対応カレー"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">数量</label>
              <input
                type="number"
                placeholder="例: 3"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">賞味期限</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">単価</label>
              <input
                type="number"
                placeholder="例: 300"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
              >
                登録する
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-xl border p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">登録済み備蓄商品一覧</h2>
          <p className="text-sm text-gray-600">
            備蓄コスト目安: ¥{totalEstimatedCost.toLocaleString()}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {stockItems.length === 0 ? (
            <p className="text-sm text-gray-600">
              登録済みの備蓄商品はまだありません。
            </p>
          ) : (
            stockItems.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                  <p className="text-sm text-gray-600">
                    賞味期限: {item.expiresAt}
                  </p>
                  <p className="text-sm text-gray-600">
                    単価: ¥{item.unitPrice.toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
