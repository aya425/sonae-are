"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { DashboardResponse } from "@/lib/types/dashboard";

function DashboardCard({
  title,
  children,
  href,
  linkLabel,
}: {
  title: string;
  children: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="flex h-full flex-col rounded-lg border bg-white p-3 shadow-sm">
      <div className="mb-3 text-center">
        <h2 className="text-sm font-semibold leading-snug text-gray-900">{title}</h2>
      </div>

      <div className="flex-1 text-center">{children}</div>

      {href && linkLabel ? (
        <div className="mt-3 pt-2 text-center">
          <Link href={href} className="text-xs font-semibold text-[#1E3A8A] hover:underline">
            {linkLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const isEmptyStatePreview = false;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/dashboard", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result: DashboardResponse | { data: null; error: { message?: string } | null } =
          await response.json();

        if (!response.ok || !result.data) {
          throw new Error(result.error?.message || "ホーム情報の取得に失敗しました。");
        }

        console.log("[dashboard] data", result.data);
        setDashboard(result.data);
      } catch (error) {
        console.error("[dashboard] fetch failed", error);
        setErrorMessage(
          error instanceof Error ? error.message : "ホーム情報の取得に失敗しました。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const savedPlans = isEmptyStatePreview ? [] : (dashboard?.savedPlans ?? []);
  const expiringItems = isEmptyStatePreview ? [] : (dashboard?.expiringItems.items ?? []);
  const nearExpiryItems = expiringItems.filter((item) => item.daysLeft <= 30);
  const memberCount = isEmptyStatePreview ? 0 : dashboard?.familySummary.memberCount;
  const annualCost = isEmptyStatePreview ? null : dashboard?.costSummary.annualCost;
  const stockCount = isEmptyStatePreview ? 0 : dashboard?.stockSummary.count;
  const planCode = isEmptyStatePreview ? "free" : dashboard?.billingSummary.planCode;
  const maxSavedPlans = isEmptyStatePreview ? 1 : dashboard?.billingSummary.maxSavedPlans;
  const planLabel =
    planCode === "premium" ? "有料プラン" : planCode === "free" ? "無料プラン" : "未取得";

  return (
    <main className="h-full min-h-full bg-white px-3 py-6">
      <div className="mx-auto w-full max-w-none bg-white">
        <div className="mb-6 flex flex-col items-center gap-4 bg-white text-center">
          <Link
            href="/plan/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            新しく備えプランを作る
          </Link>
        </div>

        {errorMessage ? (
          <section className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </section>
        ) : null}

        <div className="grid w-full grid-cols-2 gap-3">
          <DashboardCard title="家族情報" href="/family" linkLabel="家族情報を見る">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : memberCount !== undefined
                    ? `登録人数: ${memberCount}人`
                    : "登録人数: 未取得"}
              </p>
              <p>
                家族条件を
                <br />
                確認・編集できます
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="コスト概要" href="/plans" linkLabel="保存済みプランを見る">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : `年間維持コスト: ${annualCost !== null && annualCost !== undefined ? `¥${annualCost.toLocaleString()}` : "未取得"}`}
              </p>
              <p>
                保存済みプランをもとに
                <br />
                年間維持コストを
                <br />
                確認できます
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="期限が近い商品" href="/stock-items" linkLabel="確認する">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : dashboard
                    ? `件数: ${nearExpiryItems.length}件`
                    : "件数: 未取得"}
              </p>
              {isLoading ? (
                <p>読み込み中...</p>
              ) : nearExpiryItems.length > 0 ? (
                <ul className="space-y-0.5 text-center">
                  {nearExpiryItems.map((item) => (
                    <li key={item.id} className="list-none">
                      {item.productName}
                      <br />
                      （あと{item.daysLeft}日）
                    </li>
                  ))}
                </ul>
              ) : (
                <p>期限が近い商品はありません</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard title="備蓄品一覧" href="/stock-items" linkLabel="備蓄品一覧を見る">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : stockCount !== undefined
                    ? `登録済み備蓄品: ${stockCount}件`
                    : "登録済み備蓄品: 未取得"}
              </p>
              <p>
                備蓄の登録・確認・削除が
                <br />
                できます
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="料金プラン" href="/billing" linkLabel="料金プランを見る">
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">
                {isLoading ? "読み込み中..." : `現在のプラン: ${planLabel}`}
              </p>
              <p>
                {isLoading
                  ? "読み込み中..."
                  : maxSavedPlans !== undefined
                    ? `保存可能件数: ${maxSavedPlans}件`
                    : "保存可能件数: 未取得"}
              </p>
            </div>
          </DashboardCard>
        </div>

        <section className="mt-4 w-full space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold leading-relaxed text-gray-900">
            賞味期限が近い商品があります。必要に応じて備蓄品一覧から確認してください。
          </p>

          <div className="rounded-md bg-white/70 p-3">
            <h2 className="text-sm font-semibold leading-snug text-gray-900">期限が近い商品</h2>
            {isLoading ? (
              <p className="mt-2 text-sm text-gray-700">読み込み中...</p>
            ) : nearExpiryItems.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-sm text-gray-800">
                {nearExpiryItems.map((item) => (
                  <li key={item.id} className="ml-5 list-disc leading-relaxed">
                    {item.productName}（あと{item.daysLeft}日）
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-700">期限が近い商品はありません</p>
            )}
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold leading-snug text-gray-900">保存済みプラン</h2>
            <Link href="/plans" className="text-xs font-semibold text-[#1E3A8A] hover:underline">
              一覧へ
            </Link>
          </div>

          {isLoading ? (
            <p className="text-xs text-gray-500">読み込み中...</p>
          ) : savedPlans.length > 0 ? (
            <div className="grid w-full grid-cols-2 gap-3">
              {savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="h-full rounded-lg border bg-white p-3 text-center shadow-sm"
                >
                  <p className="text-sm font-semibold leading-snug text-gray-900">{plan.title}</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-700">
                    <p>{plan.days}日分</p>
                    <p>初期費用: ¥{plan.totalEstimatedCost.toLocaleString()}</p>
                    <p>更新日: {new Date(plan.updatedAt).toLocaleDateString("ja-JP")}</p>
                  </div>

                  <div className="mt-3 text-center">
                    <Link
                      href={`/plans/${plan.id}`}
                      className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                    >
                      詳細を見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">まだ保存済みプランはありません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
