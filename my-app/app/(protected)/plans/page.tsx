"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Plan = {
  id: string;
  title: string;
  familyMemberCount: number;
  totalEstimatedCost: number;
  updatedAt: string;
};

type PlansResponse = {
  data: Plan[] | null;
  error: {
    code: string;
    message: string;
    details: string | null;
  } | null;
};

type DeletePlanResponse = {
  data: {
    success: boolean;
  } | null;
  error: {
    code: string;
    message: string;
    details: string | null;
  } | null;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async (planId: string) => {
    const confirmed = window.confirm("このプランを削除しますか？");

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result: DeletePlanResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "削除に失敗しました。");
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "削除に失敗しました。");
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/plans", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result: PlansResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message || "保存済みプラン一覧の取得に失敗しました。",
          );
        }

        setPlans(result.data ?? []);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "保存済みプラン一覧の取得に失敗しました。",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const hasPlans = plans.length > 0;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">保存済みプラン一覧</h1>
          <p className="mt-1 text-sm text-gray-600">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">保存済みプラン一覧</h1>
        </div>

        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">保存済みプラン一覧</h1>
        <p className="mt-1 text-sm text-gray-600">
          保存済みプラン数: {plans.length}件
        </p>
      </div>

      {!hasPlans ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold">
            保存済みプランはまだありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            新しく備えプランを作成して保存すると、ここに一覧表示されます。
          </p>
          <div className="mt-4">
            <Link
              href="/plan/new"
              className="inline-block rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              備えプランを作る
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-xl border p-5 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{plan.title}</h2>
                <p className="text-sm text-gray-600">
                  家族人数: {plan.familyMemberCount}人
                </p>
                <p className="text-sm text-gray-600">
                  初期費用: ¥{plan.totalEstimatedCost.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  更新日: {new Date(plan.updatedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/plans/${plan.id}`}
                  className="rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  詳細を見る
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
