import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
  // Game progression
  coins: number;
  hearts: number; // default 3, max 6
  maxHearts: number;
  unlockedCharacters: string[]; // ['hero_t1', 'hero_t2', 'hero_t3', 'companion_shield', 'companion_tech']
  selectedCharacter: string;
  unlockedWeapons: string[]; // ['runic_blade', 'fire_axe', 'plasma_crossbow', 'lightning_staff', 'twin_daggers', 'demon_greatsword']
  selectedWeapon: string;
  currentLevel: number;
  highScore: number;
  totalKills: number;
  bossesDefeated: number;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  level: number;
  kills: number;
  date: string;
}

interface DBData {
  users: Record<string, UserProfile>; // keyed by userId
  usernameToId: Record<string, string>;
  emailToId: Record<string, string>;
  leaderboard: LeaderboardEntry[];
  refreshTokens: Record<string, { userId: string; expiresAt: number }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'game_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbData: DBData = {
  users: {},
  usernameToId: {},
  emailToId: {},
  leaderboard: [],
  refreshTokens: {},
};

// Seed default leaderboard if empty
const defaultLeaderboard: LeaderboardEntry[] = [
  { username: 'Arjun_DemonSlayer', score: 14850, level: 3, kills: 48, date: '2026-10-01' },
  { username: 'ShadowHunter99', score: 11200, level: 3, kills: 36, date: '2026-10-02' },
  { username: 'VolcanoSurvivor', score: 8750, level: 2, kills: 27, date: '2026-10-02' },
  { username: 'RuneKnight_Dev', score: 6400, level: 2, kills: 19, date: '2026-10-03' },
  { username: 'AshfallHero', score: 4200, level: 1, kills: 14, date: '2026-10-03' }
];

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbData = JSON.parse(raw);
    } else {
      dbData.leaderboard = [...defaultLeaderboard];
      saveDB();
    }
  } catch (err) {
    console.error('Failed to load DB file, initializing clean state', err);
    dbData = {
      users: {},
      usernameToId: {},
      emailToId: {},
      leaderboard: [...defaultLeaderboard],
      refreshTokens: {},
    };
    saveDB();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file', err);
  }
}

loadDB();

// Rate limiting in-memory store
interface RateLimitRecord {
  attempts: number;
  lockoutUntil: number;
}
const rateLimits: Map<string, RateLimitRecord> = new Map();

export const DB = {
  // Password hashing via PBKDF2 with cryptographic salt
  hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt };
  },

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  },

  // Rate limiter: 5 attempts max, 15-minute (900,000 ms) lockout
  checkRateLimit(key: string): { allowed: boolean; remaining: number; lockoutSeconds: number } {
    const now = Date.now();
    const record = rateLimits.get(key);

    if (!record) {
      return { allowed: true, remaining: 5, lockoutSeconds: 0 };
    }

    if (record.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return { allowed: false, remaining: 0, lockoutSeconds: remainingSeconds };
    }

    // Lockout expired, reset
    if (record.lockoutUntil > 0 && record.lockoutUntil <= now) {
      rateLimits.delete(key);
      return { allowed: true, remaining: 5, lockoutSeconds: 0 };
    }

    const remaining = Math.max(0, 5 - record.attempts);
    return { allowed: remaining > 0, remaining, lockoutSeconds: 0 };
  },

  recordFailedAttempt(key: string): { locked: boolean; lockoutSeconds: number; remaining: number } {
    const now = Date.now();
    let record = rateLimits.get(key);

    if (!record || (record.lockoutUntil > 0 && record.lockoutUntil <= now)) {
      record = { attempts: 0, lockoutUntil: 0 };
    }

    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockoutUntil = now + 15 * 60 * 1000; // 15 mins
      rateLimits.set(key, record);
      return { locked: true, lockoutSeconds: 15 * 60, remaining: 0 };
    }

    rateLimits.set(key, record);
    return { locked: false, lockoutSeconds: 0, remaining: 5 - record.attempts };
  },

  resetRateLimit(key: string) {
    rateLimits.delete(key);
  },

  // User management
  findUserByUsername(username: string): UserProfile | undefined {
    const id = dbData.usernameToId[username.toLowerCase()];
    if (!id) return undefined;
    return dbData.users[id];
  },

  findUserByEmail(email: string): UserProfile | undefined {
    const id = dbData.emailToId[email.toLowerCase()];
    if (!id) return undefined;
    return dbData.users[id];
  },

  findUserById(id: string): UserProfile | undefined {
    return dbData.users[id];
  },

  createUser(params: {
    username: string;
    email: string;
    passwordHash: string;
    salt: string;
    initialProgress?: Partial<UserProfile>;
  }): UserProfile {
    const id = crypto.randomUUID();
    const normalizedUsername = params.username;
    const normalizedEmail = params.email.toLowerCase();

    const newUser: UserProfile = {
      id,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: params.passwordHash,
      salt: params.salt,
      createdAt: new Date().toISOString(),
      coins: params.initialProgress?.coins ?? 100,
      hearts: 3,
      maxHearts: params.initialProgress?.maxHearts ?? 3,
      unlockedCharacters: params.initialProgress?.unlockedCharacters ?? ['hero_t1'],
      selectedCharacter: params.initialProgress?.selectedCharacter ?? 'hero_t1',
      unlockedWeapons: params.initialProgress?.unlockedWeapons ?? ['runic_blade'],
      selectedWeapon: params.initialProgress?.selectedWeapon ?? 'runic_blade',
      currentLevel: params.initialProgress?.currentLevel ?? 1,
      highScore: params.initialProgress?.highScore ?? 0,
      totalKills: params.initialProgress?.totalKills ?? 0,
      bossesDefeated: params.initialProgress?.bossesDefeated ?? 0,
    };

    dbData.users[id] = newUser;
    dbData.usernameToId[normalizedUsername.toLowerCase()] = id;
    dbData.emailToId[normalizedEmail] = id;
    saveDB();
    return newUser;
  },

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const user = dbData.users[id];
    if (!user) return undefined;

    dbData.users[id] = { ...user, ...updates };
    saveDB();
    return dbData.users[id];
  },

  // Refresh tokens
  saveRefreshToken(token: string, userId: string, expiresAt: number) {
    dbData.refreshTokens[token] = { userId, expiresAt };
    saveDB();
  },

  getRefreshToken(token: string) {
    const record = dbData.refreshTokens[token];
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      delete dbData.refreshTokens[token];
      saveDB();
      return null;
    }
    return record;
  },

  revokeRefreshToken(token: string) {
    delete dbData.refreshTokens[token];
    saveDB();
  },

  // Leaderboard
  recordScore(username: string, score: number, level: number, kills: number) {
    dbData.leaderboard.push({
      username,
      score,
      level,
      kills,
      date: new Date().toISOString().split('T')[0],
    });
    // Sort descending by score and keep top 20
    dbData.leaderboard.sort((a, b) => b.score - a.score);
    if (dbData.leaderboard.length > 20) {
      dbData.leaderboard = dbData.leaderboard.slice(0, 20);
    }
    saveDB();
  },

  getLeaderboard(): LeaderboardEntry[] {
    return dbData.leaderboard;
  }
};
