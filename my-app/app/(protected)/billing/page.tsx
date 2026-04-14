"use client";

import Link from "next/link";
import { useState } from "react";

export default function BillingPage() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <main className="px-6 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">料金プラン選択</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            無料プランと有料プランの内容を確認し、必要に応じて有料プランへ進めます。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_1fr_auto] md:items-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-500">無料プラン</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">無料で使う</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <p>保存可能な備えプラン数：1件</p>
            </div>
          </section>

          <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm ring-1 ring-green-100">
            <div className="mb-4">
              <p className="text-sm font-semibold text-green-700">有料プラン</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">保存数制限解除プラン</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <p>保存可能な備えプラン数：複数可能</p>
              <p>月額：300円</p>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                有料プランを選択する
              </button>
            </div>
          </section>

          {showConfirm ? (
            <section className="rounded-2xl bg-slate-100 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-900">有料プランに申し込みますか？</p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  やめる
                </button>

                <Link
                  href="/billing/success"
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  申し込む
                </Link>
              </div>
            </section>
          ) : null}
        </div>

        <div className="mt-8">
          <Link
            href="/home"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
