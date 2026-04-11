import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    bio: z.string().max(300).optional(),
    profilePicture: z.string().url('Invalid URL format').optional(),
  }),
});

export const assignRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(Role),
  }),
});

// Using params validator explicitly
export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});
