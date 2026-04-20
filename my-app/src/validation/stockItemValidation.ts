export function validateQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && quantity > 0;
}

export function validateUnitPrice(unitPrice: number): boolean {
  return Number.isFinite(unitPrice) && unitPrice >= 0;
}

export function validateExpiresAt(expiresAt: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return expiresAt > today;
}
