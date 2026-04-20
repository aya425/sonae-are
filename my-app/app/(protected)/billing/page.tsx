"use client";

import { useEffect, useState } from "react";

type MeResponse = {
  data?: {
    subscription?: {
      status?: string | null;
      planCode?: string | null;
      plan_code?: string | null;
      currentPeriodEnd?: string | null;
      cancelAtPeriodEnd?: boolean | null;
    } | null;
    planCode?: string | null;
    plan_code?: string | null;
    isPremium?: boolean | null;
  } | null;
};

function isPremiumUserResponse(json: MeResponse): boolean {
  const data = json?.data;
  if (!data) return false;

  if (data.isPremium === true) return true;

  const planCode = data.planCode ?? data.plan_code;
  if (planCode === "premium") return true;

  const subscription = data.subscription;
  if (!subscription) return false;

  const subscriptionPlanCode = subscription.planCode ?? subscription.plan_code;
  const subscriptionStatus = subscription.status ?? null;

  return subscriptionPlanCode === "premium" && subscriptionStatus !== "canceled";
}

export default function BillingPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPlanStatus = async () => {
      try {
        setIsCheckingPlan(true);

        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (isMounted) {
            setIsPremiumUser(false);
            setShowCancelConfirm(false);
            setCancelAtPeriodEnd(false);
          }
          return;
        }

        const json: MeResponse = await res.json();

        if (isMounted) {
          const premium = isPremiumUserResponse(json);
          const cancelScheduled = json.data?.subscription?.cancelAtPeriodEnd === true;

          setIsPremiumUser(premium);
          setCancelAtPeriodEnd(cancelScheduled);

          if (premium) {
            setShowConfirm(false);
          } else {
            setShowCancelConfirm(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch plan status", error);
        if (isMounted) {
          setIsPremiumUser(false);
          setShowCancelConfirm(false);
          setCancelAtPeriodEnd(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingPlan(false);
        }
      }
    };

    fetchPlanStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckout = async () => {
    if (isPremiumUser) {
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok || !json.data?.url) {
        console.error("Failed to create checkout session", json.error);
        alert(json.error?.message ?? "決済画面への遷移に失敗しました。");
        return;
      }

      window.location.href = json.data.url;
    } catch (error) {
      console.error("Checkout request failed", error);
      alert("決済画面への遷移に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setShowCancelConfirm(false);
      setIsCanceling(true);

      const res = await fetch("/api/payments/cancel", {
        method: "POST",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error?.message ?? "解約に失敗しました。");
        return;
      }

      alert(json.data?.message ?? "解約処理を受け付けました。");
      setCancelAtPeriodEnd(true);
      setShowCancelConfirm(false);
      setIsPremiumUser(true);
    } catch (error) {
      console.error("Cancel request failed", error);
      alert("解約に失敗しました。");
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <main className="px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4">
              <p className="text-lg font-semibold text-slate-600">無料プラン</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">無料で使う</h2>
            </div>

            <div className="space-y-3 text-xl font-medium text-slate-900">
              <p>保存可能な備えプラン数：1件</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[rgba(30,58,138,0.22)] bg-blue-50 p-6 shadow-sm ring-1 ring-[rgba(30,58,138,0.08)]">
            <div className="mb-4">
              <p className="text-lg font-semibold text-[#1E3A8A]">有料プラン</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">プレミアムプラン</h2>
            </div>

            <div className="space-y-3 text-xl text-slate-900">
              <p>保存可能な備えプラン数：99件</p>
              <p className="font-semibold">月額：500円</p>
            </div>

            <div className="mt-6">
              {isCheckingPlan ? (
                <div className="rounded-xl bg-white px-4 py-3 text-center text-lg font-medium text-slate-700">
                  プラン状態を確認中...
                </div>
              ) : isPremiumUser ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-white px-4 py-3 text-center text-lg font-semibold text-[#1E3A8A]">
                    {cancelAtPeriodEnd ? "自動更新は停止済みです" : "あなたはプレミアムプランです"}
                  </div>

                  {cancelAtPeriodEnd ? (
                    <div className="rounded-xl bg-white px-4 py-3 text-center text-lg font-semibold text-slate-900">
                      次回更新日まではプレミアムプランを利用できます。
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={isCanceling}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-3 text-lg font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCanceling ? "停止中..." : "自動更新を停止する"}
                      </button>

                      {showCancelConfirm ? (
                        <section className="rounded-2xl bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200">
                          <p className="text-lg font-semibold text-gray-900">
                            自動更新を停止しますか？
                          </p>
                          <p className="mt-2 text-lg text-gray-900">
                            次回更新日まではプレミアムプランを利用できます。
                          </p>

                          <div className="mt-4 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setShowCancelConfirm(false)}
                              disabled={isCanceling}
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              やめる
                            </button>

                            <button
                              type="button"
                              onClick={handleCancel}
                              disabled={isCanceling}
                              className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-lg font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isCanceling ? "停止中..." : "停止する"}
                            </button>
                          </div>
                        </section>
                      ) : null}
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-5 py-3 text-lg font-semibold text-white transition hover:bg-blue-800"
                >
                  有料プランに変更する
                </button>
              )}
            </div>
          </section>

          {showConfirm && !isPremiumUser ? (
            <section className="rounded-2xl bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-lg font-medium text-slate-900">決済画面へ進みますか？</p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  やめる
                </button>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-[#1E3A8A] px-4 py-2 text-lg font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "遷移中..." : "決済へ進む"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
