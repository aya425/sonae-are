"use client";

import { useEffect, useState } from "react";

const RELATION_OPTIONS = [
  { value: "本人", label: "本人" },
  { value: "配偶者", label: "配偶者" },
  { value: "子ども", label: "子ども" },
  { value: "その他", label: "その他" },
];

const AGE_GROUP_OPTIONS = [
  { value: "adult", label: "大人" },
  { value: "child", label: "子ども" },
];

const ALLERGEN_OPTIONS = [
  { value: "卵", label: "卵" },
  { value: "乳", label: "乳" },
  { value: "小麦", label: "小麦" },
  { value: "えび", label: "えび" },
  { value: "かに", label: "かに" },
  { value: "落花生", label: "落花生" },
  { value: "そば", label: "そば" },
  { value: "くるみ", label: "くるみ" },
];

type FamilyMemberInput = {
  id: string;
  role: string;
  ageGroup: string;
  allergens: string[];
};

type FamilyMemberResponse = {
  id: string;
  role: string;
  age_group: string;
  notes?: string | null;
  allergens?: string[];
  created_at?: string;
  updated_at?: string;
};

const createEmptyMember = (id: string): FamilyMemberInput => ({
  id,
  role: "",
  ageGroup: "",
  allergens: [],
});

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMemberInput[]>([
    createEmptyMember("member-1"),
  ]);
  const [familyList, setFamilyList] = useState<FamilyMemberResponse[]>([]);
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      createEmptyMember(`member-${prev.length + 1}-${crypto.randomUUID()}`),
    ]);
  };

  const updateMemberField = (
    index: number,
    field: "role" | "ageGroup",
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const toggleAllergen = (index: number, allergen: string) => {
    setMembers((prev) =>
      prev.map((member, i) => {
        if (i !== index) return member;

        const alreadyChecked = member.allergens.includes(allergen);

        return {
          ...member,
          allergens: alreadyChecked
            ? member.allergens.filter((item) => item !== allergen)
            : [...member.allergens, allergen],
        };
      })
    );
  };

  const handleGetFamily = async () => {
    try {
      setIsFetching(true);
      setMessage("");

      const res = await fetch("/api/family");
      const data = await res.json();

      if (!res.ok) {
        setMessage(`エラー: ${data.error ?? "取得に失敗しました"}`);
        return;
      }

      setFamilyList(data.data ?? []);
    } catch (error) {
      console.error("fetch family error:", error);
      setMessage("通信エラーが発生しました");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    handleGetFamily();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage("");

for (const member of members) {
  if (!member.role || !member.ageGroup) {
    setMessage("続柄と年齢区分を入力してください");
    return;
  }

  const familyRes = await fetch("/api/family", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: member.role,
      age_group: member.ageGroup,
      notes: "",
    }),
  });

  const familyData = await familyRes.json();

  if (!familyRes.ok) {
    setMessage(
      `家族情報の保存に失敗しました: ${familyData.error ?? "不明なエラー"}`
    );
    return;
  }
}

      setMessage("家族情報を保存しました");
      setMembers([createEmptyMember("member-1")]);
      await handleGetFamily();
    } catch (error) {
      console.error("submit error:", error);
      setMessage("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">家族情報を登録</h1>
      <p className="mt-2 text-sm text-gray-600">
        備えプラン作成の前提になる情報です。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {members.map((member, index) => (
          <section key={member.id} className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">
              家族メンバー {index + 1}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">続柄</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={member.role}
                  onChange={(e) =>
                    updateMemberField(index, "role", e.target.value)
                  }
                >
                  <option value="">選択してください</option>
                  {RELATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  年齢区分
                </label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={member.ageGroup}
                  onChange={(e) =>
                    updateMemberField(index, "ageGroup", e.target.value)
                  }
                >
                  <option value="">選択してください</option>
                  {AGE_GROUP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">アレルゲン</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALLERGEN_OPTIONS.map((allergen) => (
                    <label
                      key={allergen.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={member.allergens.includes(allergen.value)}
                        onChange={() => toggleAllergen(index, allergen.value)}
                      />
                      <span>{allergen.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={addMember}
            disabled={isSubmitting}
            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
          >
            家族メンバーを追加
          </button>

          <button
            type="button"
            onClick={handleGetFamily}
            disabled={isFetching || isSubmitting}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {isFetching ? "取得中..." : "家族一覧を取得"}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : "保存する"}
          </button>
        </div>

        {message && <p className="text-sm">{message}</p>}
      </form>

      {familyList.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          まだ家族情報がありません
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {familyList.map((member) => (
            <li key={member.id} className="rounded border p-3">
              <p>続柄: {member.role}</p>
              <p>年齢区分: {member.age_group}</p>
              <p>メモ: {member.notes ?? "なし"}</p>
              <p>アレルゲン: {member.allergens?.join(", ") || "なし"}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}