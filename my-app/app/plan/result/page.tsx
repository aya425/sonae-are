"use client";

import { useEffect, useState } from "react";

type PlanItem = {
  id: string;
  name: string;
  category: string;
  productType: string;
  isFreeFrom28: boolean;
  price: number;
  purchaseUrl: string;
  shelfLifeMonths: number;
  isActive: boolean;
  quantity: number;
  subtotal: number;
  priority: string;
  reason: string;
};

type GeneratedPlanSummary = {
  familyMemberCount: number;
  days: number;
  includeDailyItems: boolean;
  priorityPolicy: string;
  totalCost: number;
  annualCost: number;
};

type GeneratedPlan = {
  summary?: GeneratedPlanSummary;
  items: PlanItem[];
  explanation: string;
  notice: string;
};

export default function PlanResultPage() {
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("generatedPlan");

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GeneratedPlan;
        setPlan(parsed);
      } catch (error) {
        console.error("generatedPlan の読み込みに失敗しました", error);
      }
    }

    setIsLoaded(true);
  }, []);

  const totalCost =
    plan?.items.reduce((sum, item) => sum + item.subtotal, 0) ?? 0;

  if (!isLoaded) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">備えプラン結果</h1>
        <p className="text-sm text-gray-600">プランを読み込んでいます...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">備えプラン結果</h1>
        <p className="text-sm text-gray-600">
          表示するプランがありません。もう一度プランを生成してください。
        </p>
      </div>
    );
  }

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
        <p className="text-sm leading-7 text-gray-600">{plan.explanation}</p>
      </div>

      <div className="mb-6 rounded-lg border bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">注意事項</p>
        <p className="text-sm leading-7 text-gray-600">{plan.notice}</p>
      </div>

      <div className="grid gap-4">
        {plan.items.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <span className="text-sm px-2 py-1 rounded bg-gray-100">
                {item.productType === "emergency_food"
                  ? "防災食"
                  : "日常転用品"}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <p>カテゴリ: {item.category}</p>
              <p>数量: {item.quantity}</p>
              <p>単価: {item.price}円</p>
              <p>小計: {item.subtotal}円</p>
              <p>優先度: {item.priority}</p>
              <p>理由: {item.reason}</p>
            </div>

            <a
              href={item.purchaseUrl}
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
