// Feature-flag style category control.
// To enable a new category, simply add it to VISIBLE_CATEGORIES.
// No schema changes needed — just add the value and redeploy.

export const VISIBLE_CATEGORIES = [
  'WINE',
  'OLIVE_OIL',
  'PASTA',
  'ESPRESSO',
  'SALUMI',
  'RED_WINE_VINEGAR',
  'ARTISANAL_CRACKERS',
] as const

export type VisibleCategory = (typeof VISIBLE_CATEGORIES)[number]

// Display labels for all categories (including future ones)
export const CATEGORY_LABELS: Record<string, string> = {
  WINE: 'Wine',
  OLIVE_OIL: 'Olive Oil',
  PASTA: 'Pasta',
  ESPRESSO: 'Espresso',
  SALUMI: 'Salumi',
  RED_WINE_VINEGAR: 'Red Wine Vinegar',
  ARTISANAL_CRACKERS: 'Artisanal Crackers',
  SPIRITS: 'Spirits',
  BEER: 'Beer',
  FOOD: 'Artisan Food',
  ACCESSORIES: 'Accessories',
  MERCH: 'Merch',
}

// Emoji icons per category for UI sections
export const CATEGORY_ICONS: Record<string, string> = {
  WINE: '🍷',
  OLIVE_OIL: '🫒',
  PASTA: '🍝',
  ESPRESSO: '☕',
  SALUMI: '🥩',
  RED_WINE_VINEGAR: '🧴',
  ARTISANAL_CRACKERS: '🥨',
  SPIRITS: '🥃',
  BEER: '🍺',
  FOOD: '🧀',
  ACCESSORIES: '🧰',
  MERCH: '👕',
}

// Categories vendors are allowed to list under (matches VISIBLE_CATEGORIES for now)
export const VENDOR_ALLOWED_CATEGORIES = VISIBLE_CATEGORIES
