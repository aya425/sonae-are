export function normalizeAllergens(allergens: string[]) {
  return [...new Set(allergens.map((item) => item.trim()).filter(Boolean))];
}
