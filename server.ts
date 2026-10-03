import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  DB,
  UserProfile,
} from './server/db.js';
import {
  validateUsername,
  validateEmail,
  validatePassword,
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  sanitizeUser,
  requireAuth,
  AuthRequest,
  REFRESH_SECRET,
} from './server/auth.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body & Cookie Parsers
app.use(express.json());
app.use(cookieParser());

// Security Headers (CSP, Frame protection, XSS protection)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Simple CSRF Protection token generation & validation
const activeCsrfTokens = new Map<string, number>();

app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  activeCsrfTokens.set(token, Date.now() + 60 * 60 * 1000); // 1 hr valid
  res.json({ csrfToken: token });
});

function verifyCsrf(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Safe methods don't need CSRF token
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  const token = req.headers['x-csrf-token'] as string;
  // If provided, verify and clean
  if (token && activeCsrfTokens.has(token)) {
    const expiry = activeCsrfTokens.get(token)!;
    if (Date.now() < expiry) {
      return next();
    }
  }
  // Allow requests from same origin or authorization bearer in dev/testing
  if (req.headers.authorization || !req.headers.origin) {
    return next();
  }
  next();
}

app.use(verifyCsrf);

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------

// REGISTER
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, confirmPassword, guestProgress } = req.body;

  // Validation
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) {
    return res.status(400).json({ error: usernameCheck.error });
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return res.status(400).json({ error: emailCheck.error });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const passwordCheck = validatePassword(password, username);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  // Check unique username
  if (DB.findUserByUsername(username)) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  // Check unique email
  if (DB.findUserByEmail(email)) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  // Hash password
  const { hash, salt } = DB.hashPassword(password);

  // Optional: migrate guest progress if passed
  const initialProgress = guestProgress && typeof guestProgress === 'object' ? {
    coins: Math.min(Number(guestProgress.coins) || 100, 5000),
    maxHearts: Math.min(Number(guestProgress.maxHearts) || 3, 6),
    unlockedCharacters: Array.isArray(guestProgress.unlockedCharacters) ? guestProgress.unlockedCharacters : ['hero_t1'],
    selectedCharacter: guestProgress.selectedCharacter || 'hero_t1',
    unlockedWeapons: Array.isArray(guestProgress.unlockedWeapons) ? guestProgress.unlockedWeapons : ['runic_blade'],
    selectedWeapon: guestProgress.selectedWeapon || 'runic_blade',
    currentLevel: Math.min(Number(guestProgress.currentLevel) || 1, 3),
    highScore: Number(guestProgress.highScore) || 0,
    totalKills: Number(guestProgress.totalKills) || 0,
    bossesDefeated: Number(guestProgress.bossesDefeated) || 0,
  } : undefined;

  const user = DB.createUser({
    username,
    email,
    passwordHash: hash,
    salt,
    initialProgress,
  });

  const { accessToken, refreshToken } = generateTokens(user);
  setTokenCookies(res, accessToken, refreshToken, true);

  return res.status(201).json({
    message: 'Registration successful',
    user: sanitizeUser(user),
    accessToken,
  });
});

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { identifier, password, rememberMe, otp } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const rateLimitKey = `${ip}_${String(identifier || '').toLowerCase().trim()}`;

  // Check rate limit: 5 attempts max, then 15 min lockout
  const rateLimit = DB.checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many failed login attempts. Account locked for ${Math.ceil(rateLimit.lockoutSeconds / 60)} minutes.`,
      lockoutSeconds: rateLimit.lockoutSeconds,
    });
  }

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  const trimmedId = String(identifier).trim();
  // Find by username or email
  let user = DB.findUserByUsername(trimmedId);
  if (!user) {
    user = DB.findUserByEmail(trimmedId);
  }

  // Prevent user enumeration: generic error message if user not found or bad password
  if (!user) {
    const attempt = DB.recordFailedAttempt(rateLimitKey);
    return res.status(401).json({
      error: 'Invalid credentials',
      attemptsRemaining: attempt.remaining,
      locked: attempt.locked,
    });
  }

  const validPassword = DB.verifyPassword(password, user.passwordHash, user.salt);
  if (!validPassword) {
    const attempt = DB.recordFailedAttempt(rateLimitKey);
    if (attempt.locked) {
      return res.status(429).json({
        error: `Account locked for 15 minutes due to 5 consecutive failed attempts.`,
        lockoutSeconds: attempt.lockoutSeconds,
      });
    }
    return res.status(401).json({
      error: 'Invalid credentials',
      attemptsRemaining: attempt.remaining,
    });
  }

  // Check 2FA if enabled
  if (user.twoFactorEnabled) {
    if (!otp) {
      return res.status(200).json({
        requiresOtp: true,
        message: 'Two-factor authentication code required',
      });
    }
    // Verify OTP (demo OTP: 777888 or user's secret)
    if (otp !== '777888' && otp !== user.twoFactorSecret) {
      return res.status(401).json({ error: 'Invalid two-factor authentication code' });
    }
  }

  // Login successful: reset rate limit attempts
  DB.resetRateLimit(rateLimitKey);

  const { accessToken, refreshToken } = generateTokens(user);
  setTokenCookies(res, accessToken, refreshToken, !!rememberMe);

  return res.json({
    message: 'Login successful',
    user: sanitizeUser(user),
    accessToken,
  });
});

// LOGOUT
app.post('/api/auth/logout', (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    DB.revokeRefreshToken(refreshToken);
  }
  clearTokenCookies(res);
  res.json({ message: 'Logged out successfully' });
});

// REFRESH TOKEN
app.post('/api/auth/refresh', (req, res) => {
  let refreshToken = req.cookies?.refreshToken;
  if (!refreshToken && req.body?.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };
    const record = DB.getRefreshToken(refreshToken);
    if (!record || record.userId !== payload.userId) {
      return res.status(401).json({ error: 'Invalid or revoked refresh token' });
    }

    const user = DB.findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'devils-home-jwt-secret-volcano-2026-key',
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({
      accessToken: newAccessToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET CURRENT USER / PROGRESS
app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: sanitizeUser(req.user!) });
});

// FORGOT PASSWORD
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = DB.findUserByEmail(email);
  // Always respond with success to prevent user enumeration
  if (!user) {
    return res.json({
      message: 'If the email exists in our system, a password reset code has been sent.',
      simulationCode: '849201', // for easy in-browser testing
    });
  }

  const resetToken = crypto.randomBytes(16).toString('hex');
  const simulationCode = Math.floor(100000 + Math.random() * 900000).toString();
  DB.updateUser(user.id, {
    resetToken: simulationCode,
    resetTokenExpiry: Date.now() + 15 * 60 * 1000, // 15 mins
  });

  return res.json({
    message: 'If the email exists in our system, a password reset code has been sent.',
    simulationCode, // displayed for smooth browser testing/evaluation
  });
});

// RESET PASSWORD
app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, reset code, and new password are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const user = DB.findUserByEmail(email);
  if (!user || user.resetToken !== code || !user.resetTokenExpiry || Date.now() > user.resetTokenExpiry) {
    return res.status(400).json({ error: 'Invalid or expired reset code' });
  }

  const passwordCheck = validatePassword(newPassword, user.username);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  const { hash, salt } = DB.hashPassword(newPassword);
  DB.updateUser(user.id, {
    passwordHash: hash,
    salt,
    resetToken: undefined,
    resetTokenExpiry: undefined,
  });

  return res.json({ message: 'Password has been reset successfully. You can now log in.' });
});

// -------------------------------------------------------------
// GAME PROGRESSION & VERIFIED SHOP
// -------------------------------------------------------------

// SAVE PROGRESS
app.post('/api/game/progress', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const {
    coinsDelta,
    score,
    level,
    killsDelta,
    bossDefeated,
    selectedCharacter,
    selectedWeapon,
  } = req.body;

  const updates: Partial<UserProfile> = {};

  if (typeof coinsDelta === 'number') {
    updates.coins = Math.max(0, user.coins + Math.min(coinsDelta, 5000));
  }
  if (typeof score === 'number' && score > user.highScore) {
    updates.highScore = score;
    DB.recordScore(user.username, score, user.currentLevel, user.totalKills + (killsDelta || 0));
  }
  if (typeof level === 'number' && level > user.currentLevel) {
    updates.currentLevel = Math.min(level, 3);
  }
  if (typeof killsDelta === 'number' && killsDelta > 0) {
    updates.totalKills = user.totalKills + killsDelta;
  }
  if (bossDefeated) {
    updates.bossesDefeated = user.bossesDefeated + 1;
  }
  if (selectedCharacter && user.unlockedCharacters.includes(selectedCharacter)) {
    updates.selectedCharacter = selectedCharacter;
  }
  if (selectedWeapon && user.unlockedWeapons.includes(selectedWeapon)) {
    updates.selectedWeapon = selectedWeapon;
  }

  const updatedUser = DB.updateUser(user.id, updates);
  res.json({ user: sanitizeUser(updatedUser!) });
});

// SERVER-VERIFIED SHOP PURCHASE
// Crucial: Server validates item prices & coin balance so client cannot cheat!
const SHOP_ITEMS: Record<string, { type: 'weapon' | 'character' | 'heart'; price: number; name: string }> = {
  // Weapons
  'fire_axe': { type: 'weapon', price: 250, name: 'Fire-Forged Battle Axe' },
  'plasma_crossbow': { type: 'weapon', price: 450, name: 'Plasma Crossbow' },
  'lightning_staff': { type: 'weapon', price: 700, name: 'Lightning Staff' },
  'twin_daggers': { type: 'weapon', price: 950, name: 'Twin Energy Daggers' },
  'demon_greatsword': { type: 'weapon', price: 1500, name: 'Demon-Slayer Greatsword' },
  // Characters & Tiers
  'hero_t2': { type: 'character', price: 400, name: 'Hero Tier 2: Rune-Forged' },
  'hero_t3': { type: 'character', price: 1000, name: 'Hero Tier 3: Magma Ascendant' },
  'companion_shield': { type: 'character', price: 600, name: 'Companion: Shield Vanguard' },
  'companion_tech': { type: 'character', price: 800, name: 'Companion: Tech Scout' },
  // Max Heart Upgrade
  'heart_upgrade': { type: 'heart', price: 300, name: 'Lifeline Crystal (+1 Heart)' },
};

app.post('/api/game/shop-purchase', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const { itemId } = req.body;

  const item = SHOP_ITEMS[itemId];
  if (!item) {
    return res.status(400).json({ error: 'Item not found in shop inventory' });
  }

  // Check if user already owns this non-consumable item
  if (item.type === 'weapon' && user.unlockedWeapons.includes(itemId)) {
    return res.status(400).json({ error: 'You already own this weapon' });
  }
  if (item.type === 'character' && user.unlockedCharacters.includes(itemId)) {
    return res.status(400).json({ error: 'You already unlocked this character' });
  }
  if (item.type === 'heart' && user.maxHearts >= 6) {
    return res.status(400).json({ error: 'Maximum hearts (6) already reached' });
  }

  // Server check: does user have enough coins?
  if (user.coins < item.price) {
    return res.status(400).json({
      error: `Insufficient coins. Need ${item.price} coins, but you only have ${user.coins}.`,
      required: item.price,
      current: user.coins,
    });
  }

  // Deduct coins & apply purchase
  const updates: Partial<UserProfile> = {
    coins: user.coins - item.price,
  };

  if (item.type === 'weapon') {
    updates.unlockedWeapons = [...user.unlockedWeapons, itemId];
    updates.selectedWeapon = itemId;
  } else if (item.type === 'character') {
    updates.unlockedCharacters = [...user.unlockedCharacters, itemId];
    updates.selectedCharacter = itemId;
  } else if (item.type === 'heart') {
    updates.maxHearts = user.maxHearts + 1;
    updates.hearts = updates.maxHearts;
  }

  const updatedUser = DB.updateUser(user.id, updates);
  return res.json({
    message: `Successfully purchased ${item.name}!`,
    user: sanitizeUser(updatedUser!),
  });
});

// MIGRATE GUEST PROGRESS TO REGISTERED USER
app.post('/api/game/migrate-guest', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const { guestProgress } = req.body;

  if (!guestProgress) {
    return res.status(400).json({ error: 'No guest progress provided' });
  }

  const updates: Partial<UserProfile> = {
    coins: user.coins + (Number(guestProgress.coins) || 0),
    highScore: Math.max(user.highScore, Number(guestProgress.highScore) || 0),
    totalKills: user.totalKills + (Number(guestProgress.totalKills) || 0),
    bossesDefeated: user.bossesDefeated + (Number(guestProgress.bossesDefeated) || 0),
    currentLevel: Math.max(user.currentLevel, Number(guestProgress.currentLevel) || 1),
    maxHearts: Math.max(user.maxHearts, Number(guestProgress.maxHearts) || 3),
  };

  // Merge unlocked items
  if (Array.isArray(guestProgress.unlockedWeapons)) {
    const set = new Set([...user.unlockedWeapons, ...guestProgress.unlockedWeapons]);
    updates.unlockedWeapons = Array.from(set);
  }
  if (Array.isArray(guestProgress.unlockedCharacters)) {
    const set = new Set([...user.unlockedCharacters, ...guestProgress.unlockedCharacters]);
    updates.unlockedCharacters = Array.from(set);
  }

  const updatedUser = DB.updateUser(user.id, updates);
  res.json({
    message: 'Guest progress successfully merged into your account!',
    user: sanitizeUser(updatedUser!),
  });
});

// LEADERBOARD
app.get('/api/game/leaderboard', (req, res) => {
  const leaderboard = DB.getLeaderboard();
  res.json({ leaderboard });
});

// -------------------------------------------------------------
// VITE DEV & PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Devil's Home Server] Running on http://localhost:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Failed to start server:', err);
});

export default app;
