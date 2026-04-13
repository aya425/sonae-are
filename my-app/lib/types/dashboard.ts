export type DashboardResponse = {
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

// TODO: 実データ接続前の最小モックレスポンス
export const mockDashboardResponse: DashboardResponse = {
  data: {
    familySummary: {
      memberCount: 3,
      hasFamily: true,
    },
    costSummary: {
      annualCost: 12800,
      sourcePlanId: "plan_latest_1",
    },
    expiringItems: {
      count: 2,
      items: [
        {
          id: "stock_1",
          productName: "アレルギー対応ビスケット",
          expiresAt: "2026-05-13",
          daysLeft: 30,
        },
        {
          id: "stock_2",
          productName: "保存水",
          expiresAt: "2026-05-20",
          daysLeft: 37,
        },
      ],
    },
    stockSummary: {
      count: 6,
    },
    billingSummary: {
      planCode: "free",
      maxSavedPlans: 1,
    },
    savedPlans: [
      {
        id: "plan_1",
        title: "3日分プラン",
        days: 3,
        totalEstimatedCost: 5400,
        updatedAt: "2026-04-13T09:00:00.000Z",
      },
    ],
  },
  error: null,
};
