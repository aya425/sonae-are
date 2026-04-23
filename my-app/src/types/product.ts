export type ProductType = "emergency_food" | "daily_item";

export type ProductResponseItem = {
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

export type GetProductsResponse = {
  data: {
    items: ProductResponseItem[];
  };
  error: null;
};

export type GetProductsErrorResponse = {
  data: null;
  error: {
    code: string;
    message: string;
    details: string | null;
  };
};
