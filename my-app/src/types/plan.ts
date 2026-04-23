import type { ProductResponseItem } from "@/src/types/product";

export type PlanDays = 3 | 7 | 14;
export type PriorityPolicy = "minimum" | "balanced";

export type GeneratePlanRequest = {
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
};

export type GeneratedPlanItem = ProductResponseItem & {
  quantity: number;
  subtotal: number;
  priority: "high" | "medium" | "low";
  reason: string;
};

export type GeneratePlanSummary = {
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  totalCost: number;
  annualCost: number;
};

export type GeneratedPlan = {
  title: string;
  familyMemberCount: number;
  days: PlanDays;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  totalCost: number;
  annualCost: number;
  explanation: string;
  items: GeneratedPlanItem[];
  warnings: string[];
};

export type GeneratePlanData = {
  generatedPlan: GeneratedPlan;
};

export type GeneratePlanResponse = {
  data: GeneratePlanData;
  error: null;
};

export type GeneratePlanErrorResponse = {
  data: null;
  error: {
    code: string;
    message: string;
    details: string | null;
  };
};
