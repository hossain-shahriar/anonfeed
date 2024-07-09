import { z } from 'zod'

export const acceptFeedSchema = z.object({
  acceptFeeds: z.boolean(),
});