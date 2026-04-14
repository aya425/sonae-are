import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="px-6 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl border border-green-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-green-700">決済完了</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              有料プランの申し込みが完了しました
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              保存できる備えプラン数が増え、複数の備えプランを比較しながら 管理しやすくなります。
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>・有料プランの利用状態は今後ホームで確認できる想定です。</p>
            <p className="mt-2">・必要に応じて、引き続き家族情報や備えプランの作成に進めます。</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/home"
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              ホームへ戻る
            </Link>

            <Link
              href="/billing"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              料金プラン画面へ戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
