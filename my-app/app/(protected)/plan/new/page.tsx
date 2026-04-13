"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SyntheticEvent } from "react";

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
  title: string;
  familyMemberCount: number;
  days: 3 | 7;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balanced";
  totalCost: number;
  annualCost: number;
  explanation: string;
  items: GeneratedPlanItem[];
  warnings: string[];
};

type ApiError = {
  code?: string;
  message?: string;
  details?: unknown;
};

type GeneratePlanResponse = {
  data: {
    generatedPlan: GeneratedPlan;
  } | null;
  error: ApiError | null;
};

type FamilyMembersResponse = {
  data:
    | {
        id: string;
        role: string;
        age_group: string;
        notes: string | null;
        allergens: string[];
        created_at: string;
        updated_at: string;
      }[]
    | null;
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

  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [isCheckingFamily, setIsCheckingFamily] = useState(false);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      setIsCheckingFamily(true);
      try {
        const response = await fetch("/api/family-members", {
          method: "GET",
          credentials: "include",
        });

        const result: FamilyMembersResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message || "家族情報の確認に失敗しました。",
          );
        }

        setHasFamily((result.data?.length ?? 0) > 0);
      } catch (error) {
        console.error(error);
        setHasFamily(null);
      } finally {
        setIsCheckingFamily(false);
      }
    };

    fetchFamilyMembers();
  }, []);

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    e.preventDefault();
    setErrorMessage("");
    setNeedsFamilyRegistration(false);

    if (isSubmitting || isCheckingFamily) return;

    if (hasFamily === false) {
      setNeedsFamilyRegistration(true);
      setErrorMessage("先に家族情報を登録してください。");
      return;
    }

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

      if (!result.data?.generatedPlan) {
        throw new Error("生成結果の取得に失敗しました。");
      }

      sessionStorage.setItem(
        "generatedPlan",
        JSON.stringify(result.data.generatedPlan),
      );
      sessionStorage.setItem("planConditions", JSON.stringify(form));

      router.push("/plans/temp");
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message === "Failed to fetch") {
        setErrorMessage(
          "通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。",
        );
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "プラン生成に失敗しました。時間をおいて再度お試しください。",
        );
      }
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

      {hasFamily === false && !errorMessage ? (
        <div className="mt-4 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <p>家族情報がまだ登録されていません。</p>
          <div className="mt-3">
            <Link
              href="/family"
              className="inline-block rounded bg-yellow-700 px-3 py-2 text-white no-underline"
            >
              家族情報を登録する
            </Link>
          </div>
        </div>
      ) : null}

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
                disabled={isSubmitting || isCheckingFamily}
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
                disabled={isSubmitting || isCheckingFamily}
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
                disabled={isSubmitting || isCheckingFamily}
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
            disabled={isSubmitting || isCheckingFamily}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCheckingFamily
              ? "家族情報を確認中..."
              : isSubmitting
                ? "生成中..."
                : "プランを生成する"}
          </button>
        </div>
      </form>
    </main>
  );
}
