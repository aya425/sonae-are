import Link from "next/link";

const features = [
  {
    title: "家族条件に合う備えを提案",
    description: "家族構成やアレルギー情報に合わせて、何をどれだけ備えるかを考えやすくします。",
  },
  {
    title: "日常で買える商品も候補に表示",
    description: "防災食だけでなく、日常で買いやすい28品目不使用商品も備蓄候補として確認できます。",
  },
  {
    title: "期限通知で見直しやすい",
    description: "賞味期限が近づいた備蓄に気づきやすく、入れ替えや再購入につなげやすくします。",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 md:px-10 md:py-24">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
            食物アレルギー家庭向け防災備蓄支援アプリ
          </span>

          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">そなえアレ</h1>
            <p className="max-w-3xl text-xl font-semibold leading-relaxed text-slate-700 md:text-2xl">
              家族に合った“食べられる備え”を、 迷わず準備して続けられるように。
            </p>
            <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
              そなえアレは、食物アレルギーのある家庭が 家族条件に合った備えを考え、商品を確認し、
              備蓄の登録・期限管理・見直しまで一気通貫で進められる Webアプリです。
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              無料で始める
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              ログイン
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-900">こんな悩みはありませんか？</h2>
            <ul className="space-y-3 text-sm leading-6 text-slate-600 md:text-base">
              <li>・家族に合う非常食をどう選べばよいか分からない</li>
              <li>・防災食だけでは選択肢が少なく、日常品をどう備蓄に回すか迷う</li>
              <li>・備えた後の賞味期限やコスト管理が続かない</li>
            </ul>

            <p className="pt-2 text-sm leading-6 text-slate-600 md:text-base">
              そなえアレは、提案だけで終わらず、
              購入・登録・期限確認までつながる体験を目指しています。
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
