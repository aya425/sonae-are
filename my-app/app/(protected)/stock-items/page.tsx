"use client";

import {
  BowlFoodIcon,
  CalendarBlankIcon,
  FloppyDiskIcon,
  PackageIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

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

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type CalendarCell = {
  date: Date;
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getCalendarCells = (displayMonth: Date): CalendarCell[] => {
  const firstDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
  const startDay = firstDayOfMonth.getDay();
  const calendarStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1 - startDay);

  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      dateKey: formatDateKey(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === displayMonth.getMonth(),
    };
  });

  while (cells.length > 35) {
    const lastWeek = cells.slice(-7);
    const hasCurrentMonthDay = lastWeek.some((cell) => cell.isCurrentMonth);

    if (hasCurrentMonthDay) {
      break;
    }

    cells.splice(-7, 7);
  }

  return cells;
};

export default function StockItemsPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [productCandidates, setProductCandidates] = useState<ProductCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [itemErrorMessages, setItemErrorMessages] = useState<Record<string, string>>({});
  const [form, setForm] = useState<StockItemForm>({
    productName: "",
    quantity: "",
    expiresAt: "",
    unitPrice: "",
  });
  const [selectedProductId, setSelectedProductId] = useState("");
  const expiryPickerRef = useRef<HTMLDivElement | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [editingItems, setEditingItems] = useState<
    Record<
      string,
      {
        quantity: string;
        unitPrice: string;
        expiresAt: string;
      }
    >
  >({});

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

  const calendarCells = useMemo(() => getCalendarCells(calendarMonth), [calendarMonth]);

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

  useEffect(() => {
    if (!isDatePickerOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!expiryPickerRef.current) return;

      const target = event.target;
      if (target instanceof Node && !expiryPickerRef.current.contains(target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isDatePickerOpen]);

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
      setEditingItems((prev) => {
        const next = { ...prev };
        delete next[stockItemId];
        return next;
      });
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "削除に失敗しました。");
    }
  };

  const handleEditValueChange = (
    stockItemId: string,
    field: "quantity" | "unitPrice" | "expiresAt",
    value: string
  ) => {
    const targetItem = stockItems.find((item) => item.id === stockItemId);

    setEditingItems((prev) => ({
      ...prev,
      [stockItemId]: {
        quantity: prev[stockItemId]?.quantity ?? String(targetItem?.quantity ?? ""),
        unitPrice: prev[stockItemId]?.unitPrice ?? String(targetItem?.unitPrice ?? ""),
        expiresAt: prev[stockItemId]?.expiresAt ?? targetItem?.expiresAt ?? "",
        [field]: value,
      },
    }));
  };

  const handleSave = async (stockItemId: string) => {
    const editingItem = editingItems[stockItemId];
    if (!editingItem) return;

    setSavingItemId(stockItemId);
    setItemErrorMessages((prev) => ({
      ...prev,
      [stockItemId]: "",
    }));

    try {
      const response = await fetch(`/api/stock-items/${stockItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          quantity: Number(editingItem.quantity),
          unitPrice: Number(editingItem.unitPrice),
          expiresAt: editingItem.expiresAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.data) {
        throw new Error(result.error?.message ?? "備蓄商品の更新に失敗しました。");
      }

      const updatedItem = result.data;

      // 一覧更新
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === stockItemId
            ? {
                ...item,
                quantity: updatedItem.quantity,
                unitPrice: updatedItem.unitPrice,
                expiresAt: updatedItem.expiresAt,
              }
            : item
        )
      );

      // 編集状態も同期
      setEditingItems((prev) => ({
        ...prev,
        [stockItemId]: {
          quantity: String(updatedItem.quantity),
          unitPrice: String(updatedItem.unitPrice),
          expiresAt: updatedItem.expiresAt,
        },
      }));
    } catch (error) {
      setItemErrorMessages((prev) => ({
        ...prev,
        [stockItemId]: error instanceof Error ? error.message : "備蓄商品の更新に失敗しました。",
      }));
    } finally {
      setSavingItemId(null);
    }
  };

  const totalEstimatedCost = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const formatDateInputDisplay = (value: string) => {
    if (!value) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value.replace(/-/g, "/");
    }

    return value.replace(/-/g, "/");
  };

  const openDatePicker = () => {
    const baseDate = form.expiresAt ? new Date(form.expiresAt) : new Date();
    setCalendarMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setIsDatePickerOpen(true);
  };

  const closeDatePicker = () => {
    setIsDatePickerOpen(false);
  };

  const moveCalendarMonth = (diff: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + diff, 1));
  };

  const handleSelectExpiryDate = (dateKey: string) => {
    setForm((prev) => ({
      ...prev,
      expiresAt: dateKey,
    }));
    setIsDatePickerOpen(false);
  };

  const selectedExpiryDateKey = form.expiresAt;
  const todayDateKey = formatDateKey(new Date());

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

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xl font-semibold text-slate-800">賞味期限</label>
                <div ref={expiryPickerRef} className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="年/月/日"
                      value={formatDateInputDisplay(form.expiresAt)}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);

                        let formattedValue = numericValue;
                        if (numericValue.length > 4 && numericValue.length <= 6) {
                          formattedValue = `${numericValue.slice(0, 4)}/${numericValue.slice(4)}`;
                        } else if (numericValue.length > 6) {
                          formattedValue = `${numericValue.slice(0, 4)}/${numericValue.slice(4, 6)}/${numericValue.slice(6)}`;
                        }

                        if (numericValue.length === 8) {
                          const year = Number(numericValue.slice(0, 4));
                          const month = Number(numericValue.slice(4, 6));
                          const day = Number(numericValue.slice(6, 8));
                          const candidate = new Date(year, month - 1, day);
                          const isValidDate =
                            candidate.getFullYear() === year &&
                            candidate.getMonth() === month - 1 &&
                            candidate.getDate() === day;

                          setForm((prev) => ({
                            ...prev,
                            expiresAt: isValidDate
                              ? `${String(year).padStart(4, "0")}-${String(month).padStart(
                                  2,
                                  "0"
                                )}-${String(day).padStart(2, "0")}`
                              : prev.expiresAt,
                          }));
                          return;
                        }

                        setForm((prev) => ({
                          ...prev,
                          expiresAt: formattedValue.replace(/\//g, "-"),
                        }));
                      }}
                      onBlur={(e) => {
                        const rawValue = e.target.value.trim();

                        if (!rawValue) {
                          setForm((prev) => ({
                            ...prev,
                            expiresAt: "",
                          }));
                          return;
                        }

                        const match = rawValue.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
                        if (!match) {
                          setForm((prev) => ({
                            ...prev,
                            expiresAt: "",
                          }));
                          return;
                        }

                        const year = Number(match[1]);
                        const month = Number(match[2]);
                        const day = Number(match[3]);
                        const candidate = new Date(year, month - 1, day);
                        const isValidDate =
                          candidate.getFullYear() === year &&
                          candidate.getMonth() === month - 1 &&
                          candidate.getDate() === day;

                        setForm((prev) => ({
                          ...prev,
                          expiresAt: isValidDate ? `${match[1]}-${match[2]}-${match[3]}` : "",
                        }));
                      }}
                      aria-label="賞味期限"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-14 text-center text-lg text-slate-800 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (isDatePickerOpen) {
                          closeDatePicker();
                          return;
                        }
                        openDatePicker();
                      }}
                      aria-label="賞味期限カレンダーを開く"
                      aria-expanded={isDatePickerOpen}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800"
                    >
                      <CalendarBlankIcon size={24} weight="bold" />
                    </button>
                  </div>

                  {isDatePickerOpen ? (
                    <div className="absolute left-1/2 top-full z-30 mt-2 w-full -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => moveCalendarMonth(-1)}
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          前月
                        </button>
                        <p className="text-base font-bold text-slate-900">
                          {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
                        </p>
                        <button
                          type="button"
                          onClick={() => moveCalendarMonth(1)}
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          次月
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm font-semibold text-slate-500">
                        {WEEK_LABELS.map((label) => (
                          <div
                            key={label}
                            className={
                              label === "日"
                                ? "text-red-500"
                                : label === "土"
                                  ? "text-blue-600"
                                  : ""
                            }
                          >
                            {label}
                          </div>
                        ))}
                      </div>

                      <div className="mt-1.5 grid grid-cols-7 gap-1">
                        {calendarCells.map((cell) => {
                          const isSelected = selectedExpiryDateKey === cell.dateKey;
                          const isToday = todayDateKey === cell.dateKey;
                          const isPast =
                            startOfDay(cell.date).getTime() < startOfDay(new Date()).getTime();

                          return (
                            <button
                              key={cell.dateKey}
                              type="button"
                              onClick={() => handleSelectExpiryDate(cell.dateKey)}
                              className={[
                                "flex h-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                                cell.isCurrentMonth ? "text-slate-900" : "text-slate-300",
                                isSelected
                                  ? "bg-[#1E3A8A] text-white hover:bg-[#1E40AF]"
                                  : "hover:bg-blue-50",
                                !isSelected && isToday
                                  ? "border border-blue-300"
                                  : "border border-transparent",
                                isPast && cell.isCurrentMonth ? "text-slate-400" : "",
                              ].join(" ")}
                            >
                              {cell.day}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              expiresAt: "",
                            }));
                            closeDatePicker();
                          }}
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          クリア
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectExpiryDate(todayDateKey)}
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#1E3A8A] transition-colors hover:bg-blue-50"
                        >
                          今日
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

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
              stockItems.map((item) => {
                const editingItem = editingItems[item.id] ?? {
                  quantity: String(item.quantity),
                  unitPrice: String(item.unitPrice),
                  expiresAt: item.expiresAt,
                };

                return (
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
                        <div />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white px-3 py-3 text-center">
                          <label className="mb-2 block text-lg font-semibold text-gray-600">
                            数量
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingItem.quantity}
                            onChange={(e) =>
                              handleEditValueChange(item.id, "quantity", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-lg font-semibold text-slate-900"
                          />
                        </div>

                        <div className="rounded-2xl bg-white px-3 py-3 text-center">
                          <label className="mb-2 block text-lg font-semibold text-gray-600">
                            単価
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={editingItem.unitPrice}
                              onChange={(e) =>
                                handleEditValueChange(item.id, "unitPrice", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-lg font-semibold text-slate-900"
                            />
                            <span className="shrink-0 text-base font-semibold text-slate-700">
                              円
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 rounded-2xl bg-white px-3 py-3 text-center">
                          <label className="mb-2 block text-lg font-semibold text-gray-600">
                            賞味期限
                          </label>
                          <input
                            type="text"
                            placeholder="年/月/日"
                            value={formatDateInputDisplay(editingItem.expiresAt)}
                            onChange={(e) => {
                              const numericValue = e.target.value
                                .replace(/[^0-9]/g, "")
                                .slice(0, 8);

                              let formattedValue = numericValue;
                              if (numericValue.length > 4 && numericValue.length <= 6) {
                                formattedValue = `${numericValue.slice(0, 4)}/${numericValue.slice(4)}`;
                              } else if (numericValue.length > 6) {
                                formattedValue = `${numericValue.slice(0, 4)}/${numericValue.slice(4, 6)}/${numericValue.slice(6)}`;
                              }

                              handleEditValueChange(
                                item.id,
                                "expiresAt",
                                formattedValue.replace(/\//g, "-")
                              );
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-lg font-semibold text-slate-900 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {itemErrorMessages[item.id] ? (
                        <p className="text-center text-sm font-medium text-red-600">
                          {itemErrorMessages[item.id]}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSave(item.id)}
                          disabled={savingItemId === item.id}
                          className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-5 py-2.5 text-lg font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FloppyDiskIcon size={24} weight="bold" />
                          <span>{savingItemId === item.id ? "保存中..." : "保存"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label="削除"
                          disabled={savingItemId === item.id}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300 bg-white text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon size={25} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
