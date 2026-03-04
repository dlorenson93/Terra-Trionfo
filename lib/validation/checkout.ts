import { z } from 'zod'

export const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
    })
  ),
  fulfillmentType: z.enum(['PICKUP', 'LOCAL_DELIVERY']),
  deliveryState: z.string().optional(),
  scheduledDate: z.string().optional(),
  pickupLocationId: z.string().optional(),
  address: z.string().optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
