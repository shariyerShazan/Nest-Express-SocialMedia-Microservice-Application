import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../utils/errors';
import { sendEmail } from '../../config/mailer';
import { TokenType } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '../../config/logger';

const BCRYPT_ROUNDS = 12; // Increased from 10 for better security

export class AuthService {
  private generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  private signAccessToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '15m' }); // Short-lived
  }

  private signRefreshToken(userId: string) {
    return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, { expiresIn: '7d' });
  }

  async register({ email, password }: { email: string; password: string }) {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      // Use ConflictError instead of BadRequest for clearer semantics
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await db.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    const verifyToken = this.generateSecureToken();
    await db.verificationToken.create({
      data: {
        token: verifyToken,
        type: TokenType.EMAIL_VERIFICATION,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });

    // Fire-and-forget email
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3001'}/api/v1/auth/verify-email?token=${verifyToken}`;
    sendEmail(email, 'Verify your email', `Click to verify: ${verifyUrl}`).catch((err) =>
      logger.error(err, 'Failed to send verification email')
    );

    logger.info({ userId: user.id }, 'User registered');
    return { message: 'Registration successful. Please verify your email.' };
  }

  async login({ email, password }: { email: string; password: string }) {
    // Fetch only needed fields to avoid over-fetching
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, passwordHash: true, isDeleted: true, isEmailVerified: true },
    });

    // Constant-time check to prevent timing attacks
    const dummyHash = '$2b$12$invalidhashforcomparisonpurposesonly';
    const isValid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || user.isDeleted || !isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedError('Please verify your email first');
    }

    const accessToken = this.signAccessToken(user.id, user.role);
    const refreshToken = this.signRefreshToken(user.id);

    logger.info({ userId: user.id, role: user.role }, 'User logged in');

    return {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    let payload: any;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as any;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Not a refresh token');
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId, isDeleted: false },
      select: { id: true, role: true },
    });
    if (!user) throw new UnauthorizedError('User not found');

    const newAccessToken = this.signAccessToken(user.id, user.role);
    const newRefreshToken = this.signRefreshToken(user.id); // Rotate

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async verifyEmail({ token }: { token: string }) {
    const record = await db.verificationToken.findUnique({
      where: { token },
      select: { id: true, type: true, userId: true, expiresAt: true },
    });

    if (!record || record.type !== TokenType.EMAIL_VERIFICATION || record.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await db.user.update({ where: { id: record.userId }, data: { isEmailVerified: true } });
    await db.verificationToken.delete({ where: { id: record.id } });

    logger.info({ userId: record.userId }, 'Email verified');
    return { message: 'Email verified successfully' };
  }

  async forgotPassword({ email }: { email: string }) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    // Always return same message to prevent user enumeration
    if (!user) return { message: 'If that email exists, reset instructions have been sent.' };

    // Delete any existing reset tokens first
    await db.verificationToken.deleteMany({
      where: { userId: user.id, type: TokenType.PASSWORD_RESET },
    });

    const resetToken = this.generateSecureToken();
    await db.verificationToken.create({
      data: {
        token: resetToken,
        type: TokenType.PASSWORD_RESET,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    sendEmail(email, 'Password Reset', `Click to reset: ${resetUrl}`).catch((err) =>
      logger.error(err, 'Failed to send reset email')
    );

    return { message: 'If that email exists, reset instructions have been sent.' };
  }

  async resetPassword({ token, newPassword }: { token: string; newPassword: string }) {
    const record = await db.verificationToken.findUnique({
      where: { token },
      select: { id: true, type: true, userId: true, expiresAt: true },
    });

    if (!record || record.type !== TokenType.PASSWORD_RESET || record.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await db.user.update({ where: { id: record.userId }, data: { passwordHash } });

    // Wipe all reset tokens for this user
    await db.verificationToken.deleteMany({
      where: { userId: record.userId, type: TokenType.PASSWORD_RESET },
    });

    logger.info({ userId: record.userId }, 'Password reset successful');
    return { message: 'Password reset successful' };
  }
}
