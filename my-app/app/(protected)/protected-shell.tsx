"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { House, Users, Sparkles, FolderKanban, Package } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

type ProtectedShellProps = {
  children: ReactNode;
};

const footerItems = [
  { href: "/home", label: "ホーム", icon: House },
  { href: "/family", label: "家族情報", icon: Users },
  { href: "/plan/new", label: ["プラン", "作成"], icon: Sparkles },
  { href: "/plans", label: ["保存済み", "プラン"], icon: FolderKanban },
  { href: "/stock-items", label: ["備蓄品", "一覧"], icon: Package },
];

function getPageTitle(pathname: string) {
  if (pathname === "/home") return "ホーム";
  if (pathname === "/family") return "家族情報";
  if (pathname === "/plan/new") return "プラン作成";
  if (pathname === "/plans") return "保存済みプラン";
  if (pathname === "/plans/temp") return "生成プラン確認";
  if (pathname.startsWith("/plans/")) return "プラン詳細";
  if (pathname === "/stock-items") return "備蓄品一覧";
  if (pathname === "/billing") return "料金プラン";
  if (pathname === "/billing/success") return "決済完了";
  return "そなえアレ";
}

export default function ProtectedShell({ children }: ProtectedShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const pageTitle = getPageTitle(pathname);
  const isHomePage = pathname === "/home";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("ログアウトに失敗しました", error);
      return;
    }

    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white text-slate-900">
      <header className="flex h-20 shrink-0 items-center border-b border-slate-200 bg-white px-3 pt-1">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
          <h1 className="col-start-2 text-center text-2xl font-bold text-[#1E3A8A]">{pageTitle}</h1>
          {isHomePage ? (
            <div className="col-start-3 flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-[#1E3A8A] px-3 py-2 text-base font-semibold text-white transition-colors hover:bg-blue-800"
              >
                ログアウト
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-0.5 py-0">{children}</main>

      <footer className="h-24 shrink-0 border-t border-slate-200 bg-white">
        <nav className="grid h-full grid-cols-5">
          {footerItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/plan/new" && pathname === "/plans/temp") ||
              (item.href === "/plans" &&
                pathname.startsWith("/plans/") &&
                pathname !== "/plans/temp");

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-full items-center justify-center px-1 py-2"
              >
                <div
                  className={
                    isActive
                      ? "flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-blue-50 px-3 py-2"
                      : "flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-colors hover:bg-blue-50"
                  }
                >
                  <Icon
                    className={
                      isActive
                        ? "h-8 w-8 text-[#1E3A8A]"
                        : "h-8 w-8 text-slate-500 transition-colors hover:text-blue-800"
                    }
                    strokeWidth={2.2}
                  />
                  <span
                    className={
                      isActive
                        ? "text-center text-[12px] font-bold leading-tight text-[#1E3A8A]"
                        : "text-center text-[12px] leading-tight text-slate-600 transition-colors hover:text-blue-800"
                    }
                  >
                    {Array.isArray(item.label)
                      ? item.label.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))
                      : item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
