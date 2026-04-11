import { z } from 'zod';

export const startChatSchema = z.object({
  body: z.object({
    recipientId: z.string().uuid('Invalid user ID format'),
    initialMessage: z.string().min(1).max(2000)
  }),
});

export const getHistorySchema = z.object({
  params: z.object({
    roomId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID format')
  }),
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50')
  })
});
