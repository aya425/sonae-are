"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { House, Users, Sparkles, FolderKanban, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProtectedShellProps = {
  children: ReactNode;
};

const footerItems = [
  { href: "/home", label: "ホーム", icon: House },
  { href: "/family", label: "家族情報", icon: Users },
  { href: "/plan/new", label: "プラン作成", icon: Sparkles },
  { href: "/plans", label: ["保存済み", "プラン"], icon: FolderKanban },
  { href: "/stock-items", label: "備蓄品一覧", icon: Package },
];

function getPageTitle(pathname: string) {
  if (pathname === "/home") return "ホーム";
  if (pathname === "/family") return "家族情報";
  if (pathname === "/plan/new") return "プラン作成";
  if (pathname === "/plans") return "保存済みプラン";
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
  const isHomePage = pathname === "/home" || pathname === "/dashboard";

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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm">
        <header className="fixed top-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-b border-slate-200 bg-white px-4 py-4">
          <div className="relative flex items-center justify-center">
            <h1 className="text-center text-lg font-bold text-[#1E3A8A]">{pageTitle}</h1>
            {isHomePage ? (
              <button
                type="button"
                onClick={handleLogout}
                className="absolute right-0 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
              >
                ログアウト
              </button>
            ) : null}
          </div>
        </header>

        <main className="px-4 pb-24 pt-20">{children}</main>

        <footer className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white">
          <nav className="grid grid-cols-5">
            {footerItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/plans" && pathname.startsWith("/plans/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center px-1 py-2"
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
                          ? "h-6 w-6 text-[#1E3A8A]"
                          : "h-6 w-6 text-slate-500 transition-colors hover:text-blue-800"
                      }
                      strokeWidth={2.2}
                    />
                    <span
                      className={
                        isActive
                          ? "text-center text-[10px] font-semibold leading-tight text-[#1E3A8A]"
                          : "text-center text-[10px] leading-tight text-slate-600 transition-colors hover:text-blue-800"
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
    </div>
  );
}
