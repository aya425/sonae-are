"use client";

import Link from "next/link";
import { SparkleIcon, TrashIcon } from "@phosphor-icons/react";
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
          throw new Error(result.error?.message || "保存済みプラン一覧の取得に失敗しました。");
        }

        setPlans(result.data ?? []);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "保存済みプラン一覧の取得に失敗しました。"
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
      <main className="mx-auto w-full max-w-[920px] px-2 py-4">
        <div className="mb-4 text-center">
          <p className="text-xl text-gray-900">保存済みプラン数: 読み込み中...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="mx-auto w-full max-w-[920px] px-2 py-4">
        <div className="mb-4 text-center">
          <p className="text-xl font-semibold text-gray-900">保存済みプラン数: --件</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-medium text-gray-900">{errorMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[920px] px-2 py-4">
      <div className="mb-4 text-center">
        <p className="text-xl font-semibold text-gray-900">保存済みプラン数: {plans.length}件</p>
      </div>

      {!hasPlans ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-gray-900">保存済みプランはまだありません</h2>
          <p className="mt-2 text-lg text-gray-900">
            新しく備えプランを作成して保存すると、
            <br />
            ここに一覧表示されます。
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/plan/new"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1E3A8A] px-5 py-3 text-xl font-semibold text-white hover:bg-blue-800"
            >
              <SparkleIcon size={20} weight="fill" />
              <span>備えプランを作る</span>
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-3 grid-cols-1">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-slate-200 bg-blue-50 px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
            >
              <div className="mx-auto max-w-[520px]">
                <h2 className="text-center text-2xl font-semibold text-[#1E3A8A]">{plan.title}</h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-gray-600">家族人数</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {plan.familyMemberCount}人
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-gray-600">初期費用</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      ¥{plan.totalEstimatedCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3 text-center">
                    <p className="text-lg font-semibold text-gray-600">更新日</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {new Date(plan.updatedAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href={`/plans/${plan.id}`}
                  className="inline-flex min-w-[132px] items-center justify-center whitespace-nowrap rounded-xl bg-[#1E3A8A] px-4 py-3 text-lg font-semibold text-white hover:bg-blue-800"
                >
                  プランを見る
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  aria-label="削除"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-red-300 bg-white text-red-700 hover:bg-red-50"
                >
                  <TrashIcon size={25} weight="bold" />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
