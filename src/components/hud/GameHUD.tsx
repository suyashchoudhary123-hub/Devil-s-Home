import React from 'react';
import {
  Heart,
  Coins,
  Shield,
  Zap,
  Crosshair,
  Volume2,
  VolumeX,
  Trophy,
  Users,
  Swords,
  Compass,
} from 'lucide-react';
import { CharacterId, WeaponId } from '../../types/game';
import { CHARACTERS, WEAPONS, LEVELS } from '../../game/constants';

interface GameHUDProps {
  hearts: number;
  maxHearts: number;
  shatteringHeartIndex: number | null;
  coins: number;
  score: number;
  levelId: number;
  characterId: CharacterId;
  weaponId: WeaponId;
  bossInfo: { name: string; current: number; max: number } | null;
  abilityCooldown: number; // in seconds
  activeAbilityName: string;
  interactPrompt: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenCharacterLab: () => void;
  onOpenArmory: () => void;
  onOpenLeaderboard: () => void;
  minimapData: {
    playerX: number;
    playerZ: number;
    playerAngle: number;
    entities: { x: number; z: number; type: 'enemy' | 'boss' | 'chest' | 'portal' }[];
  } | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hearts,
  maxHearts,
  shatteringHeartIndex,
  coins,
  score,
  levelId,
  characterId,
  weaponId,
  bossInfo,
  abilityCooldown,
  activeAbilityName,
  interactPrompt,
  isMuted,
  onToggleMute,
  onOpenCharacterLab,
  onOpenArmory,
  onOpenLeaderboard,
  minimapData,
}) => {
  const currentLevel = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const currentWeapon = WEAPONS.find((w) => w.id === weaponId) || WEAPONS[0];
  const currentCharacter = CHARACTERS.find((c) => c.id === characterId) || CHARACTERS[0];

  const isLowHealth = hearts === 1;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 select-none font-chakra">
      {/* Horror Blood Vignette when Low Health */}
      {isLowHealth && (
        <div className="absolute inset-0 pointer-events-none animate-horror-vignette bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(185,28,28,0.55)_90%,rgba(69,10,10,0.85)_100%)] z-0" />
      )}

      {/* TOP BAR: Brand, Level Info, Boss Bar, Audio & Quick Action Tabs */}
      <div className="flex items-start justify-between gap-4 z-10">
        {/* Left: Player Lifeline & Stats */}
        <div className="flex flex-col gap-2">
          {/* Lifeline Hearts */}
          <div className="flex items-center gap-1.5 p-2 px-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
            {Array.from({ length: maxHearts }).map((_, index) => {
              const isFilled = index < hearts;
              const isShattering = index === shatteringHeartIndex;

              return (
                <div
                  key={index}
                  className={`relative transition-all duration-300 ${
                    isShattering ? 'animate-shatter' : ''
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isFilled
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                        : 'text-zinc-700/60 fill-zinc-900/60'
                    }`}
                  />
                  {isFilled && (
                    <span className="absolute inset-0 rounded-full bg-rose-500/20 blur-sm -z-10" />
                  )}
                </div>
              );
            })}
            <div className="ml-2 pl-2 border-l border-white/10 flex items-center gap-1.5 text-xs text-zinc-300">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentCharacter.defense}% DEF</span>
            </div>
          </div>

          {/* Currency & Score */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-amber-500/30 shadow-md">
              <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-amber-300 font-bold tabular-nums text-sm">
                {coins.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-cyan-500/30 shadow-md">
              <span className="text-xs text-cyan-400 tracking-wider">SCORE</span>
              <span className="text-white font-bold tabular-nums text-sm">
                {score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Boss Health Bar if Active */}
        {bossInfo && bossInfo.current > 0 && (
          <div className="flex-1 max-w-lg mx-auto flex flex-col items-center">
            <div className="flex items-center justify-between w-full text-xs font-bold text-rose-300 mb-1 px-1 tracking-wider uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                {bossInfo.name}
              </span>
              <span className="tabular-nums">
                {Math.ceil((bossInfo.current / bossInfo.max) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-black/80 rounded-full border border-rose-600/40 p-0.5 overflow-hidden shadow-[0_0_15px_rgba(225,29,72,0.4)]">
              <div
                className="h-full bg-gradient-to-r from-orange-600 via-rose-500 to-pink-500 rounded-full transition-all duration-200"
                style={{ width: `${Math.max(0, Math.min(100, (bossInfo.current / bossInfo.max) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Right: Level Zone & Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Level Info Pill */}
          <div className="hidden sm:flex flex-col items-end px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-right">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400">
              Zone {currentLevel.id}
            </div>
            <div className="text-xs font-bold text-slate-100">{currentLevel.name}</div>
          </div>

          {/* Action Modals Nav */}
          <button
            onClick={onOpenCharacterLab}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-cyan-400 border border-cyan-500/40 rounded-lg text-xs font-semibold shadow-md transition-colors"
            title="Character Lab"
          >
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Heroes</span>
          </button>

          <button
            onClick={onOpenArmory}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-orange-400 border border-orange-500/40 rounded-lg text-xs font-semibold shadow-md transition-colors"
            title="Weapon Armory & Upgrades"
          >
            <Swords className="w-4 h-4" />
            <span className="hidden md:inline">Armory</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-semibold shadow-md transition-colors"
            title="Global Leaderboard"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden md:inline">Ranks</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white border border-white/10 rounded-lg transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CENTER: Contextual Interaction Prompt (Chests, Tree Portal) */}
      {interactPrompt && (
        <div className="self-center z-10 animate-bounce">
          <div className="px-5 py-2.5 bg-black/85 backdrop-blur-md border border-cyan-400/70 text-cyan-300 font-bold text-sm tracking-wide rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            {interactPrompt}
          </div>
        </div>
      )}

      {/* BOTTOM BAR: Equipped Weapon, Abilities, Controls Help & Minimap */}
      <div className="flex items-end justify-between gap-4 z-10">
        {/* Left: Weapon Card & Special Attack */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black/75 backdrop-blur-md rounded-xl border border-white/15 shadow-xl flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border"
              style={{
                borderColor: currentWeapon.accentColor,
                backgroundColor: `${currentWeapon.accentColor}20`,
              }}
            >
              <Crosshair className="w-5 h-5" style={{ color: currentWeapon.accentColor }} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-400">
                Primary Armament
              </div>
              <div className="text-sm font-bold text-white">{currentWeapon.name}</div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>DMG {currentWeapon.damage}</span>
                <span>·</span>
                <span className="text-cyan-400">{currentWeapon.type.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Ability Q Cooldown Indicator */}
          <div className="p-2.5 bg-black/75 backdrop-blur-md rounded-xl border border-cyan-500/30 flex flex-col items-center justify-center min-w-[70px]">
            <div className="relative">
              <Zap
                className={`w-6 h-6 ${
                  abilityCooldown <= 0 ? 'text-cyan-400 animate-pulse' : 'text-zinc-600'
                }`}
              />
              {abilityCooldown > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white tabular-nums bg-black/60 rounded">
                  {Math.ceil(abilityCooldown)}s
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-zinc-300 mt-1">[Q] BURST</span>
          </div>

          {/* Dodge Roll Indicator */}
          <div className="hidden sm:flex p-2.5 bg-black/75 backdrop-blur-md rounded-xl border border-zinc-700/40 flex-col items-center justify-center min-w-[70px]">
            <Compass className="w-6 h-6 text-orange-400" />
            <span className="text-[10px] font-bold text-zinc-300 mt-1">[C] DODGE</span>
          </div>
        </div>

        {/* Center: Controls Helper */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 text-[11px] text-zinc-400">
          <span><strong className="text-zinc-200">WASD</strong> Move</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Space</strong> Jump/Double</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Left Click / J</strong> Melee</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Right Click / K</strong> Ranged</span>
          <span>·</span>
          <span><strong className="text-zinc-200">Shift / C</strong> Slide</span>
        </div>

        {/* Right: Minimap Radar */}
        {minimapData && (
          <div className="flex flex-col items-end">
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/40 p-1 shadow-[0_0_15px_rgba(6,182,212,0.25)] overflow-hidden">
              {/* Radar Grid Lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-full h-[1px] bg-cyan-400" />
                <div className="h-full w-[1px] bg-cyan-400 absolute" />
                <div className="w-20 h-20 rounded-full border border-cyan-400 absolute" />
              </div>

              {/* Minimap Entities Canvas Simulation */}
              <div className="relative w-full h-full">
                {/* Player Center Indicator */}
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_6px_#06b6d4] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${minimapData.playerAngle}rad)`,
                  }}
                />

                {/* Radar Entities relative to Player */}
                {minimapData.entities.map((ent, idx) => {
                  const scale = 1.3; // map zoom
                  const rx = (ent.x - minimapData.playerX) * scale + 56;
                  const rz = (ent.z - minimapData.playerZ) * scale + 56;

                  if (rx < 0 || rx > 112 || rz < 0 || rz > 112) return null;

                  let color = 'bg-rose-500';
                  let size = 'w-1.5 h-1.5';
                  if (ent.type === 'boss') {
                    color = 'bg-amber-400 animate-ping';
                    size = 'w-2.5 h-2.5';
                  } else if (ent.type === 'chest') {
                    color = 'bg-yellow-400';
                  } else if (ent.type === 'portal') {
                    color = 'bg-fuchsia-400';
                  }

                  return (
                    <div
                      key={idx}
                      className={`absolute rounded-full ${color} ${size} -translate-x-1/2 -translate-y-1/2`}
                      style={{ left: `${rx}px`, top: `${rz}px` }}
                    />
                  );
                })}
              </div>

              <div className="absolute bottom-1 right-1 text-[8px] font-mono text-cyan-400 uppercase tracking-tighter">
                Radar
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
