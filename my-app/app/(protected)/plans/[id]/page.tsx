"use client";

import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  FloppyDiskIcon,
  PackageIcon,
  ShoppingBagOpenIcon,
  SparkleIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
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
  productId?: string;
  shelfLifeMonths: number;
  isActive: boolean;
  quantity: number;
  subtotal: number;
  priority: "high" | "medium" | "low";
  reason: string;
};

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [plan, setPlan] = useState<PlanCondition>({
    title: "",
    familyMemberCount: 0,
    days: 3,
    includeDailyItems: false,
    priorityPolicy: "minimum",
    totalCost: 0,
    annualCost: 0,
    explanation: "",
    warnings: [],
  });
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editFamilyMemberCount, setEditFamilyMemberCount] = useState(0);
  const [editDays, setEditDays] = useState<3 | 7 | 14>(3);
  const [isEditing, setIsEditing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    const planId = params.id;

    if (!planId) {
      setIsLoaded(true);
      return;
    }

    const fetchPlanDetail = async () => {
      try {
        const response = await fetch(`/api/plans/${planId}`, {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "プランの取得に失敗しました。");
        }

        const fetchedPlan = result.data as {
          title: string;
          familyMemberCount: number;
          days: 3 | 7 | 14;
          includeDailyItems: boolean;
          priorityPolicy: "minimum" | "balanced";
          totalEstimatedCost: number;
          annualCost: number;
          aiComment: string;
          warnings: string[];
          items: PlanItem[];
        };

        setPlan({
          title: fetchedPlan.title,
          familyMemberCount: fetchedPlan.familyMemberCount,
          days: fetchedPlan.days,
          includeDailyItems: fetchedPlan.includeDailyItems,
          priorityPolicy: fetchedPlan.priorityPolicy,
          totalCost: fetchedPlan.totalEstimatedCost,
          annualCost: fetchedPlan.annualCost,
          explanation: fetchedPlan.aiComment,
          warnings: fetchedPlan.warnings,
        });

        setEditTitle(fetchedPlan.title);
        setEditFamilyMemberCount(fetchedPlan.familyMemberCount);
        setEditDays(fetchedPlan.days);

        setPlanItems(fetchedPlan.items);
      } catch (error) {
        console.error("プラン詳細の取得に失敗しました", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchPlanDetail();
  }, [params.id]);

  const priorityPolicyLabel =
    plan.priorityPolicy === "minimum" ? "必要なものを優先する" : "いろいろバランスよくそろえる";

  const includeDailyItemsLabel = plan.includeDailyItems ? "普段の食品も含める" : "防災食だけで選ぶ";

  const handleRecalculateClick = async () => {
    const planId = params.id;

    if (!planId) {
      setActionError("再計算対象のプランIDが取得できませんでした。");
      return;
    }

    setActionError("");
    setActionSuccess("");
    setIsRecalculating(true);

    try {
      const response = await fetch(`/api/plans/${planId}/recalculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          familyMemberCount: editFamilyMemberCount,
          days: editDays,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "数量の再計算に失敗しました。");
      }

      const recalculated = result.data as {
        summary: {
          title: string;
          familyMemberCount: number;
          days: 3 | 7 | 14;
          totalEstimatedCost: number;
          annualCost: number;
        };
        items: PlanItem[];
      };

      setPlan((prev) => ({
        ...prev,
        familyMemberCount: recalculated.summary.familyMemberCount,
        days: recalculated.summary.days,
        totalCost: recalculated.summary.totalEstimatedCost,
        annualCost: recalculated.summary.annualCost,
      }));
      setPlanItems(recalculated.items);
      setIsEditing(true);
    } catch (error) {
      console.error("recalculate failed", error);
      setActionError(error instanceof Error ? error.message : "数量の再計算に失敗しました。");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSaveClick = async () => {
    const planId = params.id;

    if (!planId) {
      setActionError("保存対象のプランIDが取得できませんでした。");
      return;
    }

    const itemsForSave = planItems.map((item) => ({
      productId: item.productId ?? item.id,
      quantity: item.quantity,
    }));

    const hasMissingProductId = itemsForSave.some((item) => !item.productId);

    if (hasMissingProductId) {
      setActionError("保存に必要な商品IDが不足しています。");
      return;
    }

    setActionError("");
    setActionSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: editTitle,
          familyMemberCount: editFamilyMemberCount,
          days: editDays,
          totalEstimatedCost: plan.totalCost,
          annualCost: plan.annualCost,
          items: itemsForSave,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "プランの保存に失敗しました。");
      }

      setPlan((prev) => ({
        ...prev,
        title: editTitle,
        familyMemberCount: editFamilyMemberCount,
        days: editDays,
      }));
      setIsEditing(false);
      setActionSuccess("保存完了");
    } catch (error) {
      console.error("save failed", error);
      setActionError(error instanceof Error ? error.message : "プランの保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const getProductTypeLabel = (productType: PlanItem["productType"]) =>
    productType === "daily_item" ? "日常品" : "防災食";

  const getPriorityLabel = (priority: PlanItem["priority"]) => {
    if (priority === "high") return "高";
    if (priority === "medium") return "中";
    return "低";
  };

  const getPriorityBadgeClass = (priority: PlanItem["priority"]) => {
    if (priority === "high") {
      return "bg-red-50 text-red-700 border border-red-400";
    }
    if (priority === "medium") {
      return "bg-orange-50 text-orange-700 border border-orange-400";
    }
    return "bg-yellow-50 text-yellow-700 border border-yellow-400";
  };

  const getPriorityCardClass = (priority: PlanItem["priority"]) => {
    if (priority === "high") {
      return "border-red-200 bg-red-50";
    }
    if (priority === "medium") {
      return "border-orange-200 bg-orange-50";
    }
    return "border-yellow-200 bg-yellow-50";
  };

  const getCategoryBadgeClass = (productType: PlanItem["productType"]) =>
    productType === "daily_item"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-blue-50 text-blue-700 border border-blue-200";

  const handleDelete = async () => {
    const confirmed = window.confirm("このプランを削除しますか？");
    if (!confirmed) return;

    const planId = params.id;

    if (!planId) {
      alert("削除対象のプランIDが取得できませんでした。");
      return;
    }

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "プランの削除に失敗しました。");
      }

      router.push("/plans");
    } catch (error) {
      console.error("delete failed", error);
      alert(error instanceof Error ? error.message : "プランの削除に失敗しました。");
    }
  };

  if (!isLoaded) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="p-5">
          <p className="text-center text-xl text-gray-900">プランを読み込んでいます...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[920px] px-2 py-4">
      <section className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <h2 className="text-center text-xl font-semibold text-[#1E3A8A]">プラン条件</h2>

        <div className="mt-4 space-y-3">
          <label className="block rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="block text-lg font-semibold text-slate-600">プラン名</span>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                setIsEditing(true);
                setActionError("");
                setActionSuccess("");
              }}
              className="mt-2 w-full rounded-xl border border-black px-3 py-2 text-lg font-semibold text-gray-900 outline-none focus:border-black"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="block text-lg font-semibold text-slate-600">人数</span>
              <input
                type="number"
                min={1}
                value={editFamilyMemberCount}
                onChange={(e) => {
                  setEditFamilyMemberCount(Number(e.target.value));
                  setIsEditing(true);
                  setActionError("");
                  setActionSuccess("");
                }}
                className="mt-2 w-full rounded-xl border border-black px-3 py-2 text-lg font-semibold text-gray-900 outline-none focus:border-black"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="block text-lg font-semibold text-slate-600">日数</span>
              <select
                value={editDays}
                onChange={(e) => {
                  setEditDays(Number(e.target.value) as 3 | 7 | 14);
                  setIsEditing(true);
                  setActionError("");
                  setActionSuccess("");
                }}
                className="mt-2 w-full rounded-xl border border-black px-3 py-2 text-lg font-semibold text-gray-900 outline-none focus:border-black"
              >
                <option value={3}>3日</option>
                <option value={7}>7日</option>
                <option value={14}>14日</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-lg font-semibold text-gray-900">
            {includeDailyItemsLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-lg font-semibold text-gray-900">
            {priorityPolicyLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRecalculateClick}
            disabled={isRecalculating || isSaving}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-lg font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowsClockwiseIcon size={22} weight="bold" />
            <span>{isRecalculating ? "再計算中..." : "再計算"}</span>
          </button>
        </div>

        {actionError ? (
          <p className="mt-3 text-center text-sm font-medium text-red-600">{actionError}</p>
        ) : null}
        {isEditing ? (
          <p className="mt-4 text-center text-xl font-semibold text-slate-900">
            編集内容はまだ保存されていません。
          </p>
        ) : null}
      </section>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <section className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-[#1E3A8A]">初期費用</h2>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ¥{plan.totalCost.toLocaleString()}
          </p>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-[#1E3A8A]">年間維持コスト</h2>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ¥{plan.annualCost.toLocaleString()}
          </p>
        </section>
      </div>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <h2 className="text-center text-xl font-semibold text-[#1E3A8A]">商品一覧</h2>
        <div className="mt-4 space-y-3">
          {planItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border px-4 py-4 shadow-sm ${getPriorityCardClass(item.priority)}`}
            >
              <div>
                <p className="text-xl font-semibold text-gray-900">{item.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-nowrap gap-2 overflow-hidden">
                    <span
                      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-base font-semibold ${getPriorityBadgeClass(item.priority)}`}
                    >
                      優先度 {getPriorityLabel(item.priority)}
                    </span>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-base font-semibold ${getCategoryBadgeClass(item.productType)}`}
                    >
                      {getProductTypeLabel(item.productType)}
                    </span>
                    <span className="inline-flex shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-base font-semibold text-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <p className="ml-2 shrink-0 text-lg font-semibold text-gray-900">
                    数量：{item.quantity}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white px-3 py-3 text-center">
                  <p className="text-base font-semibold text-gray-700">単価</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ¥{item.price.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-3 text-center">
                  <p className="text-base font-semibold text-gray-700">小計</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ¥{item.subtotal.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-3 text-center">
                  <p className="text-base font-semibold text-gray-700">保存目安</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {item.shelfLifeMonths}か月
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white px-4 py-3">
                <p className="text-base font-semibold text-gray-900">提案理由</p>
                <p className="mt-1 text-lg leading-relaxed text-gray-900">{item.reason}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <a
                  href={item.purchaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-lg font-semibold text-white hover:bg-blue-800"
                >
                  <ShoppingBagOpenIcon size={22} weight="fill" />
                  <span className="truncate">商品を見る</span>
                </a>
                <a
                  href="/stock-items"
                  className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-gray-700 hover:bg-slate-50"
                >
                  <PackageIcon size={24} weight="fill" />
                  <span className="truncate">備蓄登録</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-center text-xl font-semibold text-gray-900">AI説明補助</h2>
          <SparkleIcon size={25} weight="fill" className="text-[#1E3A8A]" />
        </div>
        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-4 text-lg leading-relaxed text-gray-900 whitespace-pre-line">
          {plan.explanation}
        </p>
      </section>

      <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-center text-xl font-semibold text-gray-900">ご注意</h2>
          <WarningIcon size={27} weight="fill" className="text-amber-600" />
        </div>
        <div className="mt-3 space-y-0">
          {plan.warnings.map((warning, index) => (
            <div key={index} className="rounded-xl bg-white/70 px-4 py-3">
              <p className="text-lg leading-relaxed text-gray-900">{warning}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving || isRecalculating}
          className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-lg font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FloppyDiskIcon size={22} weight="bold" />
          <span>{isSaving ? "保存中..." : "保存"}</span>
        </button>
        {actionSuccess ? (
          <div className="inline-flex items-center gap-2 text-lg font-semibold text-[#1E3A8A]">
            <CheckCircleIcon size={40} weight="fill" />
            <p>{actionSuccess}</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleDelete}
          aria-label="削除"
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-red-300 bg-white text-red-700 hover:bg-red-50"
        >
          <TrashIcon size={25} weight="bold" />
        </button>
      </div>
    </main>
  );
}
