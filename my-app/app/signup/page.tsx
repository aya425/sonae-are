"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { createClient } from "@/src/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage("会員登録が完了しました。ホームへ移動します。");
      router.push("/home");
    } catch {
      setErrorMessage("会員登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-slate-50 px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">会員登録</h1>
          <p className="mt-2 text-lg leading-6 text-slate-600">
            メールアドレスとパスワードを入力して、
            <br />
            そなえアレを始めましょう。
          </p>
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          onSubmit={handleSignup}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none transition focus:border-[#1E3A8A]"
              placeholder="6文字以上で入力"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-lg text-red-700">{errorMessage}</p>
          ) : null}

          {successMessage ? (
            <p className="rounded-xl bg-blue-50 px-4 py-3 text-lg text-blue-800">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "登録中..." : "会員登録する"}
          </button>
        </form>

        <p className="mt-6 text-center text-lg text-slate-600">
          すでにアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="font-semibold text-[#1E3A8A] hover:text-blue-800 hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
