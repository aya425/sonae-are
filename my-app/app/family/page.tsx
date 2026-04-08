"use client";

import { useState } from "react";

const RELATION_OPTIONS = [
  { value: "self", label: "本人" },
  { value: "spouse", label: "配偶者" },
  { value: "child", label: "子ども" },
  { value: "other", label: "その他" },
];

const AGE_GROUP_OPTIONS = [
  { value: "adult", label: "大人" },
  { value: "child", label: "子ども" },
];

const ALLERGEN_OPTIONS = [
  "卵",
  "乳",
  "小麦",
  "えび",
  "かに",
  "落花生",
  "そば",
  "くるみ",
];

type FamilyMemberInput = {
  role: string;
  ageGroup: string;
  allergens: string[];
};

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMemberInput[]>([
    {
      role: "",
      ageGroup: "",
      allergens: [],
    },
  ]);

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        role: "",
        ageGroup: "",
        allergens: [],
      },
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("family members:", members);
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">家族情報を登録</h1>
      <p className="mt-2 text-sm text-gray-600">
        備えプラン作成の前提になる情報です。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {members.map((member, index) => (
          <section key={index} className="rounded-lg border p-4">
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
                      key={allergen}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={member.allergens.includes(allergen)}
                        onChange={() => toggleAllergen(index, allergen)}
                      />
                      <span>{allergen}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={addMember}
          className="rounded border px-4 py-2 text-sm"
        >
          家族メンバーを追加
        </button>

        <div>
          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            保存してプラン作成へ
          </button>
        </div>
      </form>
    </main>
  );
}