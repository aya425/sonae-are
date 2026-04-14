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
  const [productCandidates, setProductCandidates] = useState<
    ProductCandidate[]
  >([]);
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

        const stockItemsResult: StockItemsResponse =
          await stockItemsResponse.json();
        const productsResult: ProductsResponse = await productsResponse.json();

        if (!stockItemsResponse.ok) {
          throw new Error(
            stockItemsResult.error?.message || "備蓄一覧の取得に失敗しました。",
          );
        }

        if (!productsResponse.ok) {
          throw new Error(
            productsResult.error?.message || "商品の取得に失敗しました。",
          );
        }

        setStockItems(stockItemsResult.data ?? []);
        setProductCandidates(productsResult.data?.items ?? []);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "初期データの取得に失敗しました。",
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

    const selected = productCandidates.find(
      (candidate) => candidate.id === value,
    );

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
          productName: form.productName,
          quantity: Number(form.quantity),
          expiresAt: form.expiresAt,
          unitPrice: Number(form.unitPrice),
        }),
      });

      const result: CreateStockItemResponse = await response.json();

      if (!response.ok || !result.data) {
        throw new Error(
          result.error?.message || "備蓄商品の登録に失敗しました。",
        );
      }

      setStockItems((prev) => [result.data!, ...prev]);

      setForm({
        productName: "",
        quantity: "",
        expiresAt: "",
        unitPrice: "",
      });
      setSelectedProductId("");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "備蓄商品の登録に失敗しました。",
      );
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
      setErrorMessage(
        error instanceof Error ? error.message : "削除に失敗しました。",
      );
    }
  };

  const totalEstimatedCost = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}/${month}/${day}`;
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">備蓄品一覧</h1>
          <p className="mt-1 text-sm text-gray-600">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">備蓄品一覧</h1>
        <p className="mt-1 text-sm text-gray-600">
          登録済み備蓄品を確認し、期限やコストを管理できます。
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-6">
        <section className="rounded-xl border bg-white p-5">
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

        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">備蓄登録フォーム</h2>

          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">商品名</label>
              <select
                className="w-full rounded-md border px-3 py-2"
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
                <label className="mb-1 block text-sm font-medium">
                  商品名を自由入力
                </label>
                <input
                  type="text"
                  placeholder="例: アレルギー対応カレー"
                  className="w-full rounded-md border px-3 py-2"
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
              <label className="mb-1 block text-sm font-medium">数量</label>
              <input
                type="number"
                placeholder="例: 3"
                className="w-full rounded-md border px-3 py-2"
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
              <label className="mb-1 block text-sm font-medium">賞味期限</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    expiresAt: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">単価</label>
              <input
                type="number"
                placeholder="例: 300"
                className="w-full rounded-md border px-3 py-2"
                value={form.unitPrice}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    unitPrice: e.target.value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "追加中..." : "備蓄を追加する"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-white p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">登録済み備蓄商品一覧</h2>
          <p className="text-sm text-gray-600">
            備蓄品の合計金額: ¥{totalEstimatedCost.toLocaleString()}
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {stockItems.length === 0 ? (
            <p className="sm:col-span-2 text-sm text-gray-600">
              登録済みの備蓄商品はまだありません。上のフォームから備蓄を追加してください。
            </p>
          ) : (
            stockItems.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border p-4 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                  <p className="text-sm text-gray-600">
                    賞味期限:{" "}
                    <span className="whitespace-nowrap">
                      {formatDate(item.expiresAt)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    単価: ¥{item.unitPrice.toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="mt-4 self-start rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
