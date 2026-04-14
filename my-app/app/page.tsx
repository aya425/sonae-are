import Link from "next/link";
import { Bell, ClipboardList, ShoppingBag } from "lucide-react";

const features = [
  {
    title: "家族条件に合う備えを提案",
    description: [
      "家族構成やアレルギー情報に合わせて、",
      "何をどれだけ備えるかを考えやすくします。",
    ],
    icon: ClipboardList,
  },
  {
    title: "日常で買える商品も候補に表示",
    description: [
      "防災食だけでなく、日常で買いやすい",
      "28品目不使用商品も備蓄候補として",
      "確認できます。",
    ],
    icon: ShoppingBag,
  },
  {
    title: "期限通知で見直しやすい",
    description: [
      "賞味期限が近づいた備蓄に気づきやすく、",
      "入れ替えや再購入につなげやすくします。",
    ],
    icon: Bell,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 bg-slate-50 px-4 py-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <h1 className="text-3xl font-bold leading-tight text-[#1E3A8A]">そなえアレ</h1>

          <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-800">
            食物アレルギー家庭向け防災備蓄支援アプリ
          </span>

          <div className="flex flex-col items-center gap-3">
            <p className="text-lg font-semibold leading-relaxed text-slate-700">
              家族に合った“食べられる備え”を、
              <br />
              迷わず準備して続けられるように。
            </p>

            <p className="text-base font-medium leading-7 text-slate-600">
              そなえアレは、食物アレルギーのある家庭が
              <br />
              家族条件に合った 備えを考え、商品を確認し、
              <br />
              備蓄の登録・期限管理・見直しまで
              <br />
              一気通貫で進められるアプリです。
            </p>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-10 pt-1">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            無料で始める
          </Link>

          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-800 hover:bg-blue-50 hover:text-blue-800"
          >
            ログイン
          </Link>
        </div>

        <section className="w-full rounded-2xl bg-blue-50 p-5 ring-1 ring-[rgba(30,58,138,0.18)] shadow-[0_4px_14px_rgba(30,58,138,0.12)]">
          <div className="flex flex-col gap-4 text-left">
            <h2 className="text-xl font-bold text-slate-900">こんな悩みはありませんか？</h2>

            <ul className="space-y-2 text-base font-medium leading-6 text-slate-600">
              <li>・家族に合う非常食をどう選べばよいか分からない</li>
              <li>・防災食だけでは選択肢が少なく、日常品をどう備蓄に回すか迷う</li>
              <li>・備えた後の賞味期限やコスト管理が続かない</li>
            </ul>

            <p className="pt-1 text-base font-medium leading-6 text-slate-600">
              そなえアレは、提案だけで終わらず、購入・登録・期限確認までつながる体験を目指しています。
            </p>
          </div>
        </section>

        <section className="grid gap-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-[24px] border border-[rgba(30,58,138,0.28)] bg-white p-5 text-center shadow-[0_0_0_1px_rgba(30,58,138,0.08),0_6px_18px_rgba(30,58,138,0.18)]"
              >
                <div className="mb-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <Icon className="h-7 w-7 text-blue-600" strokeWidth={2.2} />
                  </div>
                </div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h2>
                <p className="text-base font-medium leading-6 text-slate-600">
                  {Array.isArray(feature.description)
                    ? feature.description.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))
                    : feature.description}
                </p>
              </article>
            );
          })}
        </section>
        <div className="pt-2 text-center text-xs text-slate-500">© そなえアレ</div>
      </section>
    </main>
  );
}
