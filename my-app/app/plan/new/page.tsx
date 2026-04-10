"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DAYS_OPTIONS = [
  { value: 3, label: "3日" },
  { value: 7, label: "7日" },
] as const;

const SCOPE_OPTIONS = [
  { value: false, label: "防災食のみ" },
  { value: true, label: "日常品を含む" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "minimum", label: "最低限そろえる" },
  { value: "balanced", label: "バランス重視" },
] as const;

type PlanConditionInput = {
  days: 3 | 7;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balanced";
};

type GeneratedPlanSummary = {
  familyMemberCount: number;
  days: number;
  includeDailyItems: boolean;
  priorityPolicy: string;
  totalCost: number;
  annualCost: number;
};

type GeneratedPlanItem = {
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

type GeneratedPlan = {
  summary: GeneratedPlanSummary;
  items: GeneratedPlanItem[];
  explanation: string;
  notice: string;
};

type ApiError = {
  code?: string;
  message?: string;
  details?: unknown;
};

type GeneratePlanResponse = {
  data: {
    plan: GeneratedPlan;
  } | null;
  error: ApiError | null;
};

export default function PlanNewPage() {
  const router = useRouter();

  const [form, setForm] = useState<PlanConditionInput>({
    days: 3,
    includeDailyItems: true,
    priorityPolicy: "balanced",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsFamilyRegistration, setNeedsFamilyRegistration] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setNeedsFamilyRegistration(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          days: form.days,
          includeDailyItems: form.includeDailyItems,
          priorityPolicy: form.priorityPolicy,
        }),
      });

      const result: GeneratePlanResponse = await response.json();

      if (!response.ok) {
        if (
          response.status === 422 &&
          result.error?.code === "FAMILY_MEMBERS_REQUIRED"
        ) {
          setNeedsFamilyRegistration(true);
          setErrorMessage(
            result.error.message ||
              "家族情報が未登録です。先に家族情報を登録してください。",
          );
          return;
        }

        throw new Error(result.error?.message || "プラン生成に失敗しました。");
      }

      if (!result.data?.plan) {
        throw new Error("生成結果の取得に失敗しました。");
      }

      sessionStorage.setItem("generatedPlan", JSON.stringify(result.data.plan));
      sessionStorage.setItem("planConditions", JSON.stringify(form));

      router.push("/plan/result");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "プラン生成に失敗しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">備えプランを作成</h1>
      <p className="mt-2 text-sm text-gray-600">
        家族条件に合わせて、備え候補を提案します。
      </p>

      {errorMessage ? (
        <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{errorMessage}</p>

          {needsFamilyRegistration ? (
            <div className="mt-3">
              <Link
                href="/family"
                className="inline-block rounded bg-red-700 px-3 py-2 text-white no-underline"
              >
                家族情報を登録する
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">プラン生成条件</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">想定日数</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.days}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    days: Number(e.target.value) as 3 | 7,
                  }))
                }
                disabled={isSubmitting}
              >
                {DAYS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">候補範囲</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={String(form.includeDailyItems)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    includeDailyItems: e.target.value === "true",
                  }))
                }
                disabled={isSubmitting}
              >
                {SCOPE_OPTIONS.map((option) => (
                  <option
                    key={String(option.value)}
                    value={String(option.value)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">優先方針</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.priorityPolicy}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priorityPolicy: e.target.value as "minimum" | "balanced",
                  }))
                }
                disabled={isSubmitting}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "生成中..." : "プランを生成する"}
          </button>
        </div>
      </form>
    </main>
  );
}
