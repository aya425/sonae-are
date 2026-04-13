import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

type ProtectedLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/family", label: "家族情報" },
  { href: "/plan/new", label: "プラン作成" },
  { href: "/plans", label: "保存済みプラン" },
  { href: "/stock-items", label: "備蓄品一覧" },
  { href: "/payments", label: "料金プラン" },
];

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/dashboard" className="text-lg font-bold text-slate-900">
              そなえアレ
            </Link>
            <p className="text-sm text-slate-600">食物アレルギー家庭向け防災備蓄支援アプリ</p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
