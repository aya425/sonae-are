type PlanItem = {
  id: string;
  name: string;
  quantity: number;
  type: string;
  price: number;
  url: string;
};

type GeneratedPlan = {
  items: PlanItem[];
  explanation: string;
  notice: string;
};

export default function PlanResultPage() {
  const mockPlan: GeneratedPlan = {
    items: [
      {
        id: "1",
        name: "アルファ米 白飯",
        quantity: 3,
        type: "防災食",
        price: 300,
        url: "https://example.com/item1",
      },
      {
        id: "2",
        name: "レトルトカレー",
        quantity: 2,
        type: "日常転用品",
        price: 250,
        url: "https://example.com/item2",
      },
      {
        id: "3",
        name: "アレルギー対応ビスケット",
        quantity: 4,
        type: "防災食",
        price: 180,
        url: "https://example.com/item3",
      },
    ],
    explanation: "このプランはアレルギー条件と保存性を考慮して選定しています。",
    notice:
      "商品情報は公式表示を確認してください。※本AIの提案は参考情報です。最終判断は自身で行ってください。",
  };

  const totalCost = mockPlan.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">備えプラン結果</h1>

      <div className="mb-6 rounded-lg border bg-yellow-50 p-4">
        <p className="text-sm text-gray-600">初期費用の目安</p>
        <p className="text-2xl font-bold">{totalCost}円</p>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          このプランの説明
        </p>
        <p className="text-sm leading-7 text-gray-600">
          {mockPlan.explanation}
        </p>
      </div>

      <div className="mb-6 rounded-lg border bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">注意事項</p>
        <p className="text-sm leading-7 text-gray-600">{mockPlan.notice}</p>
      </div>

      <div className="grid gap-4">
        {mockPlan.items.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <span className="text-sm px-2 py-1 rounded bg-gray-100">
                {item.type}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <p>数量: {item.quantity}</p>
              <p>価格: {item.price}円</p>
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-blue-600 underline"
            >
              商品ページを見る
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
