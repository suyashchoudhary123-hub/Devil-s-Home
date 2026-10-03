import React from 'react';
import { X, Shield, Swords, Zap, Flame, Compass, Heart } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white font-chakra">
              Survivor Field Manual & Combat Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-zinc-300">
          <div>
            <h3 className="text-sm font-bold text-white font-chakra mb-2 uppercase tracking-wider text-orange-400">
              The Legend of Devil's Home
            </h3>
            <p className="leading-relaxed text-zinc-400">
              You play as Arjun, a 15-year-old brave orphan who found an ancient cyan amulet pulsing
              with soul power. Banished into the subterranean volcanic nightmare known as Devil's
              Home, you must survive demonic bat hordes, fire-spitting wyverns, and the colossal
              Magma Demon to reach the Whispering Dread and unlock the Void Portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 font-bold text-white font-chakra text-sm mb-2">
                <Swords className="w-4 h-4 text-orange-400" />
                Movement & Combat Controls
              </div>
              <ul className="space-y-1.5 text-zinc-400">
                <li><strong className="text-zinc-200">WASD / Arrow Keys</strong>: Move / Run</li>
                <li><strong className="text-zinc-200">Spacebar</strong>: Jump & Double Jump</li>
                <li><strong className="text-zinc-200">Shift or C</strong>: Tactical Slide / Dodge Roll</li>
                <li><strong className="text-zinc-200">Left Click or J</strong>: 3-Hit Melee Combo</li>
                <li><strong className="text-zinc-200">Right Click or K</strong>: Ranged Plasma / Magic Bolt</li>
                <li><strong className="text-zinc-200">Q Key</strong>: Hero Ability Burst / Transformation</li>
                <li><strong className="text-zinc-200">E Key</strong>: Open Chests & Enter Portals</li>
              </ul>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 font-bold text-white font-chakra text-sm mb-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Survival Mechanics
              </div>
              <ul className="space-y-1.5 text-zinc-400">
                <li><strong className="text-zinc-200">Lifeline Hearts</strong>: You start with 3 hearts. Upgrade up to 6 hearts in the Armory.</li>
                <li><strong className="text-zinc-200">Dodge Invulnerability</strong>: Sliding grants momentary immunity against demon shockwaves.</li>
                <li><strong className="text-zinc-200">Telegraphed Wind-ups</strong>: Watch when demons flash and wind up their weapons—roll away!</li>
                <li><strong className="text-zinc-200">Server Authentication</strong>: Your coins and unlocked weapons are cryptographically saved to your profile.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <div>
                <div className="text-xs font-bold text-white">Audio Atmosphere</div>
                <div className="text-[11px] text-zinc-400">
                  Sub-bass heartbeat tension activates when your lifeline drops to 1 heart.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
