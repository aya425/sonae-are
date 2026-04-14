"use client";

import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <main className="px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <section className="animate-[fadeUp_0.5s_ease-out] text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 shadow-[0_10px_24px_rgba(30,58,138,0.18)]">
            <CheckCircle2 className="h-12 w-12 text-[#1E3A8A]" strokeWidth={2.4} />
          </div>

          <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-[#1E3A8A]">完了</p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">
            有料プランの申し込みが
            <br />
            完了しました
          </h1>

          <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
            保存できる備えプラン数が増え、
            <br />
            複数の備えプランを比較しながら
            <br />
            管理しやすくなります。
          </p>
        </section>

        <section className="mt-8 animate-[fadeUp_0.7s_ease-out] rounded-3xl bg-blue-50 p-5 text-left ring-1 ring-[rgba(30,58,138,0.18)] shadow-[0_8px_22px_rgba(30,58,138,0.12)]">
          <p className="text-lg font-semibold text-[#1E3A8A]">ご案内</p>

          <div className="mt-3 space-y-3 text-lg font-medium leading-8 text-slate-700">
            <p>・決済情報の反映まで、少し時間がかかることがあります。</p>
            <p>・反映されない場合は、少し時間をおいてからもう一度ご確認ください。</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
