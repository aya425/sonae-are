export default function PlanResultPage() {
  const mockExplanation =
    "商品情報は公式表示を確認してください。このプランはアレルギー条件と保存性を考慮して選定しています。※本AIの提案は参考情報です。最終判断は自身で行なってください。";
  const mockItems = [
    {
      id: "1",
      name: "アルファ米 白飯",
      quantity: 3,
      type: "防災食",
      price: 300,
      url: "https://example.com/item1",
      explanation: "主食として優先度が高く、保存しやすい商品です。",
    },
    {
      id: "2",
      name: "レトルトカレー",
      quantity: 2,
      type: "日常転用品",
      price: 250,
      url: "https://example.com/item2",
      explanation: "普段使いもしやすく、ローリングストック向きです。",
    },
    {
      id: "3",
      name: "アレルギー対応ビスケット",
      quantity: 4,
      type: "防災食",
      price: 180,
      url: "https://example.com/item3",
      explanation: "間食用として食べやすく、子ども向けの備えにも向いています。",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">備えプラン結果</h1>
      <div className="mb-6 rounded-lg border bg-yellow-50 p-4">
        <p className="text-sm text-gray-600">初期費用の目安</p>
        <p className="text-2xl font-bold">2,120円</p>
        <div className="mb-6 rounded-lg border bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            このプランの説明
          </p>
          <p className="text-sm leading-7 text-gray-600">{mockExplanation}</p>
        </div>
      </div>
      <div className="grid gap-4">
        {mockItems.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
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
              商品を見る
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
