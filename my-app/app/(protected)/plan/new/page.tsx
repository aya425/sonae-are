"use client";

import Link from "next/link";
import { SparkleIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

const DAYS_OPTIONS = [
  { value: 3, label: "3日（まずはこれ）" },
  { value: 7, label: "7日（安心して備える）" },
  { value: 14, label: "14日（万全に備える）" },
] as const;

const DAYS_HELP_TEXT: Record<3 | 7 | 14, string> = {
  3: "災害直後を乗り切る最低限の備え",
  7: "ライフライン停止も想定した安心の備え",
  14: "長期化にも対応できる余裕ある備え",
};

const SCOPE_OPTIONS = [
  { value: false, label: "防災食だけで選ぶ" },
  { value: true, label: "普段の食品も含める" },
] as const;

const SCOPE_HELP_TEXT = {
  false: "長期保存できる専用食品だけで備えます",
  true: "普段食べている食品も活用して備えます",
} as const;

const PRIORITY_OPTIONS = [
  { value: "minimum", label: "必要なものを優先する" },
  { value: "balanced", label: "いろいろバランスよくそろえる" },
] as const;

const PRIORITY_HELP_TEXT: Record<"minimum" | "balanced", ReactNode> = {
  minimum: (
    <>
      主食や水など、重要なものから
      <br />
      優先して提案します
    </>
  ),
  balanced: (
    <>
      主食・おかず・おやつなどを
      <br />
      バランスよく提案します
    </>
  ),
};

const HINT_MODAL_CONTENT = {
  days: {
    title: "想定日数のヒント",
    body: "まずは3日分から始めると、最小構成で無理なく備えやすくなります。",
  },
  scope: {
    title: "候補範囲のヒント",
    body: "日常品も含めると、普段使いしながら備えを維持しやすくなります。",
  },
  priority: {
    title: "優先方針のヒント",
    body: "迷う場合は「バランス重視」を選ぶと、主食・飲料・おかずを偏りなく確認できます。",
  },
} as const;

const LOADING_STEPS = [
  "条件を確認中…",
  "必要量を計算中…",
  "水と主食を選定中…",
  "栄養バランスを調整中…",
  "買いやすい組み合わせに整理中…",
] as const;

const LOADING_FOOTER_TEXT = "優先度を見ながら候補を整理しています";

type PlanConditionInput = {
  days: 3 | 7 | 14;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balanced";
};

type GeneratedPlanItem = {
  id: string;
  name: string;
  category: string;
  productType: string;
  isFreeFrom28: boolean;
  price: number;
  purchaseUrl: string;
  shelfLifeMonths: number;
  isActive: boolean;
  quantity: number;
  subtotal: number;
  priority: string;
  reason: string;
};

type GeneratedPlan = {
  title: string;
  familyMemberCount: number;
  days: 3 | 7 | 14;
  includeDailyItems: boolean;
  priorityPolicy: "minimum" | "balanced";
  totalCost: number;
  annualCost: number;
  explanation: string;
  items: GeneratedPlanItem[];
  warnings: string[];
};

type ApiError = {
  code?: string;
  message?: string;
  details?: unknown;
};

type GeneratePlanResponse = {
  data: {
    generatedPlan: GeneratedPlan;
  } | null;
  error: ApiError | null;
};

type FamilyMembersResponse = {
  data:
    | {
        id: string;
        role: string;
        age_group: string;
        notes: string | null;
        allergens: string[];
        created_at: string;
        updated_at: string;
      }[]
    | null;
  error: ApiError | null;
};

type HintModalKey = keyof typeof HINT_MODAL_CONTENT;

type CustomSelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type CustomSelectProps<T extends string | number> = {
  label: string;
  value: T;
  options: readonly CustomSelectOption<T>[];
  disabled?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;
};

function CustomSelect<T extends string | number>({
  label,
  value,
  options,
  disabled = false,
  isOpen,
  onToggle,
  onSelect,
}: CustomSelectProps<T>) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? "選択";

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-lg font-semibold text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="whitespace-nowrap">{selectedLabel}</span>
          <span className="text-sm text-slate-700">▼</span>
        </div>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-300 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.16)]">
          <div role="listbox" aria-label={label} className="py-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-base font-semibold transition-colors ${
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

export default function PlanNewPage() {
  const router = useRouter();

  const [form, setForm] = useState<PlanConditionInput>({
    days: 7,
    includeDailyItems: true,
    priorityPolicy: "minimum",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsFamilyRegistration, setNeedsFamilyRegistration] = useState(false);
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [isCheckingFamily, setIsCheckingFamily] = useState(false);
  const [openHintModal, setOpenHintModal] = useState<HintModalKey | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<HintModalKey | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedDaysHelpText = DAYS_HELP_TEXT[form.days];
  const selectedScopeHelpText = form.includeDailyItems
    ? SCOPE_HELP_TEXT.true
    : SCOPE_HELP_TEXT.false;
  const selectedPriorityHelpText = PRIORITY_HELP_TEXT[form.priorityPolicy];

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      setIsCheckingFamily(true);

      try {
        const response = await fetch("/api/family-members", {
          method: "GET",
          credentials: "include",
        });

        const result: FamilyMembersResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "家族情報の確認に失敗しました。");
        }

        setHasFamily((result.data?.length ?? 0) > 0);
      } catch (error) {
        console.error(error);
        setHasFamily(null);
      } finally {
        setIsCheckingFamily(false);
      }
    };

    fetchFamilyMembers();
  }, []);

  useEffect(() => {
    if (!isSubmitting) {
      setLoadingStepIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1600);

    return () => window.clearInterval(intervalId);
  }, [isSubmitting]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!dropdownContainerRef.current?.contains(target)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setErrorMessage("");
    setNeedsFamilyRegistration(false);
    setOpenDropdown(null);

    if (isSubmitting || isCheckingFamily) return;

    if (hasFamily === false) {
      setNeedsFamilyRegistration(true);
      setErrorMessage("先に家族情報を登録してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          days: form.days,
          includeDailyItems: form.includeDailyItems,
          priorityPolicy: form.priorityPolicy,
        }),
      });

      const result: GeneratePlanResponse = await response.json();

      if (!response.ok) {
        if (response.status === 422 && result.error?.code === "FAMILY_MEMBERS_REQUIRED") {
          setNeedsFamilyRegistration(true);
          setErrorMessage(
            result.error.message || "家族情報が未登録です。先に家族情報を登録してください。"
          );
          return;
        }

        throw new Error(result.error?.message || "プラン生成に失敗しました。");
      }

      if (!result.data?.generatedPlan) {
        throw new Error("生成結果の取得に失敗しました。");
      }

      sessionStorage.setItem("generatedPlan", JSON.stringify(result.data.generatedPlan));
      sessionStorage.setItem("planConditions", JSON.stringify(form));

      router.push("/plans/temp");
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message === "Failed to fetch") {
        setErrorMessage("通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。");
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "プラン生成に失敗しました。時間をおいて再度お試しください。"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white px-0 py-2 pb-24">
      <div className="mx-auto w-full max-w-[920px] px-2">
        {hasFamily === false && !errorMessage ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
            <p className="text-xl font-medium text-gray-900">家族情報がまだ登録されていません。</p>
            <div className="mt-4 flex justify-center">
              <Link
                href="/family"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-lg font-semibold text-white no-underline transition-colors hover:bg-blue-800"
              >
                <UsersThreeIcon size={30} weight="fill" />
                <span>家族情報を登録する</span>
              </Link>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-medium text-gray-900">{errorMessage}</p>

            {needsFamilyRegistration ? (
              <div className="mt-4 flex justify-center">
                <Link
                  href="/family"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-blue-800"
                >
                  <UsersThreeIcon size={30} weight="fill" />
                  <span>家族情報を登録する</span>
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSubmitting ? (
              <section className="rounded-2xl border border-slate-200 bg-white px-3 py-5 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col justify-center">
                  <h2 className="text-center text-xl font-semibold text-gray-900">
                    備えプランを作成中
                  </h2>
                  <p className="mt-1 text-center text-xl text-gray-900">
                    条件に合う商品候補を整理しています
                  </p>

                  <div className="mt-5 space-y-3">
                    {LOADING_STEPS.map((step, index) => {
                      const isActive = index === loadingStepIndex;
                      const isDone = index < loadingStepIndex;

                      return (
                        <div
                          key={step}
                          className={`rounded-xl px-4 py-3 text-center text-lg font-semibold transition-colors ${
                            isActive
                              ? "bg-blue-50 text-blue-900"
                              : isDone
                                ? "bg-slate-100 text-slate-700"
                                : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {isDone ? `✓ ${step}` : step}
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-5 text-center text-xl text-gray-900">{LOADING_FOOTER_TEXT}</p>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-blue-100 bg-blue-100 px-3 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                <h2 className="mt-2 text-center text-xl font-semibold text-gray-900">
                  条件を選びましょう
                </h2>

                <div ref={dropdownContainerRef} className="mt-2 space-y-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <label className="block text-xl font-semibold text-blue-900">想定日数</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          setOpenHintModal("days");
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        aria-label="想定日数のヒントを表示"
                      >
                        ?
                      </button>
                    </div>

                    <p className="mb-2 rounded-xl bg-blue-50 px-3 py-2 text-center text-lg font-medium leading-relaxed text-gray-900">
                      {selectedDaysHelpText}
                    </p>

                    <CustomSelect
                      label="想定日数"
                      value={form.days}
                      options={DAYS_OPTIONS}
                      disabled={isSubmitting || isCheckingFamily}
                      isOpen={openDropdown === "days"}
                      onToggle={() => setOpenDropdown((prev) => (prev === "days" ? null : "days"))}
                      onSelect={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          days: value,
                        }));
                        setOpenDropdown(null);
                      }}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <label className="block text-xl font-semibold text-blue-900">候補範囲</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          setOpenHintModal("scope");
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        aria-label="候補範囲のヒントを表示"
                      >
                        ?
                      </button>
                    </div>

                    <p className="mb-2 rounded-xl bg-blue-50 px-3 py-2 text-center text-lg font-medium leading-relaxed text-gray-900">
                      {selectedScopeHelpText}
                    </p>

                    <CustomSelect
                      label="候補範囲"
                      value={String(form.includeDailyItems)}
                      options={SCOPE_OPTIONS.map((option) => ({
                        value: String(option.value),
                        label: option.label,
                      }))}
                      disabled={isSubmitting || isCheckingFamily}
                      isOpen={openDropdown === "scope"}
                      onToggle={() =>
                        setOpenDropdown((prev) => (prev === "scope" ? null : "scope"))
                      }
                      onSelect={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          includeDailyItems: value === "true",
                        }));
                        setOpenDropdown(null);
                      }}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <label className="block text-xl font-semibold text-blue-900">優先方針</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          setOpenHintModal("priority");
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        aria-label="優先方針のヒントを表示"
                      >
                        ?
                      </button>
                    </div>

                    <p className="mb-2 rounded-xl bg-blue-50 px-3 py-2 text-center text-lg font-medium leading-relaxed text-gray-900">
                      {selectedPriorityHelpText}
                    </p>

                    <CustomSelect
                      label="優先方針"
                      value={form.priorityPolicy}
                      options={PRIORITY_OPTIONS}
                      disabled={isSubmitting || isCheckingFamily}
                      isOpen={openDropdown === "priority"}
                      onToggle={() =>
                        setOpenDropdown((prev) => (prev === "priority" ? null : "priority"))
                      }
                      onSelect={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          priorityPolicy: value,
                        }));
                        setOpenDropdown(null);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 mb-3 flex justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting || isCheckingFamily}
                    className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-8 py-4 text-xl font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <SparkleIcon size={25} weight="fill" />
                    <span>{isCheckingFamily ? "確認中..." : "プラン生成"}</span>
                  </button>
                </div>
              </section>
            )}
          </form>
        </div>
      </div>

      {openHintModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              {HINT_MODAL_CONTENT[openHintModal].title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              {HINT_MODAL_CONTENT[openHintModal].body}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setOpenHintModal(null)}
                className="rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
