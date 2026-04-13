"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setErrorMessage("ログインに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">ログイン</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            登録済みのメールアドレスとパスワードでログインします。
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-600"
              placeholder="example@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-600"
              placeholder="パスワードを入力"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "ログイン中..." : "ログインする"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          はじめてご利用の方は{" "}
          <Link href="/signup" className="font-semibold text-green-700 hover:underline">
            会員登録
          </Link>
        </p>
      </div>
    </main>
  );
}
