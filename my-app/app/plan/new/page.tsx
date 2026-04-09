"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const DAYS_OPTIONS = [
  { value: 3, label: "3日" },
  { value: 7, label: "7日" },
];

const SCOPE_OPTIONS = [
  { value: false, label: "防災食のみ" },
  { value: true, label: "日常品を含む" },
];

const PRIORITY_OPTIONS = [
  { value: "minimum", label: "最低限そろえる" },
  { value: "balance", label: "バランス重視" },
];

type PlanConditionInput = {
  days: 3 | 7;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balance";
};

export default function PlanNewPage() {
  const router = useRouter();

  const [form, setForm] = useState<PlanConditionInput>({
    days: 3,
    includeDailyItems: true,
    priorityPolicy: "balance",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFamily] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!hasFamily) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("plan condition:", form);

      // 仮遷移（API未接続）
      router.push("/plan/result");
    } catch (error) {
      console.error(error);
      setErrorMessage("プラン生成に失敗しました。");
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
          {errorMessage}
        </div>
      ) : null}

      {!isSubmitting && !hasFamily && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            備えプランを作るには、先に家族情報の登録が必要です。
          </p>
          <Link
            href="/family"
            className="mt-3 inline-block text-sm font-medium text-blue-600 underline"
          >
            家族情報を登録する
          </Link>
        </div>
      )}

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
                    priorityPolicy: e.target.value as "minimum" | "balance",
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
            disabled={isSubmitting || !hasFamily}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "生成中..." : "プランを生成する"}
          </button>

          {isSubmitting && (
            <p className="mt-4 text-sm text-gray-600">
              備えプランを作成しています...
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
