import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DB, UserProfile } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'devils-home-jwt-secret-volcano-2026-key';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'devils-home-refresh-secret-obsidian-2026-key';

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', 'qwertyuiop',
  'admin123', 'welcome123', 'football', 'master123', 'dragon123',
  'iloveyou', 'sunshine', 'princess', 'solo1234', 'superman',
  'pass1234', 'devilshome', 'devil123'
]);

export interface AuthRequest extends Request {
  user?: UserProfile;
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username may only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
}

export function validatePassword(password: string, username?: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 number' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 special character (!@#$%^&*...)' };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, error: 'This password is too common and easily guessed' };
  }
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    return { valid: false, error: 'Password must not contain your username' };
  }
  return { valid: true };
}

export function generateTokens(user: UserProfile) {
  // 15-minute access token
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // 7-day refresh token
  const refreshToken = jwt.sign(
    { userId: user.id, username: user.username },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Store refresh token expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  DB.saveRefreshToken(refreshToken, user.id, expiresAt);

  return { accessToken, refreshToken };
}

export function setTokenCookies(res: Response, accessToken: string, refreshToken: string, rememberMe = true) {
  const isProd = process.env.NODE_ENV === 'production';

  // Access token cookie (15 min)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  // Refresh token cookie (7 days if rememberMe, else session)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined,
  });
}

export function clearTokenCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

export function sanitizeUser(user: UserProfile) {
  const { passwordHash, salt, twoFactorSecret, resetToken, resetTokenExpiry, ...safeUser } = user;
  return safeUser;
}

// Authentication middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Extract token from cookie or Authorization header
  let token = req.cookies?.accessToken;
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = DB.findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}
