"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  productId?: string;
};

type StoredGeneratedPlan = {
  title: string;
  familyMemberCount: number;
  days: 3 | 7 | 14;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balanced";
  totalCost: number;
  annualCost: number;
  explanation: string;
  items: PlanItem[];
  warnings: string[];
};

const mockPlanCondition: Omit<StoredGeneratedPlan, "items"> = {
  title: "備えプラン",
  familyMemberCount: 0,
  days: 3,
  includeDailyItems: false,
  priorityPolicy: "minimum",
  totalCost: 0,
  annualCost: 0,
  explanation: "",
  warnings: [],
};

export default function TempPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Omit<StoredGeneratedPlan, "items">>(mockPlanCondition);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem("generatedPlan");

    if (!storedPlan) {
      setHasGeneratedPlan(false);
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
      setPlanItems(parsedPlan.items ?? []);
      setHasGeneratedPlan(true);
    } catch (error) {
      console.error("generatedPlanの読み込みに失敗しました", error);
      setHasGeneratedPlan(false);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleSave = async () => {
    if (!hasGeneratedPlan) return;

    const payload = {
      title: plan.title,
      familyMemberCount: plan.familyMemberCount,
      days: plan.days,
      priorityPolicy: plan.priorityPolicy,
      includeDailyItems: plan.includeDailyItems,
      totalEstimatedCost: plan.totalCost,
      annualCost: plan.annualCost,
      aiComment: plan.explanation,
      warnings: plan.warnings,
      items: (planItems ?? []).map((item) => ({
        productId: item.productId ?? item.id,
        quantity: item.quantity,
        priority: item.priority,
        purposeNote: item.reason,
      })),
    };

    try {
      setIsSaving(true);

      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "プランの保存に失敗しました。");
      }

      sessionStorage.removeItem("generatedPlan");
      sessionStorage.removeItem("planConditions");

      if (!result.data?.id) {
        throw new Error("保存後のプランIDが取得できませんでした。");
      }

      router.push(`/plans/${result.data.id}`);
    } catch (error) {
      console.error("save failed", error);
      alert(error instanceof Error ? error.message : "プランの保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const priorityPolicyLabel =
    plan.priorityPolicy === "minimum" ? "必要なものを優先する" : "いろいろバランスよくそろえる";

  const includeDailyItemsLabel = plan.includeDailyItems ? "普段の食品も含める" : "防災食だけで選ぶ";

  const getProductTypeLabel = (productType: PlanItem["productType"]) =>
    productType === "daily_item" ? "日常品" : "防災食";

  const getPriorityLabel = (priority: PlanItem["priority"]) => {
    if (priority === "high") return "高";
    if (priority === "medium") return "中";
    return "低";
  };

  const getPriorityBadgeClass = (priority: PlanItem["priority"]) => {
    if (priority === "high") {
      return "bg-red-50 text-red-700 border border-red-200";
    }
    if (priority === "medium") {
      return "bg-amber-50 text-amber-700 border border-amber-200";
    }
    return "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const getCategoryBadgeClass = (productType: PlanItem["productType"]) =>
    productType === "daily_item"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-blue-50 text-blue-700 border border-blue-200";

  if (!isLoaded) {
    return (
      <main className="mx-auto w-full max-w-[920px] px-2 py-4">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-600">プランを読み込んでいます...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[920px] px-2 py-4">
      {!hasGeneratedPlan ? (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-gray-900">未生成のプランです</h2>
          <p className="mt-2 text-base text-gray-700">
            先にプラン生成画面で条件を選んで、備えプランを作成してください。
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/plan/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              プラン生成画面へ戻る
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">AIが家族に合う備えプランを提案します</h1>
        <p className="mt-2 text-base text-gray-700">
          条件に合わせて、優先度やバランスを見ながら
          <br />
          備え候補を整理しています。
        </p>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <h2 className="text-center text-xl font-semibold text-gray-900">プラン条件</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base font-semibold text-gray-900">
            {plan.title}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base font-semibold text-gray-900">
            {plan.familyMemberCount}人家族
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base font-semibold text-gray-900">
            {plan.days}日分
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base font-semibold text-gray-900">
            {includeDailyItemsLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base font-semibold text-gray-900">
            {priorityPolicyLabel}
          </span>
        </div>
      </section>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-gray-900">初期費用</h2>
          <p className="mt-2 text-2xl font-bold text-[#1E3A8A]">
            ¥{plan.totalCost.toLocaleString()}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-gray-900">年間維持コスト</h2>
          <p className="mt-2 text-2xl font-bold text-[#1E3A8A]">
            ¥{plan.annualCost.toLocaleString()}
          </p>
        </section>
      </div>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <h2 className="text-center text-xl font-bold text-gray-900">商品一覧</h2>
        <div className="mt-4 space-y-3">
          {planItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div>
                <p className="text-xl font-semibold text-gray-900">{item.name}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-base font-semibold ${getPriorityBadgeClass(item.priority)}`}
                    >
                      優先度 {getPriorityLabel(item.priority)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-base font-semibold ${getCategoryBadgeClass(item.productType)}`}
                    >
                      {getProductTypeLabel(item.productType)}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-base font-semibold text-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <p className="mr-2 text-base font-semibold text-gray-900">
                    数量：{item.quantity}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-base font-semibold text-gray-700">単価</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ¥{item.price.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-base font-semibold text-gray-700">小計</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ¥{item.subtotal.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-base font-semibold text-gray-700">保存目安</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {item.shelfLifeMonths}か月
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-lg font-semibold text-gray-900">提案理由</p>
                <p className="mt-1 text-base font-medium leading-relaxed text-gray-900">
                  {item.reason}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <a
                  href={item.purchaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-[132px] items-center justify-center whitespace-nowrap rounded-xl bg-[#1E3A8A] px-4 py-3 text-base font-semibold text-white hover:bg-blue-800"
                >
                  商品を見る
                </a>
                <Link
                  href="/stock-items"
                  className="inline-flex min-w-[132px] items-center justify-center whitespace-nowrap rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold text-gray-700 hover:bg-slate-50"
                >
                  備蓄登録
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <h2 className="text-center text-xl font-semibold text-gray-900">AI説明補助</h2>
        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-4 text-base leading-relaxed text-gray-900 whitespace-pre-line">
          {plan.explanation}
        </p>
      </section>

      <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
        <h2 className="text-center text-xl font-semibold text-gray-900">注意文</h2>
        <div className="mt-3 space-y-0">
          {plan.warnings.map((warning, index) => (
            <div key={index} className="rounded-xl bg-white/70 px-4 py-3">
              <p className="text-base leading-relaxed text-gray-900">{warning}</p>
            </div>
          ))}
        </div>
      </section>

      {hasGeneratedPlan ? (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-[#1E3A8A] px-5 py-3 text-base font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
          <Link
            href="/plan/new"
            className="inline-flex min-w-[140px] items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-base font-semibold text-gray-700 hover:bg-slate-50"
          >
            条件を選び直す
          </Link>
        </div>
      ) : null}
    </main>
  );
}
