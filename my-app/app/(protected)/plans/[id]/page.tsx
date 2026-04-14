"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PlanCondition = {
  title: string;
  familyMemberCount: number;
  days: number;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balanced";
  totalCost: number;
  annualCost: number;
  explanation: string;
  warnings: string[];
};

type PlanItem = {
  id: string;
  name: string;
  category: string;
  productType: "emergency_food" | "daily_item";
  isFreeFrom28: boolean;
  price: number;
  purchaseUrl: string;
  shelfLifeMonths: number;
  isActive: boolean;
  quantity: number;
  subtotal: number;
  priority: "high" | "medium" | "low";
  reason: string;
};

type StoredGeneratedPlan = {
  title: string;
  familyMemberCount: number;
  days: 3 | 7;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balanced";
  totalCost: number;
  annualCost: number;
  explanation: string;
  items: PlanItem[];
  warnings: string[];
};

const mockPlanCondition: PlanCondition = {
  title: "3日分プラン",
  familyMemberCount: 3,
  days: 3,
  includeDailyItems: true,
  priorityPolicy: "balanced",
  totalCost: 2240,
  annualCost: 6200,
  explanation:
    "主食・飲料・おかず・汁物のバランスを見ながら、候補範囲に含まれる防災食と日常品を組み合わせて提案しています。",
  warnings: [
    "最終的な安全確認は、必ず商品ページや公式表示の原材料・アレルゲン情報を確認してください。",
  ],
};

const mockPlanItems: PlanItem[] = [
  {
    id: "item-1",
    name: "アルファ米 白飯",
    category: "主食",
    productType: "emergency_food",
    isFreeFrom28: true,
    price: 320,
    purchaseUrl: "https://example.com/item-1",
    shelfLifeMonths: 60,
    isActive: true,
    quantity: 3,
    subtotal: 960,
    priority: "high",
    reason: "防災食の中でも優先して持ちたい主食です。",
  },
  {
    id: "item-2",
    name: "レトルトカレー",
    category: "おかず",
    productType: "daily_item",
    isFreeFrom28: true,
    price: 280,
    purchaseUrl: "https://example.com/item-2",
    shelfLifeMonths: 12,
    isActive: true,
    quantity: 2,
    subtotal: 560,
    priority: "medium",
    reason: "おかずを補って、備えのバランスを取りやすいです。",
  },
  {
    id: "item-3",
    name: "アレルギー対応ビスケット",
    category: "おやつ",
    productType: "emergency_food",
    isFreeFrom28: true,
    price: 180,
    purchaseUrl: "https://example.com/item-3",
    shelfLifeMonths: 24,
    isActive: true,
    quantity: 4,
    subtotal: 720,
    priority: "low",
    reason: "防災食として余裕があれば加えたいおやつです。",
  },
];

export default function PlanDetailPage() {
  const [plan, setPlan] = useState<PlanCondition>(mockPlanCondition);
  const [planItems, setPlanItems] = useState<PlanItem[]>(mockPlanItems);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem("generatedPlan");

    if (!storedPlan) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsedPlan = JSON.parse(storedPlan) as StoredGeneratedPlan;

      setPlan({
        title: parsedPlan.title,
        familyMemberCount: parsedPlan.familyMemberCount,
        days: parsedPlan.days,
        includeDailyItems: parsedPlan.includeDailyItems,
        priorityPolicy: parsedPlan.priorityPolicy,
        totalCost: parsedPlan.totalCost,
        annualCost: parsedPlan.annualCost,
        explanation: parsedPlan.explanation,
        warnings: parsedPlan.warnings,
      });

      setPlanItems(parsedPlan.items);
    } catch (error) {
      console.error("generatedPlanの読み込みに失敗しました", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const priorityPolicyLabel = plan.priorityPolicy === "minimum" ? "最低限そろえる" : "バランス重視";

  const includeDailyItemsLabel = plan.includeDailyItems ? "日常品含む" : "防災食のみ";

  const getProductTypeLabel = (productType: PlanItem["productType"]) =>
    productType === "daily_item" ? "日常転用品" : "防災食";

  const getPriorityLabel = (priority: PlanItem["priority"]) => {
    if (priority === "high") return "高";
    if (priority === "medium") return "中";
    return "低";
  };

  const handleSave = () => {
    alert("保存機能は次の工程で接続します。");
  };

  const handleDelete = () => {
    const confirmed = window.confirm("このプランを削除しますか？");
    if (!confirmed) return;

    alert("削除機能は次の工程で接続します。");
  };

  if (!isLoaded) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-600">プランを読み込んでいます...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">商品確認</h1>
          <p className="mt-1 text-sm text-gray-600">提案された備えプランの内容を確認できます。</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/stock-items"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            備蓄確認へ
          </Link>
          <Link
            href="/home"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            ダッシュボードへ戻る
          </Link>
        </div>
      </div>

      <section className="mb-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">プラン条件</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-gray-700">プラン名: {plan.title}</p>
          <p className="text-sm text-gray-700">家族人数: {plan.familyMemberCount}人</p>
          <p className="text-sm text-gray-700">想定日数: {plan.days}日分</p>
          <p className="text-sm text-gray-700">候補の範囲: {includeDailyItemsLabel}</p>
          <p className="text-sm text-gray-700">優先方針: {priorityPolicyLabel}</p>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="text-lg font-semibold">初期費用</h2>
          <p className="mt-3 text-2xl font-bold">¥{plan.totalCost.toLocaleString()}</p>
        </section>

        <section className="rounded-xl border p-5">
          <h2 className="text-lg font-semibold">年間維持コスト</h2>
          <p className="mt-3 text-2xl font-bold">¥{plan.annualCost.toLocaleString()}</p>
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
                <p className="text-sm text-gray-600">カテゴリ: {item.category}</p>
                <p className="text-sm text-gray-600">
                  商品種別: {getProductTypeLabel(item.productType)}
                </p>
                <p className="text-sm text-gray-600">優先度: {getPriorityLabel(item.priority)}</p>
                <p className="text-sm text-gray-600">価格: ¥{item.price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">小計: ¥{item.subtotal.toLocaleString()}</p>
                <p className="text-sm text-gray-600">提案理由: {item.reason}</p>
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
        <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{plan.explanation}</p>
      </section>

      <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold">注意文</h2>
        <div className="mt-3 space-y-2">
          {plan.warnings.map((warning, index) => (
            <p key={index} className="text-sm text-gray-700">
              {warning}
            </p>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          保存する
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          削除する
        </button>
      </div>
    </main>
  );
}
