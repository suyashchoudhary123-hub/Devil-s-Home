import React, { useState } from 'react';
import { X, Check, Lock, Swords, Crosshair, Sparkles, Heart } from 'lucide-react';
import { WeaponConfig, WeaponId } from '../../types/game';
import { WEAPONS } from '../../game/constants';

interface WeaponArmoryProps {
  unlockedWeapons: string[];
  selectedWeapon: WeaponId;
  coins: number;
  maxHearts: number;
  onSelectWeapon: (id: WeaponId) => void;
  onUnlockWeapon: (id: WeaponId) => Promise<void>;
  onUpgradeHeart: () => Promise<void>;
  onClose: () => void;
}

export const WeaponArmory: React.FC<WeaponArmoryProps> = ({
  unlockedWeapons,
  selectedWeapon,
  coins,
  maxHearts,
  onSelectWeapon,
  onUnlockWeapon,
  onUpgradeHeart,
  onClose,
}) => {
  const [activeWeaponId, setActiveWeaponId] = useState<WeaponId>(selectedWeapon);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeWeapon = WEAPONS.find((w) => w.id === activeWeaponId) || WEAPONS[0];
  const isUnlocked = unlockedWeapons.includes(activeWeaponId);
  const isSelected = selectedWeapon === activeWeaponId;

  const handleBuyWeapon = async () => {
    setErrorMsg(null);
    if (coins < activeWeapon.price) {
      setErrorMsg(`Insufficient coins. Need ${activeWeapon.price - coins} more coins.`);
      return;
    }
    setIsPurchasing(true);
    try {
      await onUnlockWeapon(activeWeaponId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Weapon purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleBuyHeart = async () => {
    setErrorMsg(null);
    if (maxHearts >= 6) {
      setErrorMsg('Maximum 6 hearts reached!');
      return;
    }
    if (coins < 300) {
      setErrorMsg(`Insufficient coins. Lifeline Crystal costs 300 coins.`);
      return;
    }
    setIsPurchasing(true);
    try {
      await onUpgradeHeart();
    } catch (err: any) {
      setErrorMsg(err.message || 'Heart upgrade failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-zinc-950/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-chakra flex items-center gap-2">
              <Swords className="w-5 h-5 text-orange-400" />
              Obsidian Armory & Upgrades
            </h2>
            <p className="text-xs text-zinc-400">
              Unlock stylized energy weapons and expand your lifeline capacity
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Armory Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Weapons Cards List */}
          <div className="md:col-span-7 p-6 border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Select Weapon To Inspect
            </div>

            <div className="grid grid-cols-2 gap-3">
              {WEAPONS.map((wpn) => {
                const unlocked = unlockedWeapons.includes(wpn.id);
                const isCur = activeWeaponId === wpn.id;
                const isEquipped = selectedWeapon === wpn.id;

                return (
                  <button
                    key={wpn.id}
                    onClick={() => {
                      setActiveWeaponId(wpn.id);
                      setErrorMsg(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isCur
                        ? 'border-orange-500 bg-orange-950/20 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border mb-2"
                        style={{
                          borderColor: wpn.accentColor,
                          backgroundColor: `${wpn.accentColor}20`,
                        }}
                      >
                        <Crosshair className="w-4 h-4" style={{ color: wpn.accentColor }} />
                      </div>
                      {isEquipped ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          Active
                        </span>
                      ) : !unlocked ? (
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                      ) : null}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white truncate">{wpn.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <span>DMG {wpn.damage}</span>
                        <span>·</span>
                        <span className="capitalize">{wpn.type}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Heart Capacity Upgrade Card */}
            <div className="mt-4 p-4 rounded-xl border border-rose-900/40 bg-gradient-to-r from-rose-950/20 to-black/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Lifeline Crystal (+1 Heart)</div>
                  <div className="text-[11px] text-zinc-400">
                    Current Capacity: <strong className="text-rose-400">{maxHearts} / 6 Hearts</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBuyHeart}
                disabled={isPurchasing || maxHearts >= 6}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-md"
              >
                {maxHearts >= 6 ? 'Maxed Out' : 'Upgrade (300 C)'}
              </button>
            </div>
          </div>

          {/* Active Weapon Detail & Purchase Actions */}
          <div className="md:col-span-5 p-6 bg-zinc-950 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span
                  className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider text-black font-chakra"
                  style={{ backgroundColor: activeWeapon.accentColor }}
                >
                  {activeWeapon.type} Weapon
                </span>
                <h3 className="text-xl font-bold text-white font-chakra mt-2">
                  {activeWeapon.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {activeWeapon.description}
                </p>
              </div>

              {/* Weapon Stats */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold mb-1">
                    <span>Base Damage</span>
                    <span className="tabular-nums text-rose-400">{activeWeapon.damage} HP</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, (activeWeapon.damage / 90) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold mb-1">
                    <span>Attack Speed</span>
                    <span className="tabular-nums text-amber-400">{activeWeapon.speed} /s</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (activeWeapon.speed / 3.5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold mb-1">
                    <span>Strike Range</span>
                    <span className="tabular-nums text-cyan-400">{activeWeapon.range}m</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, (activeWeapon.range / 22) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Special Effect */}
              <div className="p-3.5 bg-orange-950/20 border border-orange-500/20 rounded-xl mb-4">
                <div className="text-xs font-bold text-orange-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Special Combat Effect
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {activeWeapon.specialEffect}
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 mb-4 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div>
                {!isUnlocked && (
                  <div className="text-xs font-semibold text-zinc-300">
                    Cost: <strong className="text-amber-400">{activeWeapon.price} Coins</strong>
                  </div>
                )}
              </div>

              {isSelected ? (
                <button
                  disabled
                  className="px-6 py-2.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 cursor-default"
                >
                  <Check className="w-4 h-4" /> Equipped
                </button>
              ) : isUnlocked ? (
                <button
                  onClick={() => onSelectWeapon(activeWeaponId)}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Equip Weapon
                </button>
              ) : (
                <button
                  onClick={handleBuyWeapon}
                  disabled={isPurchasing}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                >
                  {isPurchasing ? 'Purchasing...' : `Unlock for ${activeWeapon.price} Coins`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
