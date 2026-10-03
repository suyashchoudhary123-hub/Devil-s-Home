# Devil's Home — 3D Survival Horror Tactical-Fantasy Game

**Devil's Home** is a high-fidelity 3D browser survival action game inspired by Unreal Engine 5 visual fidelity and modern tactical hero-shooters, featuring procedural lighting, dark volcanic neon aesthetics, demonic boss encounters, and an enterprise-grade user authentication and server-authoritative progression system.

---

## 🎮 Game Overview

### 1. Protagonist & Character Lab
- **Arjun (15-Year-Old Indian Orphan Boy)**:
  - **Tier 1 (Base Hero)**: Cropped dark jacket with neon orange trim lines, fitted armored bracers, utility belt with treasure satchel, sturdy boots, messy black hair, cheek scar, and a glowing cyan soul amulet on his chest.
  - **Tier 2 (Rune-Forged Striker)**: Reinforced obsidian shoulder pauldrons, glowing blue rune lines across arms/legs, and an energized electric gauntlet.
  - **Tier 3 (Magma Ascendant)**: Full fire-resistant battle armor, orange-magenta energy veins, flowing energy cape, rotating holographic arm ring, and a radiant battle aura.
- **Companion 1: Vikram (Iron Bulwark)**: Stocky boy equipped with a heavy reinforced tower shield, war hammer, and high-visibility armor vest.
- **Companion 2: Kabir (Aether Scout)**: Agile tech scout with glasses, tactical scarf, wrist-mounted plasma crossbow, and a tech gadget backpack with cyan antenna glow.

### 2. Weapons Armory (6 Stylized Armaments)
1. **Runic Iron Blade**: Swift 3-hit melee combo with glowing cyan slash arc trails.
2. **Fire-Forged Battle Axe**: Heavy cleave leaving burning magma embers in its wake.
3. **Plasma Crossbow**: Piercing cyan plasma energy bolts for long-range takedowns.
4. **Lightning Staff**: Mystical rod chaining electric storm arcs between up to 3 demons.
5. **Twin Energy Daggers**: High-velocity dual strikes with flurry mobility boosts.
6. **Demon-Slayer Greatsword**: Colossal broadsword with hot magenta flame edges and ground rupture waves.

### 3. Terrifying Demonic Foes & Boss Encounters
- **Giant Demonic Bat**: 4-meter wingspan, charred body, glowing orange veins, swoop-dive claw attacks.
- **Obsidian Wyvern**: Horned flying dinosaur with molten cracks, furnace throat glow, and lava fireball breath.
- **Colossal 6-Meter Magma Demon Boss**: Volcanic rock behemoth with curved horns, spiked war hammer, and seismic ground slams that shake the screen and crack the floor.
- **The Shadow Entity**: Ethereal smoke humanoid with glowing white eyes and purple-cyan hovering wisps, firing homing shadow spheres.

### 4. Audio & Procedural Sound Design
- Powered natively via the **Web Audio API** (100% reliable, zero external MP3 dependencies, no broken links):
  - Ambient subterranean volcanic drones and whispering winds.
  - Sub-bass heartbeat tension audio (lub-dub) that accelerates when player has only 1 heart remaining.
  - Weapon slash whooshes, monster hit crunches, boss hammer thunder, coin pickup sparkles, and heart-loss shattering sound effects.

---

## 🔒 User Authentication & Security Architecture

### REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account with guest progress migration | No |
| `POST` | `/api/auth/login` | Login with username/email & password (supports 2FA & lockout) | No |
| `POST` | `/api/auth/logout` | Revokes refresh token and clears secure cookies | Yes |
| `POST` | `/api/auth/refresh` | Refreshes 15-minute access token via 7-day refresh token | No |
| `GET` | `/api/auth/me` | Fetches current user profile and progression stats | Yes |
| `POST` | `/api/auth/forgot-password` | Initiates password reset with 6-digit simulation code | No |
| `POST` | `/api/auth/reset-password` | Resets password after code verification | No |
| `GET` | `/api/csrf-token` | Issues a cryptographic CSRF protection token | No |
| `POST` | `/api/game/progress` | Saves level, score, coins, and demon kills | Yes |
| `POST` | `/api/game/shop-purchase` | **Server-verified** shop purchase preventing coin exploits | Yes |
| `POST` | `/api/game/migrate-guest` | Seamlessly migrates local guest progress into account | Yes |
| `GET` | `/api/game/leaderboard` | Returns top 20 global survivor rankings | No |

### Validation & Security Controls
- **Username**: 3 to 20 characters, `^[a-zA-Z0-9_]{3,20}$`, case-insensitive unique constraint.
- **Email**: Strict RFC format validation, normalized to lowercase, unique constraint.
- **Password**: Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, common password blacklist check, cannot contain username.
- **Live Password Strength Meter**: Real-time entropy evaluation (Weak, Fair, Good, Strong) with checklist.
- **Hashing**: PBKDF2 with 100,000 iterations, SHA-512, and 128-bit cryptographic salt.
- **JWT Lifetimes**: 15-minute access token (`accessToken`) + 7-day refresh token (`refreshToken`) in `httpOnly` secure cookies (and Authorization Bearer support).
- **Rate Limiting**: 5 failed login attempts per IP/identifier triggers a **15-minute lockout** with HTTP 429 response.
- **Anti-Enumeration**: Generic "Invalid credentials" error message on login attempts.
- **CSRF & Security Headers**: Strict CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.
- **Server-Authoritative Economy**: Client cannot fake coin balances or purchase prices; server checks coin balance before deducting and adding items.
- **Guest Mode**: Full local storage gameplay with prompt to register and migrate local progress seamlessly.

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
Runs tests verifying registration validation, password hashing, lockout logic, token refresh, and shop purchase authorization:
```bash
npm test
```

### 3. Launch Development Server
```bash
npm run dev
```
The game will start on `http://localhost:3000`.
