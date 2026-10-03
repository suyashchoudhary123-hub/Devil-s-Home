import React from 'react';
import { User } from '../../types/game';
import { LogOut, User as UserIcon, Flame } from 'lucide-react';

interface TopBarProps {
  user: User | null;
  onOpenAuth: (view: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenCharacterLab: () => void;
  onOpenArmory: () => void;
  onOpenLeaderboard: () => void;
  onOpenHowToPlay: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenCharacterLab,
  onOpenArmory,
  onOpenLeaderboard,
  onOpenHowToPlay,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-black/85 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-30 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
          className="text-lg font-black tracking-widest text-slate-100 font-cinzel hover:text-orange-400 transition-colors whitespace-nowrap"
        >
          DEVIL'S HOME
        </a>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300 font-chakra">
        <button
          onClick={onOpenCharacterLab}
          className="hover:text-cyan-400 transition-colors hover:underline underline-offset-4 whitespace-nowrap"
        >
          Character Lab
        </button>
        <button
          onClick={onOpenArmory}
          className="hover:text-orange-400 transition-colors hover:underline underline-offset-4 whitespace-nowrap"
        >
          Weapon Armory
        </button>
        <button
          onClick={onOpenLeaderboard}
          className="hover:text-amber-400 transition-colors hover:underline underline-offset-4 whitespace-nowrap"
        >
          Leaderboard
        </button>
        <button
          onClick={onOpenHowToPlay}
          className="hover:text-slate-100 transition-colors hover:underline underline-offset-4 whitespace-nowrap"
        >
          Controls & Guide
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white font-chakra truncate max-w-[120px]">{user.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-colors whitespace-nowrap font-chakra"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors shadow-sm whitespace-nowrap font-chakra"
            >
              Save Progress
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
