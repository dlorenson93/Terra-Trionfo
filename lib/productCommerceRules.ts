export const DIRECT_TO_CONSUMER_CATEGORIES = [
  'PASTA',
  'ESPRESSO',
  'SALUMI',
  'OLIVE_OIL',
  'RED_WINE_VINEGAR',
  'ARTISANAL_CRACKERS',
] as const

export const DISTRIBUTION_ONLY_CATEGORIES = ['WINE'] as const

export function getAllowedCommerceModelsForCategory(category: string): Array<'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'> {
  if (DIRECT_TO_CONSUMER_CATEGORIES.includes(category as (typeof DIRECT_TO_CONSUMER_CATEGORIES)[number])) {
    return ['MARKETPLACE']
  }

  if (DISTRIBUTION_ONLY_CATEGORIES.includes(category as (typeof DISTRIBUTION_ONLY_CATEGORIES)[number])) {
    return ['WHOLESALE']
  }

  return ['MARKETPLACE', 'WHOLESALE', 'HYBRID']
}

export function isCategoryEligibleForCommerceModel(category: string, commerceModel: string): boolean {
  return getAllowedCommerceModelsForCategory(category).includes(commerceModel as 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID')
}
