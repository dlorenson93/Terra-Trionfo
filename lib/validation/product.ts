import { z } from 'zod'

export const productCreateSchema = z.object({
  companyId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  imageUrl: z.string().url().optional(),
  commerceModel: z.enum(['MARKETPLACE', 'WHOLESALE', 'HYBRID']),
  listingOwner: z.enum(['VENDOR', 'TERRA']),
  vendorPrice: z.number().nonnegative().optional(),
  wholesalePrice: z.number().nonnegative().optional(),
  retailPrice: z.number().nonnegative().optional(), // dollars
  retailPriceCents: z.number().int().nonnegative().optional(),
  inventory: z.number().int().nonnegative().optional(),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
