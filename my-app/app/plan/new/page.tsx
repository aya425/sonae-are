"use client";

import { useState } from "react";

export default function PlanNewPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasFamily] = useState(true);
  const handleGenerate = async () => {
    setErrorMessage("");

    if (!hasFamily) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setErrorMessage(
        "プランの作成に失敗しました。時間をおいて再度お試しください。"
      );
    }, 1500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">備えプラン作成</h1>

      <button
        onClick={handleGenerate}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
      >
        備えプランを作成する
      </button>
      {!loading && !hasFamily && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            備えプランを作るには、先に家族情報の登録が必要です。
          </p>
          <a
            href="/family"
            className="mt-3 inline-block text-sm font-medium text-blue-600 underline"
          >
            家族情報を登録する
          </a>
        </div>
      )}
      {/* API失敗 */}
      {!loading && hasFamily && errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      {loading && (
        <p className="mt-4 text-sm text-gray-600">
          備えプランを作成しています...
        </p>
      )}
    </div>
  );
}
