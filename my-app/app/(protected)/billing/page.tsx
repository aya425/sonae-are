"use client";

import Link from "next/link";
import { useState } from "react";

export default function BillingPage() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <main className="px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-500">無料プラン</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">無料で使う</h2>
            </div>

            <div className="space-y-3 text-base font-medium text-slate-700">
              <p>保存可能な備えプラン数：1件</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[rgba(30,58,138,0.22)] bg-white p-6 shadow-sm ring-1 ring-[rgba(30,58,138,0.08)]">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#1E3A8A]">有料プラン</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">プレミアムプラン</h2>
            </div>

            <div className="space-y-3 text-base font-medium text-slate-700">
              <p>保存可能な備えプラン数：複数可能</p>
              <p>月額：300円</p>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                有料プランに変更する
              </button>
            </div>
          </section>

          {showConfirm ? (
            <section className="rounded-2xl bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-900">決済画面へ進みますか？</p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  やめる
                </button>

                <Link
                  href="/billing/success"
                  className="inline-flex items-center justify-center rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  決済へ進む
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
