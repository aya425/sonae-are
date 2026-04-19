"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
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

      router.push("/home");
    } catch {
      setErrorMessage("ログインに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-slate-50 px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">ログイン</h1>
          <p className="mt-2 text-lg leading-6 text-slate-600">
            登録済みのメールアドレスと
            <br />
            パスワードでログインします。
          </p>
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          onSubmit={handleLogin}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-lg font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none transition focus:border-[#1E3A8A]"
              placeholder="example@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-lg font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none transition focus:border-[#1E3A8A]"
              placeholder="パスワードを入力"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "ログイン中..." : "ログインする"}
          </button>
        </form>

        <p className="mt-6 text-center text-lg text-slate-600">
          はじめてご利用の方は{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#1E3A8A] hover:text-blue-800 hover:underline"
          >
            会員登録
          </Link>
        </p>
      </div>
    </main>
  );
}
