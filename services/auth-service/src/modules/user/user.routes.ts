import { Router } from 'express';
import { UserController } from './user.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { Role } from '@prisma/client';
import { updateProfileSchema, assignRoleSchema, userIdParamSchema } from './dto/user.schema';
import { uploadProfile } from '../../middlewares/uploadMiddleware';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// Profile
router.get('/:id', UserController.getProfile); // Supports /me
router.put('/me', validateRequest(updateProfileSchema), UserController.updateProfile);
router.post('/upload-avatar', uploadProfile.single('avatar'), UserController.uploadAvatar);
router.delete('/me', UserController.softDeleteSelf);

// Blocking
router.post('/:id/block', validateRequest(userIdParamSchema), UserController.blockUser);
router.post('/:id/unblock', validateRequest(userIdParamSchema), UserController.unblockUser);

// Admin Only
router.put(
  '/:id/role',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  validateRequest(assignRoleSchema),
  UserController.assignRole
);

export { router as userRoutes };
