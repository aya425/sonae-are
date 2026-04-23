import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { openai } from "@/src/lib/openai";
import { generatePlan } from "@/src/services/plan-generator";
import { logger } from "@/src/lib/logger";
import type { ProductType } from "@/src/types/product";
import type { GeneratePlanRequest, PlanDays, PriorityPolicy } from "@/src/types/plan";

type FamilyMemberRow = {
  id: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  product_type: ProductType;
  is_free_from_28: boolean;
  price: number;
  purchase_url: string;
  shelf_life_months: number;
  is_active: boolean;
};

type NormalizedProduct = {
  id: string;
  name: string;
  category: string;
  productType: ProductType;
  isFreeFrom28: boolean;
  price: number;
  purchaseUrl: string;
  shelfLifeMonths: number;
  isActive: boolean;
};

type RecentPlanRow = {
  id: string;
};

type RecentSelectedProduct = {
  name: string;
  category: string;
};

type PlanItemWithProductRow = {
  product: Array<{
    name: string;
    category: string;
  }> | null;
};

type AiPlanItem = {
  productId: string;
  quantity: number;
  priority: "high" | "medium" | "low";
  reason: string;
};

type AiPlanResponse = {
  explanation: string;
  warnings: string[];
  items: AiPlanItem[];
};

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = 25000;

function isValidPlanDays(days: number): days is PlanDays {
  return [3, 7, 14].includes(days);
}

function isValidPriorityPolicy(value: string): value is PriorityPolicy {
  return ["minimum", "balanced"].includes(value);
}

function getReasonByCategory(category: string): string {
  if (category === "主食") {
    return "災害時のエネルギー確保の中心になる主食として選びました。";
  }
  if (category === "飲料") {
    return "水分補給に必要な飲料として優先して入れています。";
  }
  if (category === "おかず") {
    return "主食だけでは不足しやすい満足感や栄養を補うために入れています。";
  }
  if (category === "汁物") {
    return "食べやすさや温かさを補うために入れています。";
  }
  if (category === "おやつ") {
    return "食べやすさや気持ちの負担軽減につながる備えとして入れています。";
  }
  return "家族条件と備えのバランスを見て提案しています。";
}

function getPriorityByCategory(category: string): "high" | "medium" | "low" {
  if (category === "主食" || category === "飲料") return "high";
  if (category === "おかず" || category === "汁物") return "medium";
  return "low";
}

function getQuantityByCategory(params: {
  category: string;
  familyMemberCount: number;
  days: PlanDays;
  priorityPolicy: PriorityPolicy;
}): number {
  const mealBase = params.familyMemberCount * params.days * 3;

  if (params.category === "主食") {
    return mealBase;
  }

  if (params.category === "飲料") {
    return mealBase;
  }

  if (params.category === "おかず") {
    return Math.max(1, Math.ceil(mealBase * (params.priorityPolicy === "minimum" ? 0.6 : 0.7)));
  }

  if (params.category === "汁物") {
    return Math.max(1, Math.ceil(mealBase * (params.priorityPolicy === "minimum" ? 0.5 : 0.6)));
  }

  if (params.category === "おやつ") {
    return Math.max(1, Math.ceil(mealBase * 0.3));
  }

  return 1;
}

function buildPlanExplanation(params: {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  items: Array<{
    category: string;
    productType: ProductType;
  }>;
}): string {
  const categories = Array.from(new Set(params.items.map((item) => item.category)));
  const hasDailyItems = params.items.some((item) => item.productType === "daily_item");
  const hasEmergencyFoods = params.items.some((item) => item.productType === "emergency_food");

  const sourceText =
    hasDailyItems && hasEmergencyFoods
      ? "防災食と日常品を組み合わせて"
      : hasDailyItems
        ? "日常品も活用して"
        : "防災食を中心に";

  const policyText =
    params.priorityPolicy === "minimum"
      ? "主食と飲料を優先しつつ、必要な副菜を絞って"
      : "主食・飲料に加えて、おかずや汁物も含めて";

  const categoryText = categories.length > 0 ? categories.join("・") : "主食・飲料・おかず";

  return `${params.familyMemberCount}人×${params.days}日分を1日3食ベースで考え、${sourceText}${policyText}備えています。${categoryText}を含めて、続けやすさと食べやすさのバランスを取りました。`;
}

function buildPlanWarnings(params: {
  includeDailyItems: boolean;
  items: Array<{
    productType: ProductType;
  }>;
}): string[] {
  const warnings = [
    "購入前に必ず商品ページやパッケージで原材料・アレルゲン表示を確認してください。",
    "保存目安や賞味期限を確認し、入れ替えしやすい場所で管理してください。",
  ];

  const hasDailyItems = params.items.some((item) => item.productType === "daily_item");

  if (params.includeDailyItems && hasDailyItems) {
    warnings[1] = "日常品を含むため、普段の消費と入れ替えを前提に早めに見直してください。";
  }

  return warnings;
}

function buildFallbackResponse(params: {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  products: NormalizedProduct[];
}) {
  const fallbackPlan = generatePlan(params);

  return {
    title: `${fallbackPlan.summary.days}日分プラン`,
    familyMemberCount: fallbackPlan.summary.familyMemberCount,
    days: fallbackPlan.summary.days,
    includeDailyItems: fallbackPlan.summary.includeDailyItems,
    priorityPolicy: fallbackPlan.summary.priorityPolicy,
    totalCost: fallbackPlan.summary.totalCost,
    annualCost: fallbackPlan.summary.annualCost,
    explanation: fallbackPlan.explanation,
    items: fallbackPlan.items,
    warnings: [fallbackPlan.notice],
  };
}

function shuffleProducts(products: NormalizedProduct[]) {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectCandidateProducts(params: {
  products: NormalizedProduct[];
  includeDailyItems: boolean;
  recentSelectedProducts: RecentSelectedProduct[];
}) {
  const filteredProducts = params.products
    .filter((product) => product.isActive && product.isFreeFrom28)
    .filter((product) =>
      params.includeDailyItems ? true : product.productType === "emergency_food"
    );

  const recentSelectedProductNames = new Set(
    params.recentSelectedProducts.map((product) => product.name)
  );

  const perCategoryLimit: Record<string, number> = {
    主食: 8,
    飲料: 2,
    おかず: 8,
    汁物: 8,
    おやつ: 8,
  };

  const categories = ["主食", "飲料", "おかず", "汁物", "おやつ"];

  return categories.flatMap((category) => {
    const categoryProducts = filteredProducts.filter((product) => product.category === category);

    const preferredProducts = categoryProducts.filter(
      (product) => !recentSelectedProductNames.has(product.name)
    );

    const fallbackProducts = categoryProducts.filter((product) =>
      recentSelectedProductNames.has(product.name)
    );

    const preferredSelected = shuffleProducts(preferredProducts).slice(
      0,
      perCategoryLimit[category] ?? 3
    );

    if (preferredSelected.length >= (perCategoryLimit[category] ?? 3)) {
      return preferredSelected;
    }

    const remainingCount = (perCategoryLimit[category] ?? 3) - preferredSelected.length;
    const fallbackSelected = shuffleProducts(fallbackProducts).slice(0, remainingCount);

    return [...preferredSelected, ...fallbackSelected];
  });
}

function buildAiPrompt(params: {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  candidateProducts: NormalizedProduct[];
  recentSelectedProducts: RecentSelectedProduct[];
}) {
  const candidateProductsText = params.candidateProducts.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    productType: product.productType,
    price: product.price,
  }));

  const recentSelectedProductsText =
    params.recentSelectedProducts.length > 0
      ? `
直近で選ばれた商品:
${params.recentSelectedProducts
  .map((product) => `- ${product.category}: ${product.name}`)
  .join("\n")}

上記と異なる商品を必ず優先してください。
`
      : "";

  return `
あなたは、食物アレルギー家庭向け防災備蓄支援アプリの提案アシスタントです。
固定商品マスタは特定28品目不使用品のみです。
商品の最終安全判定は行わず、提案と説明補助のみを行ってください。
候補商品一覧にある商品だけを使って、JSONだけを返してください。

入力条件:
- 家族人数: ${params.familyMemberCount}
- 想定日数: ${params.days}日
- 候補範囲: ${params.includeDailyItems ? "普段の食品も含める" : "防災食のみ"}
- 優先方針: ${params.priorityPolicy === "minimum" ? "必要優先" : "バランス重視"}

候補商品一覧:
${JSON.stringify(candidateProductsText, null, 2)}
${recentSelectedProductsText}
最重要ルール:
1. 候補商品一覧にある商品だけを使う
2. items の productId は候補商品の id をそのまま使う
3. items に重複する productId を入れない
4. includeDailyItems=false のときは emergency_food のみ使う
5. items には、主食・飲料・おかず・汁物・おやつをそれぞれ最低1件ずつ含める
6. 同じ条件でも毎回同じ商品名だけに固定しない
7. 候補商品一覧に複数の妥当な候補がある場合は、直近で選ばれた商品ではなく、別の商品を優先して選ぶ
8. 特に主食・おかず・汁物・おやつは、直近で選ばれた商品を優先し続けない
9. explanation では、選んだ商品の違いや備え方の考え方が伝わるようにする
10. explanation は日本語1〜2文、120文字以内にする
11. warnings は日本語で最大2件にする 
12. JSON 以外は返さない

reason:
- 商品名の言い換えだけにしない
- 商品名を入れない
- そのカテゴリの役割を1文で書く
- 主食=エネルギー確保、飲料=水分補給、おかず=満足感や栄養補助、汁物=食べやすさや温かさ、おやつ=食べやすさや気持ちの負担軽減
- 良い例：災害時のエネルギー確保の中心になる主食として選びました。
- 良い例：水分補給に必要な飲料として優先して入れています。
- 良い例：主食だけでは不足しやすい満足感や栄養を補うために入れています。
- 良い例：食べやすさや温かさを補うために入れています。
- 良い例：食べやすさや気持ちの負担軽減につながる備えとして入れています。

explanation:
- 良い例：防災食を中心に必要なカテゴリをそろえながら、家族が食べ進めやすいように主食・飲料・おかず・汁物をバランスよく組み合わせています。
- 良い例：日常品も活用しながら、主食と飲料を優先して確保しつつ、おかずや汁物も加えて備えの偏りを減らしています。
- 良い例：災害時に必要な主食と飲料を優先しつつ、おかずや汁物も組み合わせて、家族分の食事を無理なく続けやすい内容にしています。
- 良い例：主食と飲料を中心にそろえながら、おかずや汁物も含めて、食べやすさと続けやすさのバランスを取りました。
- 良い例：家族分の食数を確保しやすい主食と飲料を軸にしつつ、満足感や食べやすさを補えるようにおかずや汁物も入れています。

warnings:
- 原材料・アレルゲン確認を優先して伝える
- 賞味期限確認と定期的な見直しを伝える

出力例:
{
  "explanation": "主食と飲料を優先しつつ、おかずや汁物も含めて備えの偏りを減らす構成にしています。",
  "warnings": [
    "購入前に商品ページや公式表示で原材料・アレルゲン情報を確認してください。",
    "購入後は賞味期限を見ながら定期的に見直してください。"
  ],
  "items": [
    {
      "productId": "p1",
      "quantity": 9,
      "priority": "high",
      "reason": "災害時のエネルギー確保の中心になる主食として選びました。"
    }
  ]
}

返却形式は必ず JSON のみ:
{
  "explanation": "string",
  "warnings": ["string"],
  "items": [
    {
      "productId": "string",
      "quantity": 1,
      "priority": "high",
      "reason": "string"
    }
  ]
}
`.trim();
}

async function createStructuredPlan(params: {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  candidateProducts: NormalizedProduct[];
  recentSelectedProducts: RecentSelectedProduct[];
}): Promise<AiPlanResponse> {
  const prompt = buildAiPrompt(params);

  logger.info("plans generate openai model selected", {
    feature: "plan_generate",
    model: OPENAI_MODEL,
    candidateProductCount: params.candidateProducts.length,
  });

  const response = await Promise.race([
    openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "あなたは防災備蓄提案のアシスタントです。必ずJSON Schemaに従って返答してください。",
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "plan_response",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["explanation", "warnings", "items"],
            properties: {
              explanation: {
                type: "string",
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                maxItems: 2,
              },
              items: {
                type: "array",
                minItems: 4,
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["productId", "quantity", "priority", "reason"],
                  properties: {
                    productId: { type: "string" },
                    quantity: { type: "integer", minimum: 1 },
                    priority: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                    },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          strict: true,
        },
      },
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("OpenAI response timed out.")), OPENAI_TIMEOUT_MS)
    ),
  ]);

  const outputText =
    typeof (response as { output_text?: unknown }).output_text === "string"
      ? (response as { output_text: string }).output_text
      : "";

  if (!outputText) {
    throw new Error("OpenAI structured response is empty.");
  }

  const parsed = JSON.parse(outputText) as AiPlanResponse;

  if (!parsed || !Array.isArray(parsed.items) || parsed.items.length < 4) {
    throw new Error("OpenAI structured response items are invalid.");
  }

  return parsed;
}

// --- validation helpers for AI-generated explanation and warnings ---

function isAcceptableExplanation(value: string | null | undefined): value is string {
  if (typeof value !== "string") return false;

  const normalized = value.trim();

  if (normalized.length < 30 || normalized.length > 120) {
    return false;
  }

  const blockedPatterns = [
    "商品id",
    "productid",
    "json",
    "候補商品一覧",
    "instructions",
    "ルール:",
    "返却形式",
    "```",
    "<",
    ">",
  ];

  const lower = normalized.toLowerCase();

  return !blockedPatterns.some((pattern) => lower.includes(pattern));
}

function normalizeWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length >= 10 && item.length <= 80)
    .filter(
      (item) =>
        !["json", "productid", "候補商品一覧", "返却形式", "```"].some((pattern) =>
          item.toLowerCase().includes(pattern)
        )
    )
    .slice(0, 2);
}

function isAcceptableItemReason(value: string | null | undefined): value is string {
  if (typeof value !== "string") return false;

  const normalized = value.trim();

  if (normalized.length < 20 || normalized.length > 80) {
    return false;
  }

  const blockedPatterns = [
    "商品id",
    "productid",
    "json",
    "候補商品一覧",
    "instructions",
    "ルール:",
    "返却形式",
    "```",
    "<",
    ">",
  ];

  const lower = normalized.toLowerCase();

  return !blockedPatterns.some((pattern) => lower.includes(pattern));
}

async function generatePlanWithOpenAI(params: {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  products: NormalizedProduct[];
  recentSelectedProducts: RecentSelectedProduct[];
}) {
  const candidateProducts = selectCandidateProducts({
    products: params.products,
    includeDailyItems: params.includeDailyItems,
    recentSelectedProducts: params.recentSelectedProducts,
  });

  const parsed = await createStructuredPlan({
    familyMemberCount: params.familyMemberCount,
    days: params.days,
    includeDailyItems: params.includeDailyItems,
    priorityPolicy: params.priorityPolicy,
    candidateProducts,
    recentSelectedProducts: params.recentSelectedProducts,
  });

  logger.info("plans generate ai parsed", {
    feature: "plan_generate",
    parsedItemCount: parsed.items.length,
    parsedProductIds: parsed.items.map((item) => item.productId),
  });

  const productMap = new Map<string, NormalizedProduct>();
  for (const product of candidateProducts) {
    productMap.set(product.id, product);
  }

  const usedProductIds = new Set<string>();

  const mappedItems = parsed.items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      if (usedProductIds.has(product.id)) return null;

      usedProductIds.add(product.id);

      const quantity = getQuantityByCategory({
        category: product.category,
        familyMemberCount: params.familyMemberCount,
        days: params.days,
        priorityPolicy: params.priorityPolicy,
      });

      const subtotal = product.price * quantity;

      return {
        ...product,
        quantity,
        subtotal,
        priority: getPriorityByCategory(product.category),
        reason: isAcceptableItemReason(item.reason)
          ? item.reason.trim()
          : getReasonByCategory(product.category),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  logger.info("plans generate ai mapped", {
    feature: "plan_generate",
    mappedItemCount: mappedItems.length,
    mappedProductIds: mappedItems.map((item) => item.id),
    mappedCategories: mappedItems.map((item) => item.category),
  });

  const requiredCategories = ["主食", "飲料", "おかず", "汁物", "おやつ"] as const;

  const selectedItems: typeof mappedItems = [];
  const selectedProductIds = new Set<string>();

  for (const category of requiredCategories) {
    const existingItem = mappedItems.find((item) => item.category === category);

    if (existingItem) {
      selectedItems.push(existingItem);
      selectedProductIds.add(existingItem.id);
      continue;
    }

    const fallbackProduct = candidateProducts.find(
      (product) => product.category === category && !selectedProductIds.has(product.id)
    );

    if (!fallbackProduct) {
      continue;
    }

    const quantity = getQuantityByCategory({
      category: fallbackProduct.category,
      familyMemberCount: params.familyMemberCount,
      days: params.days,
      priorityPolicy: params.priorityPolicy,
    });

    selectedItems.push({
      ...fallbackProduct,
      quantity,
      subtotal: fallbackProduct.price * quantity,
      priority: getPriorityByCategory(fallbackProduct.category),
      reason: getReasonByCategory(fallbackProduct.category),
    });
    selectedProductIds.add(fallbackProduct.id);
  }

  logger.info("plans generate ai normalized", {
    feature: "plan_generate",
    normalizedItemCount: selectedItems.length,
    normalizedProductIds: selectedItems.map((item) => item.id),
    normalizedCategories: selectedItems.map((item) => item.category),
  });

  if (selectedItems.length < 4) {
    throw new Error("OpenAI response could not be normalized to enough products.");
  }

  const totalCost = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const annualCost = Math.round(
    selectedItems.reduce(
      (sum, item) => sum + (item.price * item.quantity * 12) / item.shelfLifeMonths,
      0
    )
  );

  return {
    title: `${params.days}日分プラン`,
    familyMemberCount: params.familyMemberCount,
    days: params.days,
    includeDailyItems: params.includeDailyItems,
    priorityPolicy: params.priorityPolicy,
    totalCost,
    annualCost,
    explanation: isAcceptableExplanation(parsed.explanation)
      ? parsed.explanation.trim()
      : buildPlanExplanation({
          familyMemberCount: params.familyMemberCount,
          days: params.days,
          includeDailyItems: params.includeDailyItems,
          priorityPolicy: params.priorityPolicy,
          items: selectedItems.map((item) => ({
            category: item.category,
            productType: item.productType,
          })),
        }),
    items: selectedItems,
    warnings:
      normalizeWarnings(parsed.warnings).length > 0
        ? normalizeWarnings(parsed.warnings)
        : buildPlanWarnings({
            includeDailyItems: params.includeDailyItems,
            items: selectedItems.map((item) => ({
              productType: item.productType,
            })),
          }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePlanRequest;

    logger.info("plans generate started", {
      feature: "plan_generate",
    });

    const { days, includeDailyItems, priorityPolicy } = body;

    logger.info("plans generate request validated", {
      feature: "plan_generate",
      days,
      includeDailyItems,
      priorityPolicy,
    });

    if (!isValidPlanDays(days)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_DAYS",
            message: "daysは3または7または14を指定してください。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    if (!isValidPriorityPolicy(priorityPolicy)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_PRIORITY_POLICY",
            message: "priorityPolicyが不正です。",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "認証が必要です。",
            details: null,
          },
        },
        { status: 401 }
      );
    }

    logger.info("plans generate authorized", {
      feature: "plan_generate",
      userId: user.id,
    });

    const { data: familyMembers, error: familyError } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id);

    if (familyError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FAMILY_MEMBERS_FETCH_FAILED",
            message: "家族情報の取得に失敗しました。",
            details: familyError.message,
          },
        },
        { status: 500 }
      );
    }

    const familyMemberCount = ((familyMembers ?? []) as FamilyMemberRow[]).length;

    logger.info("plans generate family members fetched", {
      feature: "plan_generate",
      userId: user.id,
      familyMemberCount,
    });

    if (familyMemberCount === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "FAMILY_MEMBERS_REQUIRED",
            message: "家族情報が未登録のため、備えプランを生成できません。",
            details: null,
          },
        },
        { status: 422 }
      );
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, name, category, product_type, is_free_from_28, price, purchase_url, shelf_life_months, is_active"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (productsError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PRODUCTS_FETCH_FAILED",
            message: "商品の取得に失敗しました。",
            details: productsError.message,
          },
        },
        { status: 500 }
      );
    }

    const normalizedProducts = ((products ?? []) as ProductRow[]).map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      productType: product.product_type,
      isFreeFrom28: product.is_free_from_28,
      price: product.price,
      purchaseUrl: product.purchase_url,
      shelfLifeMonths: product.shelf_life_months,
      isActive: product.is_active,
    }));

    logger.info("plans generate products fetched", {
      feature: "plan_generate",
      userId: user.id,
      productCount: normalizedProducts.length,
    });

    let recentSelectedProducts: RecentSelectedProduct[] = [];

    const { data: recentPlans, error: recentPlansError } = await supabase
      .from("plans")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (recentPlansError) {
      logger.warn("plans generate recent plans fetch failed", {
        feature: "plan_generate",
        userId: user.id,
        error: recentPlansError.message,
      });
    } else {
      const latestPlan = (recentPlans?.[0] ?? null) as RecentPlanRow | null;

      if (latestPlan) {
        const { data: recentPlanItems, error: recentPlanItemsError } = await supabase
          .from("plan_items")
          .select("product:products(name, category)")
          .eq("plan_id", latestPlan.id);

        if (recentPlanItemsError) {
          logger.warn("plans generate recent plan items fetch failed", {
            feature: "plan_generate",
            userId: user.id,
            error: recentPlanItemsError.message,
          });
        } else {
          recentSelectedProducts = ((recentPlanItems ?? []) as PlanItemWithProductRow[])
            .flatMap((item) => item.product ?? [])
            .filter(
              (product): product is { name: string; category: string } =>
                Boolean(product?.name) && Boolean(product?.category)
            )
            .slice(0, 5);
        }
      }
    }

    const fallbackResponse = buildFallbackResponse({
      familyMemberCount,
      days,
      includeDailyItems,
      priorityPolicy,
      products: normalizedProducts,
    });

    logger.info("plans generate fallback prepared", {
      feature: "plan_generate",
      userId: user.id,
      fallbackItemCount: fallbackResponse.items.length,
    });

    try {
      const aiGeneratedPlan = await generatePlanWithOpenAI({
        familyMemberCount,
        days,
        includeDailyItems,
        priorityPolicy,
        products: normalizedProducts,
        recentSelectedProducts,
      });

      logger.info("plans generate ai succeeded", {
        feature: "plan_generate",
        userId: user.id,
        generatedItemCount: aiGeneratedPlan.items.length,
      });

      return NextResponse.json(
        {
          data: {
            generatedPlan: aiGeneratedPlan,
          },
          error: null,
        },
        { status: 200 }
      );
    } catch (aiError) {
      logger.warn("plans generate ai failed, fallback to local generator", {
        feature: "plan_generate",
        userId: user.id,
        error: aiError instanceof Error ? aiError.message : "unknown error",
      });

      logger.info("plans generate fallback succeeded", {
        feature: "plan_generate",
        userId: user.id,
        generatedItemCount: fallbackResponse.items.length,
      });

      return NextResponse.json(
        {
          data: {
            generatedPlan: fallbackResponse,
          },
          error: null,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    logger.error("plans generate unexpected error", {
      feature: "plan_generate",
      error: error instanceof Error ? error.message : "unknown error",
    });

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "予期しないエラーが発生しました。",
          details: error instanceof Error ? error.message : null,
        },
      },
      { status: 500 }
    );
  }
}
