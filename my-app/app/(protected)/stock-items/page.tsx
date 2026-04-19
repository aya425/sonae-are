"use client";

import { BowlFoodIcon, CalendarBlankIcon, PackageIcon, TrashIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

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
  const expiresAtInputRef = useRef<HTMLInputElement | null>(null);

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
        throw new Error(getFriendlyCreateErrorMessage(result.error, form));
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
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "備蓄商品の登録に失敗しました。入力内容を確認してもう一度お試しください。"
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

  const formatDateInputDisplay = (value: string) => {
    if (!value) return "";
    return value.replace(/-/g, "/");
  };

  const openDatePicker = () => {
    const input = expiresAtInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  const getFriendlyCreateErrorMessage = (
    error: CreateStockItemResponse["error"] | null,
    formValue: StockItemForm
  ) => {
    const rawMessage = error?.message ?? "";

    const missingFields: string[] = [];

    if (!formValue.productName.trim()) {
      missingFields.push("商品名");
    }

    if (!formValue.quantity) {
      missingFields.push("数量");
    }

    if (formValue.unitPrice === "") {
      missingFields.push("単価");
    }

    if (!formValue.expiresAt) {
      missingFields.push("賞味期限");
    }

    if (missingFields.length > 0) {
      return `${missingFields.join("・")}を入力してください。`;
    }

    if (Number(formValue.quantity) <= 0) {
      return "数量は1以上で入力してください。";
    }

    if (Number(formValue.unitPrice) < 0) {
      return "単価は0円以上で入力してください。";
    }

    if (
      rawMessage.includes("商品名と賞味期限は必須です") ||
      rawMessage.includes("product") ||
      rawMessage.includes("expires")
    ) {
      return "入力内容を確認してください。商品名と賞味期限は必須です。";
    }

    if (rawMessage.includes("quantity")) {
      return "数量は1以上で入力してください。";
    }

    if (rawMessage.includes("unitPrice") || rawMessage.includes("単価")) {
      return "単価は0円以上で入力してください。";
    }

    return "備蓄商品の登録に失敗しました。入力内容を確認してもう一度お試しください。";
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl bg-white px-3 py-4">
        <p className="mt-4 text-center text-xl text-gray-900">備蓄品一覧を読み込み中です...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-none bg-white px-2 py-2">
      <div className="space-y-4">
        {/* 期限が近い商品 */}
        {expiringItems.length > 0 ? (
          <section className="mx-auto max-w-4xl rounded-3xl border border-amber-300 bg-amber-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-center text-2xl font-bold text-[#1E3A8A]">期限が近い商品</h2>
              <BowlFoodIcon size={30} weight="fill" className="text-[#1E3A8A]" />
            </div>

            <div className="mt-4 rounded-xl bg-white/80 px-4 py-3">
              <div className="mt-0 space-y-0">
                {expiringItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3"
                  >
                    <p className="text-xl font-semibold text-slate-800">{item.name}</p>
                    <p className="whitespace-nowrap text-xl font-semibold text-red-500">
                      あと{item.daysLeft}日
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {errorMessage ? (
          <div className="mx-auto mb-1 max-w-2xl rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-base font-medium leading-relaxed text-red-700 sm:text-lg">
            {errorMessage}
          </div>
        ) : null}

        {/* 登録フォーム */}
        <section className="mx-auto max-w-2xl rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-center text-2xl font-bold text-[#1E3A8A]">登録フォーム</h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xl font-semibold text-slate-800">商品名</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl"
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
                  <label className="mb-2 block text-lg font-semibold text-slate-800">
                    商品名を自由入力
                  </label>
                  <input
                    type="text"
                    placeholder="例: アレルギー対応カレー"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-lg"
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

              {/* 数量 */}
              <div>
                <label className="mb-2 block text-xl font-semibold text-slate-800">数量</label>
                <input
                  type="number"
                  placeholder="例: 3"
                  className="w-full max-w-[200px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-lg"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                />
              </div>

              {/* 単価 */}
              <div>
                <label className="mb-2 block text-xl font-semibold text-slate-800">単価</label>
                <input
                  type="number"
                  min="0"
                  placeholder="例: 300"
                  className="w-full max-w-[200px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-lg"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      unitPrice: e.target.value,
                    }))
                  }
                />
              </div>

              {/* 賞味期限 */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xl font-semibold text-slate-800">賞味期限</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    placeholder="年 / 月 / 日"
                    value={formatDateInputDisplay(form.expiresAt)}
                    onClick={openDatePicker}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-lg"
                  />
                  <button
                    type="button"
                    onClick={openDatePicker}
                    aria-label="賞味期限を選択"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800"
                  >
                    <CalendarBlankIcon size={24} weight="bold" />
                  </button>
                  <input
                    ref={expiresAtInputRef}
                    type="date"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        expiresAt: e.target.value,
                      }))
                    }
                    className="pointer-events-none absolute right-4 top-1/2 h-10 w-10 -translate-y-1/2 opacity-0"
                  />
                </div>
              </div>

              {/* ボタン */}
              <div className="sm:col-span-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-w-[280px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-8 py-4 text-xl font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PackageIcon size={24} weight="fill" />
                  <span>{isSubmitting ? "追加中..." : "備蓄を追加する"}</span>
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* 一覧 */}
        <section className="mx-auto w-full rounded-3xl border border-slate-200 bg-white px-3 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-bold text-[#1E3A8A]">登録済み備蓄品一覧</h2>
            <p className="text-xl font-semibold text-gray-900">
              備蓄品の合計金額: ¥{totalEstimatedCost.toLocaleString()}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {stockItems.length === 0 ? (
              <p className="sm:col-span-2 text-center text-xl text-gray-900">
                登録済みの備蓄品はまだありません。
                <br />
                上のフォームから備蓄を追加してください。
              </p>
            ) : (
              stockItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-3xl border border-blue-100 bg-blue-50 px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
                >
                  <div className="space-y-3 text-center">
                    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2 rounded-xl bg-blue-50 px-2 py-1">
                      <div />
                      <h3 className="text-center text-2xl font-bold leading-snug text-[#1E3A8A] line-clamp-2">
                        {item.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        aria-label="削除"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300 bg-white text-red-700 transition-colors hover:bg-red-50"
                      >
                        <TrashIcon size={24} weight="bold" />
                      </button>
                    </div>
                    <div className="grid grid-cols-[0.8fr_0.9fr_1.3fr] gap-2">
                      <div className="rounded-2xl bg-white px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-gray-600">数量</p>
                        <div className="mt-1 flex justify-center">
                          <p className="text-xl font-semibold text-slate-900">{item.quantity}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-gray-600">単価</p>
                        <div className="mt-1 flex justify-center">
                          <p className="text-xl font-semibold text-slate-900">
                            ¥{item.unitPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-gray-600">賞味期限</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          <span className="whitespace-nowrap">{formatDate(item.expiresAt)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
