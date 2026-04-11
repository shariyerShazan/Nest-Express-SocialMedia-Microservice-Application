import { Router } from 'express';
import { AdminAuthController } from '../modules/auth/auth.controller';
import { AdminUserController } from '../modules/users/users.controller';
import { AdminFeedController } from '../modules/feed/feed.controller';
import { requireAdmin, requireSuperAdmin } from '../middleware/rbac';
import { requireAuth } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { 
  adminLoginSchema, 
  registerStaffSchema, 
  idParamSchema, 
  mongoIdParamSchema 
} from '../modules/auth/dto/admin.schema';

const router = Router();

// Auth Routes
router.post('/auth/login', validateRequest(adminLoginSchema), AdminAuthController.login);
router.post(
  '/auth/register-staff', 
  requireAuth, 
  requireSuperAdmin, 
  validateRequest(registerStaffSchema), 
  AdminAuthController.registerStaff
);

// User Moderation Routes
router.get('/users', requireAuth, requireAdmin, AdminUserController.listUsers);
router.put(
  '/users/:id/suspend', 
  requireAuth, 
  requireAdmin, 
  validateRequest(idParamSchema), 
  AdminUserController.suspendUser
);
router.delete(
  '/users/:id/hard', 
  requireAuth, 
  requireSuperAdmin, 
  validateRequest(idParamSchema), 
  AdminUserController.hardDeleteUser
);

// Content Moderation Routes
router.get('/posts', requireAuth, requireAdmin, AdminFeedController.listPosts);
router.put(
  '/posts/:id/hide', 
  requireAuth, 
  requireAdmin, 
  validateRequest(mongoIdParamSchema), 
  AdminFeedController.hidePost
);
router.delete(
  '/posts/:id/hard', 
  requireAuth, 
  requireSuperAdmin, 
  validateRequest(mongoIdParamSchema), 
  AdminFeedController.hardDeletePost
);

export default router;
