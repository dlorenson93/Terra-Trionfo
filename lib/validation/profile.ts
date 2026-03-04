import { z } from 'zod'

export const profileSetupSchema = z.object({
  role: z.enum(['CONSUMER', 'VENDOR']),
})

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>
