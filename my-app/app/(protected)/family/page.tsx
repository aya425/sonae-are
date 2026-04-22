"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon, TrashIcon, UserPlusIcon } from "@phosphor-icons/react";

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
  id?: string;
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

type CustomSelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  label: string;
  value: string;
  placeholder?: string;
  options: readonly CustomSelectOption[];
  disabled?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

function CustomSelect({
  label,
  value,
  placeholder = "選択",
  options,
  disabled = false,
  isOpen,
  onToggle,
  onSelect,
  buttonRef,
}: CustomSelectProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <div className="relative flex justify-center">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className="w-[80%] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl leading-normal text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex items-center justify-center gap-3">
          <span className={`whitespace-nowrap ${value ? "text-slate-900" : "text-slate-500"}`}>
            {selectedLabel}
          </span>
          <span className="text-base text-slate-700">▼</span>
        </div>
      </button>

      {isOpen ? (
        <div className="absolute left-1/2 top-full z-30 mt-2 max-h-64 w-[80%] -translate-x-1/2 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.16)]">
          <div role="listbox" aria-label={label} className="py-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-lg font-semibold transition-colors ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : "bg-white text-slate-800 hover:bg-blue-50"
                  }`}
                >
                  <span className="whitespace-nowrap leading-none">{option.label}</span>
                  <span className="shrink-0">{isSelected ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
    case "子ども":
      return "子ども";
    case "other":
      return "その他";
    default:
      return role;
  }
}

function toFamilyMemberForm(member: FamilyMemberGetItem): FamilyMemberForm {
  return {
    id: member.id,
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
  const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [openRoleDropdownIndex, setOpenRoleDropdownIndex] = useState<number | null>(null);
  const [openAgeDropdownIndex, setOpenAgeDropdownIndex] = useState<number | null>(null);
  const roleButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ageButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const openAllergenModal = (index: number) => {
    setActiveMemberIndex(index);
    setIsAllergenModalOpen(true);
  };

  const closeAllergenModal = () => {
    setIsAllergenModalOpen(false);
    setActiveMemberIndex(null);
  };

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

  useEffect(() => {
    if (!isAllergenModalOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
    };
  }, [isAllergenModalOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedRoleButton = roleButtonRefs.current.some((button) => button?.contains(target));
      const clickedAgeButton = ageButtonRefs.current.some((button) => button?.contains(target));

      if (!clickedRoleButton) {
        setOpenRoleDropdownIndex(null);
      }

      if (!clickedAgeButton) {
        setOpenAgeDropdownIndex(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenRoleDropdownIndex(null);
        setOpenAgeDropdownIndex(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const addMember = () => {
    setMembers((prev) => [...prev, createEmptyMember()]);
    setOpenRoleDropdownIndex(null);
    setOpenAgeDropdownIndex(null);
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
        return "年齢を選択してください。";
      }
    }

    return "";
  };

  const handleDelete = async (memberId: string) => {
    const target = savedMembers.find((member) => member.id === memberId);

    if (!target) return;

    const confirmed = window.confirm("この家族情報を削除しますか？");
    if (!confirmed) return;

    setErrorMessage("");
    setDeletingIds((prev) => [...prev, target.id]);

    try {
      await deleteFamilyMember(target.id);

      const nextSavedMembers = savedMembers.filter((member) => member.id !== target.id);
      setSavedMembers(nextSavedMembers);

      const nextMembers = members.filter((member) => member.id !== target.id);

      if (nextMembers.length === 0) {
        setMembers([createEmptyMember()]);
      } else {
        setMembers(nextMembers);
      }
      setOpenRoleDropdownIndex(null);
      setOpenAgeDropdownIndex(null);
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
      for (const member of members) {
        if (member.id) {
          await updateFamilyMember(member.id, member);
          await updateAllergens(member.id, member.allergens);
        } else {
          const createdMember = await createFamilyMember(member);
          await updateAllergens(createdMember.id, member.allergens);
        }
      }

      router.push("/plan/new");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? `${error.message} 家族情報とアレルゲン情報は順番に保存しているため、一部のみ更新される場合があります。`
          : "家族情報の保存に失敗しました。家族情報とアレルゲン情報は順番に保存しているため、一部のみ更新される場合があります。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className=" max-w-5xl bg-white px-2 py-2">
        <p className="mt-4 text-center text-xl text-gray-900">家族情報を読み込み中です...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl min-h-screen px-3 py-1">
      {errorMessage ? (
        <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {savedMembers.length === 0 && (
        <p className="mt-2 text-center text-xl font-semibold text-gray-900">
          家族情報を登録しましょう
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-2 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {members.map((member, index) => {
            const isExistingMember = Boolean(member.id);
            const deletingMemberId = member.id;
            const isDeleting = deletingMemberId ? deletingIds.includes(deletingMemberId) : false;

            return (
              <section
                key={member.localId}
                className="mb-1 w-full rounded-3xl border border-blue-100 bg-blue-50 px-5 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:px-6 sm:py-6"
              >
                <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center">
                  <div />
                  <h2 className="text-center text-2xl font-bold text-[#1E3A8A]">{index + 1}人目</h2>
                  <div className="flex justify-end">
                    {isExistingMember ? (
                      <button
                        type="button"
                        onClick={() => member.id && handleDelete(member.id)}
                        disabled={isDeleting || isSubmitting}
                        aria-label={isDeleting ? "削除中" : "削除"}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-300 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <span className="text-base font-semibold">...</span>
                        ) : (
                          <TrashIcon size={25} weight="bold" />
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 text-center">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-2 block text-xl font-semibold text-slate-800">
                        続柄
                      </label>
                      <div className="flex justify-center">
                        <CustomSelect
                          label="続柄"
                          value={member.role}
                          options={RELATION_OPTIONS}
                          disabled={isFormDisabled || isDeleting}
                          isOpen={openRoleDropdownIndex === index}
                          onToggle={() => {
                            setOpenAgeDropdownIndex(null);
                            setOpenRoleDropdownIndex((prev) => (prev === index ? null : index));
                          }}
                          onSelect={(value) => {
                            updateMemberField(index, "role", value);
                            setOpenRoleDropdownIndex(null);
                          }}
                          buttonRef={{
                            get current() {
                              return roleButtonRefs.current[index] ?? null;
                            },
                            set current(value: HTMLButtonElement | null) {
                              roleButtonRefs.current[index] = value;
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xl font-semibold text-slate-800">
                        年齢区分
                      </label>
                      <div className="flex justify-center">
                        <CustomSelect
                          label="年齢区分"
                          value={member.ageGroup}
                          options={AGE_GROUP_OPTIONS}
                          disabled={isFormDisabled || isDeleting}
                          isOpen={openAgeDropdownIndex === index}
                          onToggle={() => {
                            setOpenRoleDropdownIndex(null);
                            setOpenAgeDropdownIndex((prev) => (prev === index ? null : index));
                          }}
                          onSelect={(value) => {
                            updateMemberField(index, "ageGroup", value);
                            setOpenAgeDropdownIndex(null);
                          }}
                          buttonRef={{
                            get current() {
                              return ageButtonRefs.current[index] ?? null;
                            },
                            set current(value: HTMLButtonElement | null) {
                              ageButtonRefs.current[index] = value;
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto w-[90%] space-y-1 rounded-2xl bg-white px-1 py-2 sm:px-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div />
                      <span className="text-center text-xl font-semibold text-slate-900">
                        アレルゲン
                      </span>
                      <div className="flex justify-start">
                        <button
                          type="button"
                          onClick={() => openAllergenModal(index)}
                          className="inline-flex min-h-[35px] items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-2 py-1 text-lg font-semibold text-[#1E3A8A] transition-colors hover:bg-blue-100"
                        >
                          選択 ▼
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="flex min-h-[40px] flex-wrap items-center justify-center gap-2 text-center">
                        {member.allergens.length === 0 ? (
                          <span className="inline-flex items-center justify-center text-base font-semibold text-gray-900">
                            未選択
                          </span>
                        ) : (
                          member.allergens.map((allergen) => (
                            <span
                              key={allergen}
                              className="rounded-full bg-orange-200 px-3 py-1.5 text-base font-semibold text-slate-800"
                            >
                              {allergen}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto w-[90%]">
                    <div className="grid grid-cols-[45px_1fr] items-start gap-2 text-left">
                      <label className="pt-3 text-lg font-semibold text-slate-800">メモ</label>
                      <textarea
                        className="min-h-[50px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg leading-normal"
                        rows={1}
                        value={member.notes}
                        onChange={(e) => updateMemberField(index, "notes", e.target.value)}
                        disabled={isFormDisabled || isDeleting}
                        placeholder="メモ（任意）"
                      />
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={addMember}
            aria-label="家族を追加"
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 text-[#1E3A8A] shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isFormDisabled}
          >
            <UserPlusIcon size={30} weight="fill" />
            <span className="text-lg font-semibold text-[#1E3A8A]">追加</span>
          </button>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            type="submit"
            disabled={isFormDisabled}
            className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-8 py-4 text-xl font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FloppyDiskIcon size={24} weight="fill" />
            <span>{isSubmitting ? "保存中..." : "保存してプラン作成へ"}</span>
          </button>
        </div>
      </form>

      {isAllergenModalOpen && activeMemberIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeAllergenModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="allergen-modal-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="allergen-modal-title" className="text-3xl font-bold text-red-400">
                アレルゲンを選択
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeAllergenModal}
                className="text-lg font-semibold text-gray-900"
              >
                閉じる
              </button>
            </div>

            <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <label
                  key={allergen.value}
                  className="flex cursor-pointer items-center gap-3 rounded border border-slate-200 bg-white px-3 py-3 text-lg font-semibold transition-colors hover:bg-blue-50 hover:border-blue-200"
                >
                  <input
                    type="checkbox"
                    checked={members[activeMemberIndex].allergens.includes(allergen.value)}
                    onChange={() => toggleAllergen(activeMemberIndex, allergen.value)}
                    className="h-5 w-5 cursor-pointer"
                  />
                  <span>{allergen.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={closeAllergenModal}
                className="rounded bg-[#1E3A8A] px-4 py-2 text-lg font-semibold text-white"
              >
                選択を完了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
