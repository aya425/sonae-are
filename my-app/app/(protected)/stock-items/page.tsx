"use client";

import { useEffect, useState } from "react";

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

type StockItemsResponse = {
  data: StockItem[] | null;
  error: {
    code: string;
    message: string;
    details: string | null;
  } | null;
};

type CreateStockItemResponse = {
  data: {
    id: string;
    name: string;
    quantity: number;
    expiresAt: string;
    unitPrice: number;
  } | null;
  error: {
    code: string;
    message: string;
    details: string | null;
  } | null;
};

type DeleteStockItemResponse = {
  data: {
    success: boolean;
  } | null;
  error: {
    code: string;
    message: string;
    details: string | null;
  } | null;
};

type StockItemForm = {
  productName: string;
  quantity: string;
  expiresAt: string;
  unitPrice: string;
};

type ProductCandidate = {
  id: string;
  name: string;
  price: number;
};

type ProductsResponse = {
  data: {
    items: ProductCandidate[];
  } | null;
  error: {
    code: string;
    message: string;
    details: string | null;
  } | null;
};

export default function StockItemsPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [productCandidates, setProductCandidates] = useState<ProductCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<StockItemForm>({
    productName: "",
    quantity: "",
    expiresAt: "",
    unitPrice: "",
  });
  const [selectedProductId, setSelectedProductId] = useState("");

  const expiringItems: ExpiringItem[] = stockItems
    .map((item) => {
      const today = new Date();
      const expires = new Date(item.expiresAt);
      const diffTime = expires.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: item.id,
        name: item.name,
        daysLeft,
      };
    })
    .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [stockItemsResponse, productsResponse] = await Promise.all([
          fetch("/api/stock-items", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/products", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const stockItemsResult: StockItemsResponse = await stockItemsResponse.json();
        const productsResult: ProductsResponse = await productsResponse.json();

        if (!stockItemsResponse.ok) {
          throw new Error(stockItemsResult.error?.message || "備蓄一覧の取得に失敗しました。");
        }

        if (!productsResponse.ok) {
          throw new Error(productsResult.error?.message || "商品の取得に失敗しました。");
        }

        setStockItems(stockItemsResult.data ?? []);
        setProductCandidates(productsResult.data?.items ?? []);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "初期データの取得に失敗しました。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleChangeSelectedProduct = (value: string) => {
    setSelectedProductId(value);

    if (value === "") {
      setForm((prev) => ({
        ...prev,
        productName: "",
        unitPrice: "",
      }));
      return;
    }

    if (value === "manual") {
      setForm((prev) => ({
        ...prev,
        productName: "",
        unitPrice: "",
      }));
      return;
    }

    const selected = productCandidates.find((candidate) => candidate.id === value);

    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      productName: selected.name,
      unitPrice: String(selected.price),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/stock-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId: selectedProductId && selectedProductId !== "manual" ? selectedProductId : null,
          productName: form.productName,
          quantity: Number(form.quantity),
          expiresAt: form.expiresAt,
          unitPrice: Number(form.unitPrice),
        }),
      });

      const result: CreateStockItemResponse = await response.json();

      if (!response.ok || !result.data) {
        throw new Error(result.error?.message || "備蓄商品の登録に失敗しました。");
      }

      const createdItem = result.data;
      setStockItems((prev) => [createdItem, ...prev]);

      setForm({
        productName: "",
        quantity: "",
        expiresAt: "",
        unitPrice: "",
      });
      setSelectedProductId("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "備蓄商品の登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (stockItemId: string) => {
    const confirmed = window.confirm("この備蓄商品を削除しますか？");

    if (!confirmed) return;

    setErrorMessage("");

    try {
      const response = await fetch(`/api/stock-items/${stockItemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result: DeleteStockItemResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "削除に失敗しました。");
      }

      setStockItems((prev) => prev.filter((item) => item.id !== stockItemId));
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "削除に失敗しました。");
    }
  };

  const totalEstimatedCost = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const formatDate = (value: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("ja-JP");
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl bg-white px-3 py-4">
        <p className="mt-4 text-center text-sm text-gray-600">備蓄品一覧を読み込み中です...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl bg-white px-3 py-4">
      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-xl font-bold text-[#1E3A8A]">期限が近い商品</h2>

          <div className="mt-4 space-y-3">
            {expiringItems.length === 0 ? (
              <p className="text-base text-gray-600">期限が近い商品はありません。</p>
            ) : (
              expiringItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-slate-800">{item.name}</p>
                    <p className="whitespace-nowrap text-sm font-semibold text-amber-700">
                      残り {item.daysLeft} 日
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-xl font-bold text-[#1E3A8A]">備蓄登録フォーム</h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-base font-semibold text-slate-800">商品名</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg"
                  value={selectedProductId}
                  onChange={(e) => handleChangeSelectedProduct(e.target.value)}
                >
                  <option value="">商品を選択してください</option>
                  <option value="manual">自由入力する</option>
                  {productCandidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}（¥{candidate.price.toLocaleString()}）
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductId === "manual" ? (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-base font-semibold text-slate-800">
                    商品名を自由入力
                  </label>
                  <input
                    type="text"
                    placeholder="例: アレルギー対応カレー"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg"
                    value={form.productName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        productName: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-base font-semibold text-slate-800">数量</label>
                <input
                  type="number"
                  placeholder="例: 3"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-base font-semibold text-slate-800">
                  賞味期限
                </label>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      expiresAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="mb-2 block text-base font-semibold text-slate-800">単価</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="例: 300"
                    className="w-full max-w-[280px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg"
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        unitPrice: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex min-w-[280px] justify-center rounded-xl bg-[#1E3A8A] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "追加中..." : "備蓄を追加する"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1E3A8A]">登録済み備蓄品一覧</h2>
            <p className="text-base text-gray-600">
              備蓄品の合計金額: ¥{totalEstimatedCost.toLocaleString()}
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {stockItems.length === 0 ? (
              <p className="sm:col-span-2 text-base text-gray-600">
                登録済みの備蓄品はまだありません。上のフォームから備蓄を追加してください。
              </p>
            ) : (
              stockItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                >
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-slate-800">{item.name}</p>
                    <p className="text-base text-gray-600">数量: {item.quantity}</p>
                    <p className="text-base text-gray-600">
                      賞味期限:{" "}
                      <span className="whitespace-nowrap">{formatDate(item.expiresAt)}</span>
                    </p>
                    <p className="text-base text-gray-600">
                      単価: ¥{item.unitPrice.toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="mt-4 self-start rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                  >
                    削除
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
