import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/game/GameCanvas';
import { GameHUD } from './components/hud/GameHUD';
import { TopBar } from './components/navigation/TopBar';
import { CharacterLab } from './components/modals/CharacterLab';
import { WeaponArmory } from './components/modals/WeaponArmory';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { AuthModal } from './components/auth/AuthModal';
import { HowToPlayModal } from './components/modals/HowToPlayModal';
import { User, CharacterId, WeaponId } from './types/game';
import { api, GuestProgress, defaultGuestProgress } from './services/api';
import { sound } from './services/audio';
import { Skull, RotateCcw, Flame, Sparkles, Trophy } from 'lucide-react';

export default function App() {
  // User Authentication & Session State
  const [user, setUser] = useState<User | null>(null);
  const [guestProgress, setGuestProgress] = useState<GuestProgress>(defaultGuestProgress);
  const [isInitializing, setIsInitializing] = useState(true);

  // Active Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>('login');
  const [isCharacterLabOpen, setIsCharacterLabOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Active Game State
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [hearts, setHearts] = useState<number>(3);
  const [maxHearts, setMaxHearts] = useState<number>(3);
  const [shatteringHeartIndex, setShatteringHeartIndex] = useState<number | null>(null);
  const [coins, setCoins] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [totalKills, setTotalKills] = useState<number>(0);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('hero_t1');
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(['hero_t1']);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>('runic_blade');
  const [unlockedWeapons, setUnlockedWeapons] = useState<string[]>(['runic_blade']);

  // HUD & Audio
  const [isMuted, setIsMuted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelCleared, setIsLevelCleared] = useState(false);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [bossInfo, setBossInfo] = useState<{ name: string; current: number; max: number } | null>(null);
  const [abilityCooldown, setAbilityCooldown] = useState(0);
  const [activeAbilityName, setActiveAbilityName] = useState('Amulet Surge');

  const [minimapData, setMinimapData] = useState<{
    playerX: number;
    playerZ: number;
    playerAngle: number;
    entities: { x: number; z: number; type: 'enemy' | 'boss' | 'chest' | 'portal' }[];
  } | null>(null);

  // Load session on startup
  useEffect(() => {
    async function initSession() {
      try {
        const res = await api.getMe();
        if (res.user) {
          setUser(res.user);
          applyUserProfile(res.user);
        }
      } catch (err) {
        // Guest mode fallback
        const guest = api.getGuestProgress();
        setGuestProgress(guest);
        setCoins(guest.coins);
        setMaxHearts(guest.maxHearts);
        setHearts(guest.maxHearts);
        setSelectedCharacter(guest.selectedCharacter as CharacterId);
        setUnlockedCharacters(guest.unlockedCharacters);
        setSelectedWeapon(guest.selectedWeapon as WeaponId);
        setUnlockedWeapons(guest.unlockedWeapons);
        setCurrentLevelId(guest.currentLevel);
        setScore(guest.highScore);
        setTotalKills(guest.totalKills);
      } finally {
        setIsInitializing(false);
      }
    }
    initSession();
  }, []);

  const applyUserProfile = (u: User) => {
    setCoins(u.coins);
    setMaxHearts(u.maxHearts);
    setHearts(u.maxHearts);
    setSelectedCharacter(u.selectedCharacter);
    setUnlockedCharacters(u.unlockedCharacters);
    setSelectedWeapon(u.selectedWeapon);
    setUnlockedWeapons(u.unlockedWeapons);
    setCurrentLevelId(u.currentLevel);
    setScore(u.highScore);
    setTotalKills(u.totalKills);
  };

  // Sync progress updates to user account or guest local storage
  const syncProgress = useCallback(
    async (updates: {
      coinsDelta?: number;
      score?: number;
      level?: number;
      killsDelta?: number;
      bossDefeated?: boolean;
    }) => {
      if (user) {
        try {
          const res = await api.saveProgress(updates);
          if (res.user) {
            setUser(res.user);
          }
        } catch (e) {
          console.error('Failed to sync progress to cloud', e);
        }
      } else {
        // Save to guest
        const updatedGuest = api.saveGuestProgress({
          coins: updates.coinsDelta ? coins + updates.coinsDelta : coins,
          highScore: updates.score && updates.score > score ? updates.score : score,
          currentLevel: updates.level || currentLevelId,
          totalKills: updates.killsDelta ? totalKills + updates.killsDelta : totalKills,
        });
        setGuestProgress(updatedGuest);
      }
    },
    [user, coins, score, currentLevelId, totalKills]
  );

  // Heart Loss Handling with animation
  const handleHeartLoss = (remaining: number) => {
    const lostIndex = remaining;
    setShatteringHeartIndex(lostIndex);
    setHearts(remaining);

    setTimeout(() => {
      setShatteringHeartIndex(null);
    }, 600);
  };

  const handleHeartGain = () => {
    setHearts((prev) => Math.min(maxHearts, prev + 1));
  };

  const handleCoinCollect = (amount: number) => {
    setCoins((prev) => prev + amount);
    syncProgress({ coinsDelta: amount });
  };

  const handleScoreAdd = (amount: number) => {
    setScore((prev) => {
      const next = prev + amount;
      syncProgress({ score: next });
      return next;
    });
  };

  const handleEnemyKilled = (species: string) => {
    setTotalKills((prev) => prev + 1);
    syncProgress({ killsDelta: 1 });
  };

  const handleBossDefeated = () => {
    syncProgress({ bossDefeated: true });
    setIsLevelCleared(true);
    setTimeout(() => {
      setIsLevelCleared(false);
    }, 4000);
  };

  const handleLevelComplete = (nextLevel: number) => {
    setCurrentLevelId(nextLevel);
    setHearts(maxHearts);
    setIsLevelCleared(true);
    syncProgress({ level: nextLevel });
    setTimeout(() => {
      setIsLevelCleared(false);
    }, 3000);
  };

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const handleRespawn = () => {
    setIsGameOver(false);
    setHearts(maxHearts);
    // Reload scene by toggling level or respawn
    const cur = currentLevelId;
    setCurrentLevelId(0);
    setTimeout(() => setCurrentLevelId(cur), 50);
  };

  const handleAbilityTriggered = (name: string, cd: number) => {
    setActiveAbilityName(name);
    setAbilityCooldown(cd);
    const interval = setInterval(() => {
      setAbilityCooldown((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  // Character Lab & Shop actions
  const handleSelectCharacter = async (id: CharacterId) => {
    setSelectedCharacter(id);
    if (user) {
      await api.saveProgress({ selectedCharacter: id });
    } else {
      api.saveGuestProgress({ selectedCharacter: id });
    }
  };

  const handleUnlockCharacter = async (id: CharacterId) => {
    if (user) {
      const res = await api.shopPurchase(id);
      setUser(res.user);
      applyUserProfile(res.user);
    } else {
      // Guest mode purchase
      const charConfig = { price: id === 'hero_t2' ? 400 : id === 'hero_t3' ? 1000 : 600 };
      if (coins < charConfig.price) throw new Error('Not enough coins');
      const nextCoins = coins - charConfig.price;
      const nextUnlocked = [...unlockedCharacters, id];
      setCoins(nextCoins);
      setUnlockedCharacters(nextUnlocked);
      setSelectedCharacter(id);
      api.saveGuestProgress({
        coins: nextCoins,
        unlockedCharacters: nextUnlocked,
        selectedCharacter: id,
      });
    }
  };

  const handleSelectWeapon = async (id: WeaponId) => {
    setSelectedWeapon(id);
    if (user) {
      await api.saveProgress({ selectedWeapon: id });
    } else {
      api.saveGuestProgress({ selectedWeapon: id });
    }
  };

  const handleUnlockWeapon = async (id: WeaponId) => {
    if (user) {
      const res = await api.shopPurchase(id);
      setUser(res.user);
      applyUserProfile(res.user);
    } else {
      // Guest mode purchase
      const prices: Record<string, number> = {
        fire_axe: 250,
        plasma_crossbow: 450,
        lightning_staff: 700,
        twin_daggers: 950,
        demon_greatsword: 1500,
      };
      const price = prices[id] || 300;
      if (coins < price) throw new Error('Not enough coins');
      const nextCoins = coins - price;
      const nextUnlocked = [...unlockedWeapons, id];
      setCoins(nextCoins);
      setUnlockedWeapons(nextUnlocked);
      setSelectedWeapon(id);
      api.saveGuestProgress({
        coins: nextCoins,
        unlockedWeapons: nextUnlocked,
        selectedWeapon: id,
      });
    }
  };

  const handleUpgradeHeart = async () => {
    if (user) {
      const res = await api.shopPurchase('heart_upgrade');
      setUser(res.user);
      applyUserProfile(res.user);
    } else {
      if (maxHearts >= 6) throw new Error('Maximum hearts reached');
      if (coins < 300) throw new Error('Need 300 coins for Lifeline Crystal');
      const nextCoins = coins - 300;
      const nextMax = maxHearts + 1;
      setCoins(nextCoins);
      setMaxHearts(nextMax);
      setHearts(nextMax);
      api.saveGuestProgress({
        coins: nextCoins,
        maxHearts: nextMax,
      });
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    applyUserProfile(authenticatedUser);
    setIsAuthModalOpen(false);
    api.clearGuestProgress();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    const guest = api.getGuestProgress();
    setGuestProgress(guest);
    applyUserProfile({
      ...guest,
      id: 'guest',
      username: 'Guest',
      email: '',
      createdAt: '',
      selectedCharacter: guest.selectedCharacter as CharacterId,
      selectedWeapon: guest.selectedWeapon as WeaponId,
    });
  };

  if (isInitializing) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#07040a] text-slate-100 font-chakra">
        <Flame className="w-10 h-10 text-orange-500 animate-bounce mb-3" />
        <h1 className="text-xl font-bold tracking-widest text-orange-400">DEVIL'S HOME</h1>
        <p className="text-xs text-zinc-500 mt-1">Igniting 3D Volcanic Engine...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#07040a] overflow-hidden select-none">
      {/* Top Bar with Three-Zone Contract */}
      <TopBar
        user={user}
        onOpenAuth={(v) => {
          setAuthInitialView(v);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenCharacterLab={() => setIsCharacterLabOpen(true)}
        onOpenArmory={() => setIsArmoryOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
      />

      {/* Guest Mode Notification Banner (if not logged in) */}
      {!user && (
        <div className="h-8 bg-gradient-to-r from-orange-950/80 via-zinc-900 to-black border-b border-orange-900/40 px-4 flex items-center justify-between text-[11px] text-zinc-300 z-20 shrink-0 font-chakra">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Playing in <strong>Guest Mode</strong> · Local progress saved
            </span>
          </div>
          <button
            onClick={() => {
              setAuthInitialView('register');
              setIsAuthModalOpen(true);
            }}
            className="text-orange-400 hover:text-orange-300 font-bold hover:underline"
          >
            Create Account & Migrate Progress →
          </button>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* 3D Game Canvas */}
        {currentLevelId > 0 && (
          <GameCanvas
            levelId={currentLevelId}
            characterId={selectedCharacter}
            weaponId={selectedWeapon}
            hearts={hearts}
            maxHearts={maxHearts}
            coins={coins}
            score={score}
            onHeartLoss={handleHeartLoss}
            onHeartGain={handleHeartGain}
            onCoinCollect={handleCoinCollect}
            onScoreAdd={handleScoreAdd}
            onEnemyKilled={handleEnemyKilled}
            onBossDefeated={handleBossDefeated}
            onLevelComplete={handleLevelComplete}
            onGameOver={handleGameOver}
            onAbilityTriggered={handleAbilityTriggered}
            isPaused={
              isGameOver ||
              isCharacterLabOpen ||
              isArmoryOpen ||
              isLeaderboardOpen ||
              isAuthModalOpen ||
              isHowToPlayOpen
            }
            onInteractPrompt={setInteractPrompt}
            onMinimapUpdate={setMinimapData}
            onBossHealthUpdate={(curr, max, name) => setBossInfo({ current: curr, max, name })}
          />
        )}

        {/* Tactical Shooter HUD Overlay */}
        <GameHUD
          hearts={hearts}
          maxHearts={maxHearts}
          shatteringHeartIndex={shatteringHeartIndex}
          coins={coins}
          score={score}
          levelId={currentLevelId}
          characterId={selectedCharacter}
          weaponId={selectedWeapon}
          bossInfo={bossInfo}
          abilityCooldown={abilityCooldown}
          activeAbilityName={activeAbilityName}
          interactPrompt={interactPrompt}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onOpenCharacterLab={() => setIsCharacterLabOpen(true)}
          onOpenArmory={() => setIsArmoryOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          minimapData={minimapData}
        />

        {/* Level Cleared Banner Notification */}
        {isLevelCleared && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-3.5 bg-black/90 border border-amber-500/70 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center gap-3 text-amber-300 font-chakra">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-base font-bold uppercase tracking-wider text-white">
                  Zone Cleared!
                </div>
                <div className="text-xs text-amber-400">
                  Void Portal Unsealed · Health Restored
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 font-chakra">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 mb-4 shadow-[0_0_25px_rgba(244,63,94,0.4)]">
              <Skull className="w-8 h-8" />
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-rose-500 tracking-wider mb-2">
              YOU PERISHED IN THE ABYSS
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
              The darkness of Devil's Home claimed your soul, but Arjun's amulet still burns with
              unquenchable courage.
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-sm w-full mb-8 text-left">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Final Score</div>
                <div className="text-base font-bold text-white tabular-nums">
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Demons Slain</div>
                <div className="text-base font-bold text-rose-400 tabular-nums">{totalKills}</div>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Coins Kept</div>
                <div className="text-base font-bold text-amber-400 tabular-nums">{coins}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRespawn}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Rise Again
              </button>
              <button
                onClick={() => setIsArmoryOpen(true)}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold rounded-xl text-sm transition-colors"
              >
                Upgrade Gear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {isCharacterLabOpen && (
        <CharacterLab
          unlockedCharacters={unlockedCharacters}
          selectedCharacter={selectedCharacter}
          coins={coins}
          onSelectCharacter={handleSelectCharacter}
          onUnlockCharacter={handleUnlockCharacter}
          onClose={() => setIsCharacterLabOpen(false)}
        />
      )}

      {isArmoryOpen && (
        <WeaponArmory
          unlockedWeapons={unlockedWeapons}
          selectedWeapon={selectedWeapon}
          coins={coins}
          maxHearts={maxHearts}
          onSelectWeapon={handleSelectWeapon}
          onUnlockWeapon={handleUnlockWeapon}
          onUpgradeHeart={handleUpgradeHeart}
          onClose={() => setIsArmoryOpen(false)}
        />
      )}

      {isLeaderboardOpen && (
        <LeaderboardModal
          currentUsername={user?.username}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {isHowToPlayOpen && <HowToPlayModal onClose={() => setIsHowToPlayOpen(false)} />}

      {isAuthModalOpen && (
        <AuthModal
          initialView={authInitialView}
          guestProgress={guestProgress}
          onSuccess={handleAuthSuccess}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
