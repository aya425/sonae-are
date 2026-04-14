"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

const RELATION_OPTIONS = [
  { value: "本人", label: "本人" },
  { value: "夫", label: "夫" },
  { value: "妻", label: "妻" },
  { value: "子ども", label: "子ども" },
  { value: "その他", label: "その他" },
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
  { value: "アーモンド", label: "アーモンド" },
  { value: "あわび", label: "あわび" },
  { value: "いか", label: "いか" },
  { value: "いくら", label: "いくら" },
  { value: "オレンジ", label: "オレンジ" },
  { value: "カシューナッツ", label: "カシューナッツ" },
  { value: "キウイフルーツ", label: "キウイフルーツ" },
  { value: "牛肉", label: "牛肉" },
  { value: "豚肉", label: "豚肉" },
  { value: "鶏肉", label: "鶏肉" },
  { value: "バナナ", label: "バナナ" },
  { value: "ごま", label: "ごま" },
  { value: "さけ", label: "さけ" },
  { value: "さば", label: "さば" },
  { value: "大豆", label: "大豆" },
  { value: "マカダミアナッツ", label: "マカダミアナッツ" },
  { value: "もも", label: "もも" },
  { value: "やまいも", label: "やまいも" },
  { value: "りんご", label: "りんご" },
  { value: "ゼラチン", label: "ゼラチン" },
] as const;

type FamilyMemberForm = {
  localId: string;
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
  role: string;
  age_group: "adult" | "child";
  notes: string | null;
  allergens: string[];
  created_at: string;
  updated_at: string;
};

type ApiError = {
  code: string;
  message: string;
  details: null;
};

type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

type DeleteFamilyMemberResponse = {
  id: string;
};

function createLocalId() {
  return crypto.randomUUID();
}

function createEmptyMember(): FamilyMemberForm {
  return {
    localId: createLocalId(),
    role: "",
    ageGroup: "",
    allergens: [],
    notes: "",
  };
}

function normalizeRole(role: string): string {
  switch (role) {
    case "self":
      return "本人";
    case "husband":
      return "夫";
    case "wife":
      return "妻";
    case "child":
    case "子供":
      return "子ども";
    case "other":
      return "その他";
    default:
      return role;
  }
}

function toFamilyMemberForm(member: FamilyMemberGetItem): FamilyMemberForm {
  return {
    localId: createLocalId(),
    role: normalizeRole(member.role),
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
    throw new Error(result.error?.message ?? "家族情報の取得に失敗しました。");
  }

  return result.data;
}

async function createFamilyMember(member: FamilyMemberForm): Promise<FamilyMemberPostItem> {
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
    throw new Error(result.error?.message ?? "家族情報の登録に失敗しました。");
  }

  return result.data;
}

async function updateAllergens(memberId: string, allergens: string[]): Promise<void> {
  const response = await fetch(`/api/family-members/${memberId}/allergens`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      allergens,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message ?? "アレルゲン情報の保存に失敗しました。");
  }
}

async function updateFamilyMember(
  memberId: string,
  member: FamilyMemberForm
): Promise<FamilyMemberPostItem> {
  const response = await fetch(`/api/family-members/${memberId}`, {
    method: "PATCH",
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
    throw new Error(result.error?.message ?? "家族情報の更新に失敗しました。");
  }

  return result.data;
}

async function deleteFamilyMember(memberId: string): Promise<DeleteFamilyMemberResponse> {
  const response = await fetch(`/api/family-members/${memberId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const result: ApiResponse<DeleteFamilyMemberResponse> = await response.json();

  if (!response.ok || !result.data) {
    throw new Error(result.error?.message ?? "家族情報の削除に失敗しました。");
  }

  return result.data;
}

export default function FamilyPage() {
  const router = useRouter();

  const [members, setMembers] = useState<FamilyMemberForm[]>([createEmptyMember()]);
  const [savedMembers, setSavedMembers] = useState<FamilyMemberGetItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const hasExistingMembers = savedMembers.length > 0;
  const isFormDisabled = isSubmitting;

  useEffect(() => {
    const load = async () => {
      try {
        setErrorMessage("");

        const fetchedMembers = await fetchFamilyMembers();
        setSavedMembers(fetchedMembers);

        if (fetchedMembers.length === 0) {
          setMembers([createEmptyMember()]);
          return;
        }

        setMembers(fetchedMembers.map(toFamilyMemberForm));
      } catch (error) {
        console.error(error);
        setSavedMembers([]);
        setMembers([createEmptyMember()]);
        setErrorMessage(
          error instanceof Error
            ? `${error.message} 新規の家族情報入力はこのまま続けられます。`
            : "家族情報の取得に失敗しました。新規の家族情報入力はこのまま続けられます。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const addMember = () => {
    setMembers((prev) => [...prev, createEmptyMember()]);
  };

  const updateMemberField = (
    index: number,
    field: "role" | "ageGroup" | "notes",
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((member, i) =>
        i === index
          ? {
              ...member,
              [field]: field === "ageGroup" ? (value as "adult" | "child" | "") : value,
            }
          : member
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

  const validateMembers = () => {
    if (members.length === 0) {
      return "家族情報を1人以上登録してください。";
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

  const handleDelete = async (index: number) => {
    const target = savedMembers[index];

    if (!target) return;

    const confirmed = window.confirm("この家族情報を削除しますか？");
    if (!confirmed) return;

    setErrorMessage("");
    setDeletingIds((prev) => [...prev, target.id]);

    try {
      await deleteFamilyMember(target.id);

      const nextSavedMembers = savedMembers.filter((member) => member.id !== target.id);
      setSavedMembers(nextSavedMembers);

      if (nextSavedMembers.length === 0) {
        setMembers([createEmptyMember()]);
      } else {
        setMembers(nextSavedMembers.map(toFamilyMemberForm));
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "家族情報の削除に失敗しました。");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== target.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validateMembers();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      for (let index = 0; index < members.length; index += 1) {
        const member = members[index];
        const savedMember = savedMembers[index];

        if (savedMember) {
          await updateFamilyMember(savedMember.id, member);
          await updateAllergens(savedMember.id, member.allergens);
        } else {
          const createdMember = await createFamilyMember(member);
          await updateAllergens(createdMember.id, member.allergens);
        }
      }

      router.push("/plan/new");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "家族情報の保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-center text-2xl font-bold">家族情報を登録</h1>
        <p className="mt-4 text-center text-sm text-gray-600">家族情報を読み込み中です...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-center text-2xl font-bold">家族情報を登録</h1>

      {hasExistingMembers ? (
        <div className="mt-4 rounded border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          登録済みの家族情報を編集できます
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {members.map((member, index) => {
            const isExistingMember = index < savedMembers.length;
            const deletingMemberId = isExistingMember ? savedMembers[index]?.id : undefined;
            const isDeleting = deletingMemberId ? deletingIds.includes(deletingMemberId) : false;

            return (
              <section key={member.localId} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">家族情報 {index + 1}</h2>

                  {isExistingMember ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      disabled={isDeleting || isSubmitting}
                      className="flex items-center gap-1 rounded border border-red-300 px-3 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      <span>{isDeleting ? "削除中..." : "削除"}</span>
                    </button>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">続柄</label>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={member.role}
                      onChange={(e) => updateMemberField(index, "role", e.target.value)}
                      disabled={isFormDisabled || isDeleting}
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
                    <label className="mb-1 block text-sm font-medium">年齢区分</label>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={member.ageGroup}
                      onChange={(e) => updateMemberField(index, "ageGroup", e.target.value)}
                      disabled={isFormDisabled || isDeleting}
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
                        <label key={allergen.value} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={member.allergens.includes(allergen.value)}
                            onChange={() => toggleAllergen(index, allergen.value)}
                            disabled={isFormDisabled || isDeleting}
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
                      onChange={(e) => updateMemberField(index, "notes", e.target.value)}
                      disabled={isFormDisabled || isDeleting}
                      placeholder="任意でメモを入力"
                    />
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={addMember}
            className="rounded bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isFormDisabled}
          >
            家族情報を追加
          </button>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isFormDisabled}
            className="rounded bg-blue-900 px-4 py-2 font-semibold text-white transition hover:bg-blue-800 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : "保存してプラン作成へ"}
          </button>
        </div>
      </form>
    </main>
  );
}
