"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  CreditCardIcon,
  PackageIcon,
  SparkleIcon,
  UsersThreeIcon,
  WalletIcon,
  BowlFoodIcon,
} from "@phosphor-icons/react";
import type { HomeResponse } from "@/src/types/home";

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
    <section className="flex h-full flex-col rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
      <div className="mb-3 text-center">
        <h2 className="text-xl font-semibold leading-snug text-gray-900">{title}</h2>
      </div>

      <div className="flex-1 text-center">{children}</div>

      {href && linkLabel ? (
        <div className="mt-2 pt-1 text-center">
          <Link
            href={href}
            className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-[#1E3A8A] transition-colors hover:bg-slate-50"
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
    <main className="min-h-full bg-white px-3 pb-4 pt-1">
      <div className="mx-auto w-full max-w-[920px]">
        {errorMessage ? (
          <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
            <p className="text-base font-medium text-gray-900">{errorMessage}</p>
          </section>
        ) : null}
        {!isLoading && nearExpiryItems.length > 0 ? (
          <section className="mb-3 w-full space-y-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-center gap-2">
              <p className="text-center text-xl font-semibold leading-relaxed text-gray-900">
                賞味期限が近い商品があります
              </p>
              <BowlFoodIcon size={30} weight="fill" className="text-gray-900" />
            </div>

            <div className="rounded-xl bg-white/80 px-4 py-3">
              <h2 className="text-center text-lg font-semibold leading-snug text-blue-900">
                期限が近い商品
              </h2>
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
            </div>
          </section>
        ) : null}
        <div className="grid w-full grid-cols-2 gap-3">
          <DashboardCard title="家族情報" href="/family" linkLabel="確認する">
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-900">
              <UsersThreeIcon size={40} weight="fill" className="text-[#1E3A8A]" />
              <p className="text-xl font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : memberCount !== undefined
                    ? `${memberCount}人を登録中`
                    : "未取得"}
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="コスト概要" href="/plans" linkLabel="確認する">
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-900">
              <WalletIcon size={40} weight="fill" className="text-[#1E3A8A]" />
              <p className="text-center text-xl font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : annualCost !== null && annualCost !== undefined
                    ? `年間 ¥${annualCost.toLocaleString()}`
                    : "未取得"}
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="備蓄品一覧" href="/stock-items" linkLabel="確認する">
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-900">
              <PackageIcon size={40} weight="fill" className="text-[#1E3A8A]" />
              <p className="text-xl font-semibold text-gray-900">
                {isLoading
                  ? "読み込み中..."
                  : stockCount !== undefined
                    ? `${stockCount}件を管理中`
                    : "未取得"}
              </p>
            </div>
          </DashboardCard>

          <DashboardCard title="料金プラン" href="/billing" linkLabel="確認する">
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-900">
              <CreditCardIcon size={40} weight="fill" className="text-[#1E3A8A]" />
              <div className="space-y-1 text-center">
                <p className="text-xl font-semibold text-gray-900">
                  {isLoading ? "読み込み中..." : planLabel}
                </p>
                <p className="text-xl text-gray-900">
                  {isLoading
                    ? ""
                    : maxSavedPlans !== undefined
                      ? `保存 ${maxSavedPlans}件まで`
                      : "未取得"}
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>
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
            <p className="text-center text-lg text-gray-900">読み込み中...</p>
          ) : savedPlans.length > 0 ? (
            <div className="grid gap-3 grid-cols-1">
              {savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 bg-blue-50 px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                >
                  <div className="mx-auto max-w-[520px]">
                    <h3 className="text-center text-xl font-semibold text-[#1E3A8A]">
                      {plan.title}
                    </h3>

                    <div className="mt-4 grid grid-cols-3 gap-3">
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
                      <div className="rounded-xl bg-white text-center px-3 py-3">
                        <p className="text-lg font-semibold text-gray-600">更新日</p>
                        <div className="mt-1 flex justify-center">
                          <p className="text-xl font-semibold text-gray-900 tabular-nums">
                            {new Date(plan.updatedAt).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center gap-2">
                    <Link
                      href={`/plans/${plan.id}`}
                      className="inline-flex min-w-[132px] items-center justify-center whitespace-nowrap rounded-xl bg-[#1E3A8A] px-4 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
                    >
                      プランを見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xl text-center text-gray-900">まだ保存済みプランはありません。</p>
          )}
        </section>
        <div className="mt-4 text-center">
          <Link
            href="/plan/new"
            className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <SparkleIcon size={25} weight="fill" />
            <span>新しく備えプランを作る</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
