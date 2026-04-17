"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { HomeResponse } from "@/lib/types/home";

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
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
      <div className="mb-3 text-center">
        <h2 className="text-xl font-semibold leading-snug text-gray-900">{title}</h2>
      </div>

      <div className="flex-1 text-center">{children}</div>

      {href && linkLabel ? (
        <div className="mt-2 pt-1 text-center">
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-base font-semibold text-[#1E3A8A] transition-colors hover:bg-slate-100"
          >
            {linkLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<HomeResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const isEmptyStatePreview = false;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/home", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result: HomeResponse | { data: null; error: { message?: string } | null } =
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
    <main className="min-h-full bg-slate-50 px-3 py-4">
      <div className="mx-auto w-full max-w-[920px]">
        <div className="mb-4 text-center">
          <Link
            href="/plan/new"
            className="inline-flex min-w-[240px] items-center justify-center rounded-xl bg-[#1E3A8A] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
          >
            新しく備えプランを作る
          </Link>
        </div>

        {errorMessage ? (
          <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
            <p className="text-base font-medium text-gray-900">{errorMessage}</p>
          </section>
        ) : null}

        <div className="grid w-full grid-cols-2 gap-3">
          <DashboardCard title="家族情報" href="/family" linkLabel="家族情報を見る">
            <div className="space-y-1 text-lg text-gray-900">
              <p className="mt-2 font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : memberCount !== undefined
                    ? `登録人数: ${memberCount}人`
                    : "登録人数: 未取得"}
              </p>
              <div className="mt-5 flex flex-1 items-center justify-center">
                <p>
                  家族情報を
                  <br />
                  確認・編集
                  <br />
                  できます
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="コスト概要" href="/plans" linkLabel="プランを見る">
            <div className="space-y-2 text-lg text-gray-900">
              <p className="font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : `年間維持コスト: ${annualCost !== null && annualCost !== undefined ? `¥${annualCost.toLocaleString()}` : "未取得"}`}
              </p>
              <p>
                保存済みプラン
                <br />
                をもとに算出
                <br />
                しています
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="期限が近い商品" href="/stock-items" linkLabel="確認する">
            <div className="flex h-full flex-col text-gray-900">
              <p className="text-lg font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : dashboard
                    ? `件数: ${nearExpiryItems.length}件`
                    : "件数: 未取得"}
              </p>
              <div className="flex flex-1 items-center justify-center">
                {isLoading ? (
                  <p>読み込み中...</p>
                ) : nearExpiryItems.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-center">
                    {nearExpiryItems.map((item) => (
                      <li key={item.id} className="list-none text-xl">
                        {item.productName}
                        <br />
                        あと{item.daysLeft}日
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-lg text-gray-900">
                    期限が近い商品は
                    <br />
                    ありません
                  </p>
                )}
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="備蓄品一覧" href="/stock-items" linkLabel="備蓄品一覧を見る">
            <div className="flex h-full flex-col text-lg text-gray-900">
              <p className="font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : stockCount !== undefined
                    ? `登録済み備蓄: ${stockCount}件`
                    : "登録済み備蓄: 未取得"}
              </p>
              <div className="mt-2 flex flex-1 items-center justify-center">
                <p>
                  備蓄の登録・
                  <br />
                  確認・削除が
                  <br />
                  できます
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="料金プラン" href="/billing" linkLabel="料金プランを見る">
            <div className="space-y-3 text-lg text-gray-900">
              <p className="font-semibold text-gray-900">
                {isLoading ? "読み込み中..." : `現在: ${planLabel}`}
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

        <section className="mt-4 w-full space-y-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <p className="text-center text-lg font-semibold leading-relaxed text-gray-900">
            賞味期限が近い商品があります。
            <br />
            必要に応じて、備蓄品一覧から
            <br />
            確認してください。
          </p>

          <div className="rounded-xl bg-white/80 px-4 py-3">
            <h2 className="text-center text-lg font-semibold leading-snug text-gray-900">
              期限が近い商品
            </h2>
            {isLoading ? (
              <p className="mt-2 text-lg text-gray-900">読み込み中...</p>
            ) : nearExpiryItems.length > 0 ? (
              <div className="mt-3 space-y-0">
                {nearExpiryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-1 rounded-xl bg-white px-4 py-3"
                  >
                    <p className="text-xl font-semibold text-slate-800">{item.productName}</p>
                    <p className="whitespace-nowrap text-xl font-semibold text-red-500">
                      あと{item.daysLeft}日
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-lg text-gray-900">期限が近い商品はありません</p>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div />
            <h2 className="text-center text-xl font-semibold leading-snug text-gray-900">
              保存済みプラン
            </h2>
            <div className="flex justify-end">
              <Link
                href="/plans"
                className="text-lg font-semibold text-[#1E3A8A] transition-colors hover:text-blue-800"
              >
                一覧へ
              </Link>
            </div>
          </div>

          {isLoading ? (
            <p className="text-lg text-gray-900">読み込み中...</p>
          ) : savedPlans.length > 0 ? (
            <div className="grid w-full grid-cols-2 gap-3">
              {savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="h-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm"
                >
                  <p className="text-xl font-semibold leading-snug text-gray-900">{plan.title}</p>
                  <div className="mt-2 space-y-1 text-lg font-semibold text-gray-900">
                    <p>初期費用: ¥{plan.totalEstimatedCost.toLocaleString()}</p>
                    <p>更新日: {new Date(plan.updatedAt).toLocaleDateString("ja-JP")}</p>
                  </div>

                  <div className="mt-4 text-center">
                    <Link
                      href={`/plans/${plan.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-base font-semibold text-[#1E3A8A] transition-colors hover:bg-slate-100"
                    >
                      詳細を見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">まだ保存済みプランはありません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
