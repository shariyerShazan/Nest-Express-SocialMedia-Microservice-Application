import { db } from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { Role } from '@prisma/client';
import { logger } from '../../config/logger';

export class UserService {
  async getProfile(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        profilePicture: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; bio?: string; profilePicture?: string }) {
    await this.getProfile(userId);

    const allowed = ['firstName', 'lastName', 'bio', 'profilePicture'];
    const safeData = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowed.includes(key))
    );

    const updated = await db.user.update({
      where: { id: userId },
      data: safeData,
      select: {
        id: true, firstName: true, lastName: true, bio: true, profilePicture: true
      }
    });

    logger.info({ userId }, 'User profile updated');
    return updated;
  }

  async blockUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestError('You cannot block yourself');
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId, isDeleted: false }
    });
    if (!targetUser) throw new NotFoundError('Target user not found');

    await db.user.update({
      where: { id: currentUserId },
      data: {
        blockedUsers: {
          connect: { id: targetUserId }
        }
      }
    });

    logger.info({ currentUserId, targetUserId }, 'User blocked');
    return { message: 'User blocked successfully' };
  }

  async unblockUser(currentUserId: string, targetUserId: string) {
    await db.user.update({
      where: { id: currentUserId },
      data: {
        blockedUsers: {
          disconnect: { id: targetUserId }
        }
      }
    });

    logger.info({ currentUserId, targetUserId }, 'User unblocked');
    return { message: 'User unblocked successfully' };
  }

  async softDelete(userId: string) {
    await db.user.update({
      where: { id: userId },
      data: { isDeleted: true }
    });

    logger.info({ userId }, 'User soft deleted');
    return { message: 'Account deactivated successfully' };
  }

  async assignRole(targetUserId: string, newRole: Role, requestingUser: { userId: string; role: string }) {
    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundError('User not found');

    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestError('Cannot change role of SUPER_ADMIN');
    }

    if (requestingUser.role !== Role.SUPER_ADMIN && newRole === Role.SUPER_ADMIN) {
      throw new BadRequestError('Only SUPER_ADMIN can promote to SUPER_ADMIN');
    }

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, role: true }
    });

    logger.info({ targetUserId, newRole, by: requestingUser.userId }, 'Role assigned');
    return updated;
  }
}
