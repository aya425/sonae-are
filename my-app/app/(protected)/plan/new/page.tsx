"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SyntheticEvent } from "react";

const DAYS_OPTIONS = [
  { value: 3, label: "3日（まずはこれ）" },
  { value: 7, label: "7日 (安心して備える)" },
  { value: 14, label: "14日 (万全に備える)" },
] as const;

const DAYS_HELP_TEXT: Record<3 | 7 | 14, string> = {
  3: "災害直後を乗り切る最低限の備え",
  7: "ライフライン停止も想定した安心の備え",
  14: "長期化にも対応できる余裕ある備え",
};

const SCOPE_OPTIONS = [
  { value: false, label: "防災食だけで選ぶ" },
  { value: true, label: "普段の食品も含める" },
] as const;

const SCOPE_HELP_TEXT = {
  false: "長期保存できる専用食品だけで備えます",
  true: "普段食べている食品も活用して備えます",
} as const;

const PRIORITY_OPTIONS = [
  { value: "minimum", label: "必要なものを優先する" },
  { value: "balanced", label: "いろいろバランスよくそろえる" },
] as const;

const PRIORITY_HELP_TEXT: Record<"minimum" | "balanced", string> = {
  minimum: "主食や水など、重要なものから優先して提案します",
  balanced: "主食・おかず・おやつなどをバランスよく提案します",
};

type PlanConditionInput = {
  days: 3 | 7 | 14;
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
  days: 3 | 7 | 14;
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
    days: 7,
    includeDailyItems: true,
    priorityPolicy: "minimum",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsFamilyRegistration, setNeedsFamilyRegistration] = useState(false);
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [isCheckingFamily, setIsCheckingFamily] = useState(false);

  const selectedDaysHelpText = DAYS_HELP_TEXT[form.days];
  const selectedScopeHelpText = form.includeDailyItems
    ? SCOPE_HELP_TEXT.true
    : SCOPE_HELP_TEXT.false;
  const selectedPriorityHelpText = PRIORITY_HELP_TEXT[form.priorityPolicy];

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
          throw new Error(result.error?.message || "家族情報の確認に失敗しました。");
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

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
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
        if (response.status === 422 && result.error?.code === "FAMILY_MEMBERS_REQUIRED") {
          setNeedsFamilyRegistration(true);
          setErrorMessage(
            result.error.message || "家族情報が未登録です。先に家族情報を登録してください。"
          );
          return;
        }

        throw new Error(result.error?.message || "プラン生成に失敗しました。");
      }

      if (!result.data?.generatedPlan) {
        throw new Error("生成結果の取得に失敗しました。");
      }

      sessionStorage.setItem("generatedPlan", JSON.stringify(result.data.generatedPlan));
      sessionStorage.setItem("planConditions", JSON.stringify(form));

      router.push("/plans/temp");
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message === "Failed to fetch") {
        setErrorMessage("通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。");
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "プラン生成に失敗しました。時間をおいて再度お試しください。"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <p className="text-lg font-medium leading-7 text-[#1E3A8A]">
            家族条件に合わせて、
            <br />
            備え候補を迷わず選べるように
            <br />
            条件を設定します。
          </p>
        </div>

        {hasFamily === false && !errorMessage ? (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <p>家族情報がまだ登録されていません。</p>
            <div className="mt-3">
              <Link
                href="/family"
                className="inline-block rounded-md bg-yellow-700 px-3 py-2 text-white no-underline hover:bg-yellow-800"
              >
                家族情報を登録する
              </Link>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{errorMessage}</p>

            {needsFamilyRegistration ? (
              <div className="mt-3">
                <Link
                  href="/family"
                  className="inline-block rounded-md bg-red-700 px-3 py-2 text-white no-underline hover:bg-red-800"
                >
                  家族情報を登録する
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6">
          <aside className="h-fit rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">選び方のヒント</h2>

            <div className="mt-4 space-y-4 text-base text-gray-700">
              <div>
                <p className="font-medium text-lg text-gray-900">想定日数</p>
                <p className="mt-1">
                  まずは3日分から始めると、最小構成で無理なく備えやすくなります。
                </p>
              </div>

              <div>
                <p className="font-medium text-lg text-gray-900">候補範囲</p>
                <p className="mt-1">
                  日常品も含めると、普段使いしながら備えを維持しやすくなります。
                </p>
              </div>

              <div>
                <p className="font-medium text-lg text-gray-900">優先方針</p>
                <p className="mt-1">
                  迷う場合は「バランス重視」を選ぶと、主食・飲料・おかずを偏りなく確認できます。
                </p>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">プラン生成条件</h2>
              <p className="mt-1 text-base text-gray-500">
                必要な条件を選ぶと、家族に合わせた備え候補を生成できます。
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-lg border p-4">
                  <label className="mb-2 block text-lg font-medium text-gray-900">想定日数</label>

                  <p className="mb-2 rounded-md bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-600">
                    {selectedDaysHelpText}
                  </p>

                  <select
                    className="w-full rounded-md border px-3 py-2 text-base"
                    value={form.days}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        days: Number(e.target.value) as 3 | 7 | 14,
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

                <div className="rounded-lg border p-4">
                  <label className="mb-2 block text-lg font-medium text-gray-900">候補範囲</label>

                  <p className="mb-2 rounded-md bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-600">
                    {selectedScopeHelpText}
                  </p>

                  <select
                    className="w-full rounded-md border px-3 py-2 text-base"
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
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border p-4">
                  <label className="mb-2 block text-lg font-medium text-gray-900">優先方針</label>

                  <p className="mb-2 rounded-md bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-600">
                    {selectedPriorityHelpText}
                  </p>

                  <select
                    className="w-full rounded-md border px-3 py-2 text-base"
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

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || isCheckingFamily}
                  className="rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCheckingFamily
                    ? "家族情報を確認中..."
                    : isSubmitting
                      ? "生成中..."
                      : "プランを生成する"}
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </main>
  );
}
