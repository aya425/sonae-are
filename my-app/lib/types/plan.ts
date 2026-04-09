import type { ProductResponseItem } from "@/lib/types/product";

export type PriorityPolicy = "minimum" | "balanced";

export type GeneratePlanRequest = {
  days: 3 | 7;
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
  days: 3 | 7;
  includeDailyItems: boolean;
  priorityPolicy: PriorityPolicy;
  totalCost: number;
  annualCost: number;
};

export type GeneratePlanData = {
  plan: {
    summary: GeneratePlanSummary;
    items: GeneratedPlanItem[];
    explanation: string;
    notice: string;
  };
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
