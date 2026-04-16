export type HomeResponse = {
  data: {
    familySummary: {
      memberCount: number;
      hasFamily: boolean;
    };
    costSummary: {
      annualCost: number | null;
      sourcePlanId: string | null;
    };
    expiringItems: {
      count: number;
      items: Array<{
        id: string;
        productName: string;
        expiresAt: string;
        daysLeft: number;
      }>;
    };
    stockSummary: {
      count: number;
    };
    billingSummary: {
      planCode: "free" | "premium";
      maxSavedPlans: number;
    };
    savedPlans: Array<{
      id: string;
      title: string;
      days: number;
      totalEstimatedCost: number;
      updatedAt: string;
    }>;
  };
  error: null;
};
