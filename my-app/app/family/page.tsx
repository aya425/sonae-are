"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RELATION_OPTIONS = [
  { value: "self", label: "本人" },
  { value: "spouse", label: "配偶者" },
  { value: "child", label: "子ども" },
  { value: "other", label: "その他" },
] as const;

const AGE_GROUP_OPTIONS = [
  { value: "adult", label: "大人" },
  { value: "child", label: "子ども" },
] as const;

const ALLERGEN_OPTIONS = [
  { value: "卵", label: "卵" },
  { value: "乳", label: "乳" },
  { value: "小麦", label: "小麦" },
  { value: "えび", label: "えび" },
  { value: "かに", label: "かに" },
  { value: "落花生", label: "落花生" },
  { value: "そば", label: "そば" },
  { value: "くるみ", label: "くるみ" },
] as const;

type FamilyMemberForm = {
  role: string;
  ageGroup: "adult" | "child" | "";
  allergens: string[];
  notes: string;
};

type FamilyMemberGetItem = {
  id: string;
  role: string;
  age_group: "adult" | "child";
  notes: string | null;
  allergens: string[];
  created_at: string;
  updated_at: string;
};

type FamilyMemberPostItem = {
  id: string;
  user_id: string;
  role: string;
  age_group: "adult" | "child";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

function toFamilyMemberForm(member: FamilyMemberGetItem): FamilyMemberForm {
  return {
    role: member.role,
    ageGroup: member.age_group,
    allergens: member.allergens ?? [],
    notes: member.notes ?? "",
  };
}

async function fetchFamilyMembers(): Promise<FamilyMemberGetItem[]> {
  const response = await fetch("/api/family-members", {
    method: "GET",
    credentials: "include",
  });

  const result: ApiResponse<FamilyMemberGetItem[]> = await response.json();

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "家族情報の取得に失敗しました。");
  }

  return result.data;
}

async function createFamilyMember(
  member: FamilyMemberForm
): Promise<FamilyMemberPostItem> {
  const response = await fetch("/api/family-members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      role: member.role,
      age_group: member.ageGroup,
      notes: member.notes,
    }),
  });

  const result: ApiResponse<FamilyMemberPostItem> = await response.json();

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "家族メンバーの登録に失敗しました。");
  }

  return result.data;
}

export default function FamilyPage() {
  const router = useRouter();

  const [members, setMembers] = useState<FamilyMemberForm[]>([
    {
      role: "",
      ageGroup: "",
      allergens: [],
      notes: "",
    },
  ]);

  const [savedMembers, setSavedMembers] = useState<FamilyMemberGetItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasExistingMembers = savedMembers.length > 0;

  useEffect(() => {
    const load = async () => {
      try {
        setErrorMessage("");

        const fetchedMembers = await fetchFamilyMembers();
        setSavedMembers(fetchedMembers);

        if (fetchedMembers.length === 0) {
          setMembers([
            {
              role: "",
              ageGroup: "",
              allergens: [],
              notes: "",
            },
          ]);
          return;
        }

        setMembers(fetchedMembers.map(toFamilyMemberForm));
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "家族情報の取得に失敗しました。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const addMember = () => {
    if (hasExistingMembers) return;

    setMembers((prev) => [
      ...prev,
      {
        role: "",
        ageGroup: "",
        allergens: [],
        notes: "",
      },
    ]);
  };

  const updateMemberField = (
    index: number,
    field: "role" | "ageGroup" | "notes",
    value: string
  ) => {
    if (hasExistingMembers) return;

    setMembers((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const toggleAllergen = (index: number, allergen: string) => {
    if (hasExistingMembers) return;

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

  const validateMembers = () => {
    if (members.length === 0) {
      return "家族メンバーを1人以上登録してください。";
    }

    for (const member of members) {
      if (!member.role) {
        return "続柄を選択してください。";
      }

      if (!member.ageGroup) {
        return "年齢区分を選択してください。";
      }
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (hasExistingMembers) {
      setErrorMessage(
        "現在、登録済みデータの編集・更新には未対応です。新規未登録時のみ保存できます。"
      );
      return;
    }

    const validationError = validateMembers();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      for (const member of members) {
        await createFamilyMember(member);
      }

      router.push("/plan/new");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "家族情報の保存に失敗しました。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">家族情報を登録</h1>
        <p className="mt-4 text-sm text-gray-600">
          家族情報を読み込み中です...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">家族情報を登録</h1>
      <p className="mt-2 text-sm text-gray-600">
        備えプラン作成の前提になる情報です。
      </p>

      {hasExistingMembers ? (
        <div className="mt-4 rounded border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          すでに登録済みの家族情報を表示しています。現在は更新API未実装のため、表示のみ対応です。
        </div>
      ) : null}

      <div className="mt-4 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        現在のバックエンド実装では、アレルゲン情報は表示・選択はできますが保存未対応です。
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {members.map((member, index) => (
          <section
            key={hasExistingMembers ? savedMembers[index]?.id ?? index : index}
            className="rounded-lg border p-4"
          >
            <h2 className="mb-4 text-lg font-semibold">
              家族メンバー {index + 1}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">続柄</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={member.role}
                    onChange={(e) => {
                      console.log("role changed", index, e.target.value);
                      updateMemberField(index, "role", e.target.value);
                    }}
                    disabled={isSubmitting}
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
                    onChange={(e) => {
                      console.log("ageGroup changed", index, e.target.value);
                      updateMemberField(index, "ageGroup", e.target.value);
                    }}
                  disabled={isSubmitting}
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
                        disabled={isSubmitting}
                      />
                      <span>{allergen.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">メモ</label>
                <textarea
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                  value={member.notes}
                  onChange={(e) =>
                    updateMemberField(index, "notes", e.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="任意でメモを入力"
                />
              </div>
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={addMember}
          className="rounded border px-4 py-2 text-sm"
          disabled={isSubmitting}
        >
          家族メンバーを追加
        </button>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : "保存してプラン作成へ"}
          </button>
        </div>
      </form>
    </main>
  );
}