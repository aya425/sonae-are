import Link from "next/link";

type PlanCondition = {
  familyMemberCount: number;
  days: number;
  includeDailyItems: boolean;
  priorityPolicy: string;
};

type PlanItem = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  productType: string;
  price: number;
  purchaseUrl: string;
};

const mockPlanCondition: PlanCondition = {
  familyMemberCount: 3,
  days: 3,
  includeDailyItems: true,
  priorityPolicy: "バランス重視",
};

const mockPlanItems: PlanItem[] = [
  {
    id: "item-1",
    name: "アルファ米 白飯",
    quantity: 3,
    category: "主食",
    productType: "防災食",
    price: 320,
    purchaseUrl: "https://example.com/item-1",
  },
  {
    id: "item-2",
    name: "レトルトカレー",
    quantity: 2,
    category: "おかず",
    productType: "日常転用品",
    price: 280,
    purchaseUrl: "https://example.com/item-2",
  },
  {
    id: "item-3",
    name: "アレルギー対応ビスケット",
    quantity: 4,
    category: "おやつ",
    productType: "防災食",
    price: 180,
    purchaseUrl: "https://example.com/item-3",
  },
];

const mockAiComment = `
優先度が高い主食とおかずを中心に、日常でも使いやすい商品を組み合わせています。
防災食だけでなく日常転用品も含めることで、無理なく備えやすい構成にしています。
`;

export default function PlanDetailPage() {
  const planCondition = mockPlanCondition;
  const planItems = mockPlanItems;

  const initialCost = planItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  const annualCost = 6200;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">商品確認</h1>
          <p className="mt-1 text-sm text-gray-600">
            提案された備えプランの内容を確認できます。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/stock-items"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            備蓄確認へ
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            ダッシュボードへ戻る
          </Link>
        </div>
      </div>

      <section className="mb-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">プラン条件</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-gray-700">
            家族人数: {planCondition.familyMemberCount}人
          </p>
          <p className="text-sm text-gray-700">
            想定日数: {planCondition.days}日分
          </p>
          <p className="text-sm text-gray-700">
            候補の範囲:{" "}
            {planCondition.includeDailyItems ? "日常品含む" : "防災食のみ"}
          </p>
          <p className="text-sm text-gray-700">
            優先方針: {planCondition.priorityPolicy}
          </p>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="text-lg font-semibold">初期費用</h2>
          <p className="mt-3 text-2xl font-bold">
            ¥{initialCost.toLocaleString()}
          </p>
        </section>

        <section className="rounded-xl border p-5">
          <h2 className="text-lg font-semibold">年間維持コスト</h2>
          <p className="mt-3 text-2xl font-bold">
            ¥{annualCost.toLocaleString()}
          </p>
        </section>
      </div>

      <section className="mb-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">商品一覧</h2>
        <div className="mt-4 space-y-4">
          {planItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                <p className="text-sm text-gray-600">
                  カテゴリ: {item.category}
                </p>
                <p className="text-sm text-gray-600">
                  商品種別: {item.productType}
                </p>
                <p className="text-sm text-gray-600">
                  価格: ¥{item.price.toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={item.purchaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  商品を見る
                </a>
                <Link
                  href="/stock-items"
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  備蓄登録
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">AI説明補助</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
          {mockAiComment}
        </p>
      </section>

      <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold">注意文</h2>
        <p className="mt-3 text-sm text-gray-700">
          商品情報やAIの提案は最終的な安全保証ではありません。購入前に必ず公式商品情報や表示内容を確認してください。
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          保存する
        </button>
        <button
          type="button"
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          削除する
        </button>
      </div>
    </main>
  );
}
