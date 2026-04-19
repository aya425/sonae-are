import type { ProductResponseItem, ProductType } from "@/lib/types/product";
import type {
  GeneratePlanRequest,
  GeneratePlanSummary,
  GeneratedPlanItem,
  PriorityPolicy,
} from "@/lib/types/plan";

type GeneratePlanInput = GeneratePlanRequest & {
  familyMemberCount: number;
  products: ProductResponseItem[];
};

type GeneratePlanResult = {
  summary: GeneratePlanSummary;
  items: GeneratedPlanItem[];
  explanation: string;
  notice: string;
};

type ItemPriority = "high" | "medium" | "low";

type CategoryName = "主食" | "飲料" | "おかず" | "汁物" | "おやつ";

// MVPでは、おやつも含めて「食べやすさ」と継続しやすさが伝わる提案にする
const CATEGORY_ORDER: CategoryName[] = ["主食", "飲料", "おかず", "汁物", "おやつ"];

function isCategoryName(category: string): category is CategoryName {
  return ["主食", "飲料", "おかず", "汁物", "おやつ"].includes(category);
}

function countProductsByType(products: ProductResponseItem[]): Record<ProductType, number> {
  return products.reduce(
    (counts, product) => {
      counts[product.productType] += 1;
      return counts;
    },
    {
      emergency_food: 0,
      daily_item: 0,
    } as Record<ProductType, number>
  );
}

function chooseCandidateForCategory(
  candidatesInCategory: ProductResponseItem[],
  selected: ProductResponseItem[],
  includeDailyItems: boolean,
  priorityPolicy: PriorityPolicy
): ProductResponseItem | undefined {
  if (candidatesInCategory.length === 0) return undefined;

  if (!includeDailyItems) {
    return (
      candidatesInCategory.find((product) => product.productType === "emergency_food") ??
      candidatesInCategory[0]
    );
  }

  if (priorityPolicy === "minimum") {
    return (
      candidatesInCategory.find((product) => product.productType === "emergency_food") ??
      candidatesInCategory[0]
    );
  }

  const selectedTypeCounts = countProductsByType(selected);
  const dailyCandidate = candidatesInCategory.find(
    (product) => product.productType === "daily_item"
  );
  const emergencyCandidate = candidatesInCategory.find(
    (product) => product.productType === "emergency_food"
  );

  if (dailyCandidate && emergencyCandidate) {
    if (selectedTypeCounts.emergency_food > selectedTypeCounts.daily_item) {
      return dailyCandidate;
    }

    if (selectedTypeCounts.daily_item > selectedTypeCounts.emergency_food) {
      return emergencyCandidate;
    }

    return emergencyCandidate;
  }

  return emergencyCandidate ?? dailyCandidate ?? candidatesInCategory[0];
}

function getPriorityByCategory(category: string): ItemPriority {
  if (category === "主食" || category === "飲料") return "high";
  if (category === "おかず" || category === "汁物") {
    return "medium";
  }
  if (category === "おやつ") {
    return "low";
  }
  return "low";
}

function getCategoryMultiplier(category: string, priorityPolicy: PriorityPolicy): number {
  if (priorityPolicy === "minimum") {
    if (category === "主食") return 1.0;
    if (category === "飲料") return 1.0;
    if (category === "おかず") return 0.6;
    if (category === "汁物") return 0.5;
    if (category === "おやつ") return 0.3;
    return 0.2;
  }

  if (category === "主食") return 1.0;
  if (category === "飲料") return 1.0;
  if (category === "おかず") return 0.8;
  if (category === "汁物") return 0.7;
  if (category === "おやつ") return 0.5;
  return 0.3;
}

function getMinimumQuantity(category: string, priorityPolicy: PriorityPolicy): number {
  if (priorityPolicy === "minimum") {
    if (category === "主食" || category === "飲料") return 2;
    if (category === "おやつ") return 1;
    return 1;
  }

  if (
    category === "主食" ||
    category === "飲料" ||
    category === "おかず" ||
    category === "おやつ"
  ) {
    return 2;
  }

  return 1;
}

function getBaseQuantity(
  category: string,
  familyMemberCount: number,
  days: number,
  priorityPolicy: PriorityPolicy
): number {
  const baseCount = familyMemberCount * days;
  const multipliedCount = Math.ceil(baseCount * getCategoryMultiplier(category, priorityPolicy));

  return Math.max(getMinimumQuantity(category, priorityPolicy), multipliedCount);
}

function getReason(category: string, productType: ProductType, priority: ItemPriority): string {
  const typeLabel = productType === "emergency_food" ? "防災食" : "日常品";

  if (priority === "high") {
    return `${typeLabel}の中でも優先して持ちたい${category}です。`;
  }

  if (priority === "medium") {
    if (category === "おやつ") {
      return "食べやすく、気持ちの負担をやわらげやすい備えとして入れています。";
    }

    return `${category}を補って、備えのバランスを取りやすいです。`;
  }

  return `${typeLabel}として、食べやすさや気持ちの負担軽減にもつながる${category}です。`;
}

function getExplanation(includeDailyItems: boolean, priorityPolicy: PriorityPolicy): string {
  if (priorityPolicy === "minimum" && includeDailyItems) {
    return "最低限そろえる前提で、主食・飲料を優先しつつ、おかず・汁物・おやつも含めて、防災食を中心に一部日常品を組み合わせて提案しています。";
  }

  if (priorityPolicy === "minimum" && !includeDailyItems) {
    return "最低限そろえる前提で、主食・飲料を優先しつつ、おかず・汁物・おやつも含めて防災食中心で提案しています。";
  }

  if (priorityPolicy === "balanced" && includeDailyItems) {
    return "主食・飲料・おかず・汁物・おやつのバランスを見ながら、候補範囲に含まれる防災食と日常品を組み合わせて提案しています。";
  }

  return "主食・飲料・おかず・汁物・おやつのバランスを見ながら、防災食中心で提案しています。";
}

function buildCandidateProducts(
  products: ProductResponseItem[],
  includeDailyItems: boolean,
  priorityPolicy: PriorityPolicy
): ProductResponseItem[] {
  const activeProducts = products.filter((product) => product.isActive && product.isFreeFrom28);

  const targetProducts = includeDailyItems
    ? activeProducts
    : activeProducts.filter((product) => product.productType === "emergency_food");

  const selected: ProductResponseItem[] = [];
  const usedProductIds = new Set<string>();

  for (const category of CATEGORY_ORDER) {
    const candidatesInCategory = targetProducts.filter(
      (product) => isCategoryName(product.category) && product.category === category
    );

    const chosen = chooseCandidateForCategory(
      candidatesInCategory,
      selected,
      includeDailyItems,
      priorityPolicy
    );

    if (!chosen || usedProductIds.has(chosen.id)) continue;

    selected.push(chosen);
    usedProductIds.add(chosen.id);
  }

  return selected;
}

// 現状は、固定商品マスタ（特定28品目不使用品）を前提に、
// familyMemberCount・想定日数・候補範囲・優先方針をもとに提案するMVP版。
// アレルギー情報は商品除外ロジックの中心には置かず、最終確認は注意文で補足する。
export function generatePlan({
  familyMemberCount,
  days,
  includeDailyItems,
  priorityPolicy,
  products,
}: GeneratePlanInput): GeneratePlanResult {
  const candidateProducts = buildCandidateProducts(products, includeDailyItems, priorityPolicy);

  const items: GeneratedPlanItem[] = candidateProducts.map((product) => {
    const priority = getPriorityByCategory(product.category);
    const quantity = getBaseQuantity(product.category, familyMemberCount, days, priorityPolicy);
    const subtotal = product.price * quantity;

    return {
      ...product,
      quantity,
      subtotal,
      priority,
      reason: getReason(product.category, product.productType, priority),
    };
  });

  const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);

  const annualCost = Math.round(
    items.reduce((sum, item) => {
      return sum + (item.price * item.quantity * 12) / item.shelfLifeMonths;
    }, 0)
  );

  return {
    summary: {
      familyMemberCount,
      days,
      includeDailyItems,
      priorityPolicy,
      totalCost,
      annualCost,
    },
    items,
    explanation: getExplanation(includeDailyItems, priorityPolicy),
    notice:
      "最終的な安全確認は、必ず商品ページや公式表示の原材料・アレルゲン情報を確認してください。",
  };
}
