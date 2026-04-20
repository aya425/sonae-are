import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { openai } from "@/lib/openai";
import { generatePlan } from "@/lib/services/plan-generator";
import type { ProductType } from "@/lib/types/product";
import type { GeneratePlanRequest, PlanDays, PriorityPolicy } from "@/lib/types/plan";

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
  if (category === "おかず" || category === "汁物") {
    return "medium";
  }
  if (category === "おやつ") {
    return "low";
  }
  return "low";
}

function getQuantityByCategory(params: {
  category: string;
  familyMemberCount: number;
  days: PlanDays;
  priorityPolicy: PriorityPolicy;
}): number {
  const base = params.familyMemberCount * params.days;

  if (params.category === "主食" || params.category === "飲料") {
    return base;
  }

  if (params.priorityPolicy === "minimum") {
    if (params.category === "おかず") {
      return Math.max(1, Math.ceil(base * 0.6));
    }
    if (params.category === "汁物") {
      return Math.max(1, Math.ceil(base * 0.5));
    }
    if (params.category === "おやつ") {
      return Math.max(1, Math.ceil(base * 0.3));
    }
    return 1;
  }

  if (params.category === "おかず") {
    return Math.max(1, Math.ceil(base * 0.8));
  }
  if (params.category === "汁物") {
    return Math.max(1, Math.ceil(base * 0.7));
  }
  if (params.category === "おやつ") {
    return Math.max(1, Math.ceil(base * 0.5));
  }

  return 1;
}

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function isValidPlanDays(days: number): days is PlanDays {
  return [3, 7, 14].includes(days);
}

function isValidPriorityPolicy(value: string): value is PriorityPolicy {
  return ["minimum", "balanced"].includes(value);
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

function buildAiPrompt(params: {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  products: NormalizedProduct[];
  recentSelectedProducts: RecentSelectedProduct[];
}) {
  const filteredProducts = params.products
    .filter((product) => product.isActive && product.isFreeFrom28)
    .filter((product) =>
      params.includeDailyItems ? true : product.productType === "emergency_food"
    );

  const categoryOrder = ["主食", "飲料", "おかず", "汁物", "おやつ"] as const;

  const shuffleProducts = (products: typeof filteredProducts) => {
    const shuffled = [...products];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };

  const candidateProducts = categoryOrder
    .flatMap((category) =>
      shuffleProducts(filteredProducts.filter((product) => product.category === category))
    )
    .map((product) => ({
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

可能であれば、今回はこれらと異なる商品を優先してください。
`
      : "";

  return `
あなたは、食物アレルギー家庭向け防災備蓄支援アプリの提案アシスタントです。
固定商品マスタは特定28品目不使用品のみです。
商品の最終安全判定は行わず、提案と説明補助のみを行ってください。

入力条件:
- 家族人数: ${params.familyMemberCount}
- 想定日数: ${params.days}日
- 候補範囲: ${params.includeDailyItems ? "普段の食品も含める" : "防災食のみ"}
- 優先方針: ${params.priorityPolicy === "minimum" ? "必要優先" : "バランス重視"}

候補商品一覧:
${JSON.stringify(candidateProducts)}
${recentSelectedProductsText}
最重要ルール:
1. 候補商品一覧にある商品だけを使う
2. items に重複する productId を入れない
3. includeDailyItems=false のときは emergency_food のみ使う
4. quantity は 1 以上の整数にする
5. 数量は必ず家族人数 ✕ 想定日数を基本に考える
6. 主食と飲料は、必ず同量にする
7. 必要優先のときは、おかず6割・汁物5割・おやつ3割を目安にする
8. バランス重視のときは、おかず8割・汁物7割・おやつ5割を目安にする
9. 同じ条件でも毎回同じ商品名だけに固定しすぎない
10. 候補商品一覧に複数の妥当な候補がある場合は、商品名のバリエーションが出るように選ぶ
11. 特に主食・おかず・汁物・おやつは、毎回同じ商品だけを優先し続けない
12. explanation では、選んだ商品の違いが伝わるようにする
13. explanation は日本語1〜2文、120文字以内にする
14. warnings は日本語で最大2件にする
15. JSON 以外は返さない

reason:
- 商品名の言い換えだけにしない
- そのカテゴリの役割を1文で書く
- 主食=エネルギー確保、飲料=水分補給、おかず=満足感や栄養補助、汁物=食べやすさや温かさ、おやつ=食べやすさや気持ちの負担軽減

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

async function generatePlanWithOpenAI(params: {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  products: NormalizedProduct[];
  recentSelectedProducts: RecentSelectedProduct[];
}) {
  const prompt = buildAiPrompt(params);

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "あなたは防災備蓄提案のアシスタントです。必ずJSONだけを返してください。",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response content is empty.");
  }

  const parsed = JSON.parse(content) as AiPlanResponse;

  if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("OpenAI response items are invalid.");
  }

  const productMap = new Map<string, NormalizedProduct>();

  for (const product of params.products) {
    productMap.set(product.id, product);
    productMap.set(product.name, product);
  }
  const usedProductIds = new Set<string>();
  const usedCategories = new Set<string>();

  const items = parsed.items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      if (usedProductIds.has(product.id)) return null;
      if (usedCategories.has(product.category)) return null;

      usedProductIds.add(product.id);
      usedCategories.add(product.category);

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
        reason: getReasonByCategory(product.category),
      };
    })
    .filter((item) => item !== null);

  if (items.length === 0) {
    throw new Error("OpenAI response could not be mapped to products.");
  }

  const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);

  const annualCost = Math.round(
    items.reduce((sum, item) => {
      return sum + (item.price * item.quantity * 12) / item.shelfLifeMonths;
    }, 0)
  );

  return {
    title: `${params.days}日分プラン`,
    familyMemberCount: params.familyMemberCount,
    days: params.days,
    includeDailyItems: params.includeDailyItems,
    priorityPolicy: params.priorityPolicy,
    totalCost,
    annualCost,
    explanation:
      typeof parsed.explanation === "string" && parsed.explanation.trim().length > 0
        ? parsed.explanation
        : "家族条件と候補条件をもとに、備えのバランスを見ながら提案しています。",
    items,
    warnings:
      Array.isArray(parsed.warnings) && parsed.warnings.length > 0
        ? parsed.warnings
        : [
            "最終的な安全確認は、必ず商品ページや公式表示の原材料・アレルゲン情報を確認してください。",
          ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePlanRequest;
    const { days, includeDailyItems, priorityPolicy } = body;

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

    let recentSelectedProducts: RecentSelectedProduct[] = [];

    const { data: recentPlans, error: recentPlansError } = await supabase
      .from("plans")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (recentPlansError) {
      console.warn("[plans/generate] recent plans fetch failed", recentPlansError);
    } else {
      const latestPlan = (recentPlans?.[0] ?? null) as RecentPlanRow | null;

      if (latestPlan) {
        const { data: recentPlanItems, error: recentPlanItemsError } = await supabase
          .from("plan_items")
          .select("product:products(name, category)")
          .eq("plan_id", latestPlan.id);

        if (recentPlanItemsError) {
          console.warn("[plans/generate] recent plan items fetch failed", recentPlanItemsError);
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

    try {
      const aiGeneratedPlan = await generatePlanWithOpenAI({
        familyMemberCount,
        days,
        includeDailyItems,
        priorityPolicy,
        products: normalizedProducts,
        recentSelectedProducts,
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
      console.warn("[plans/generate] openai failed, fallback to local generator", aiError);

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
    console.error("[plans/generate] unexpected error", error);

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
