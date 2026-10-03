import { DB } from '../server/db.js';
import {
  validateUsername,
  validateEmail,
  validatePassword,
  generateTokens,
} from '../server/auth.js';

console.log('--- RUNNING DEVIL\'S HOME AUTH & PROGRESSION TEST SUITE ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. USERNAME VALIDATION TESTS
console.log('\n--- Test 1: Username Validation ---');
assert(validateUsername('Arjun_15').valid === true, 'Valid username Arjun_15 accepted');
assert(validateUsername('yo').valid === false, 'Rejects short username (< 3 chars)');
assert(validateUsername('this_username_is_way_too_long_for_system').valid === false, 'Rejects long username (> 20 chars)');
assert(validateUsername('Arjun!Hero').valid === false, 'Rejects non-alphanumeric chars in username');

// 2. EMAIL VALIDATION & NORMALIZATION TESTS
console.log('\n--- Test 2: Email Validation & Normalization ---');
assert(validateEmail('test@devils-home.com').valid === true, 'Valid email accepted');
assert(validateEmail('notanemail').valid === false, 'Rejects invalid email format');
assert(validateEmail('test@domain').valid === false, 'Rejects email without domain TLD');

// 3. PASSWORD STRENGTH VALIDATION TESTS
console.log('\n--- Test 3: Password Strength Validation ---');
assert(validatePassword('Weak1!').valid === false, 'Rejects short password (< 8 chars)');
assert(validatePassword('alllowercase1!').valid === false, 'Rejects password without uppercase');
assert(validatePassword('ALLUPPERCASE1!').valid === false, 'Rejects password without lowercase');
assert(validatePassword('NoNumbersHere!').valid === false, 'Rejects password without numbers');
assert(validatePassword('NoSpecialChar123').valid === false, 'Rejects password without special character');
assert(validatePassword('password123', 'arjun').valid === false, 'Rejects common blacklist passwords');
assert(validatePassword('ArjunHeroPass123!', 'Arjun').valid === false, 'Rejects password containing username');
assert(validatePassword('DarkSoul_99!Flame', 'arjun').valid === true, 'Accepts strong, secure password');

// 4. CRYPTOGRAPHIC HASHING & VERIFICATION TESTS
console.log('\n--- Test 4: PBKDF2 Password Hashing & Verification ---');
const testPass = 'SecureDemonSlayer#2026';
const { hash, salt } = DB.hashPassword(testPass);
assert(hash.length === 128, 'Generated 512-bit (128 hex chars) PBKDF2 hash');
assert(salt.length === 32, 'Generated 128-bit cryptographic salt');
assert(DB.verifyPassword(testPass, hash, salt) === true, 'Verified correct password with salt');
assert(DB.verifyPassword('WrongPassword#2026', hash, salt) === false, 'Rejected incorrect password');

// 5. USER REGISTRATION & TOKEN CREATION
console.log('\n--- Test 5: User Registration & JWT Generation ---');
const testUser = DB.createUser({
  username: 'TestWarrior_01',
  email: 'warrior01@abyss.test',
  passwordHash: hash,
  salt,
  initialProgress: {
    coins: 250,
    highScore: 1200,
  },
});
assert(testUser.username === 'TestWarrior_01', 'User created with normalized username');
assert(testUser.coins === 250, 'Initial guest coins persisted to account');

const tokens = generateTokens(testUser);
assert(typeof tokens.accessToken === 'string' && tokens.accessToken.length > 20, 'Generated valid JWT access token');
assert(typeof tokens.refreshToken === 'string' && tokens.refreshToken.length > 20, 'Generated valid JWT refresh token');

// 6. RATE LIMITING & 15-MINUTE LOCKOUT
console.log('\n--- Test 6: Rate Limiting & Lockout Verification ---');
const rateLimitKey = 'test_ip_warrior01';
DB.resetRateLimit(rateLimitKey);

let status = DB.checkRateLimit(rateLimitKey);
assert(status.allowed === true && status.remaining === 5, 'Rate limit starts with 5 allowed attempts');

// Record 4 failed attempts
for (let i = 1; i <= 4; i++) {
  const res = DB.recordFailedAttempt(rateLimitKey);
  assert(res.locked === false, `Attempt ${i} is recorded without locking`);
}

// 5th failed attempt must trigger lockout
const lockoutRes = DB.recordFailedAttempt(rateLimitKey);
assert(lockoutRes.locked === true, '5th consecutive failure triggers lockout');
assert(lockoutRes.lockoutSeconds === 900, 'Lockout duration is 15 minutes (900 seconds)');

const lockedCheck = DB.checkRateLimit(rateLimitKey);
assert(lockedCheck.allowed === false, 'Subsequent attempts are blocked while locked out');

// 7. REFRESH TOKEN RECORD & REVOCATION
console.log('\n--- Test 7: Refresh Token Revocation ---');
const storedRecord = DB.getRefreshToken(tokens.refreshToken);
assert(storedRecord !== null && storedRecord.userId === testUser.id, 'Stored refresh token matches user ID');

DB.revokeRefreshToken(tokens.refreshToken);
const revokedRecord = DB.getRefreshToken(tokens.refreshToken);
assert(revokedRecord === null, 'Revoked refresh token is no longer valid');

console.log(`\n=========================================`);
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed successfully!`);
console.log(`=========================================\n`);
