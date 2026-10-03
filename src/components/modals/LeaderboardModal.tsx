import React, { useEffect, useState } from 'react';
import { X, Trophy, Skull, Flame, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

interface LeaderboardModalProps {
  currentUsername?: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  currentUsername,
  onClose,
}) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard();
      setEntries(data.leaderboard || []);
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-chakra">
                Hall of Fallen Warriors
              </h2>
              <p className="text-xs text-zinc-400">
                Top survivors who defied the Devil's Home
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchScores}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-mono">
              Summoning records from the underworld...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500">
              No brave souls recorded yet. Be the first to conquer the abyss!
            </div>
          ) : (
            <div className="w-full text-left font-chakra">
              <div className="grid grid-cols-12 pb-3 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-3">
                <span className="col-span-2">Rank</span>
                <span className="col-span-4">Warrior</span>
                <span className="col-span-2 text-center">Zone</span>
                <span className="col-span-2 text-center">Kills</span>
                <span className="col-span-2 text-right">Score</span>
              </div>

              <div className="divide-y divide-zinc-900 mt-1">
                {entries.map((entry, idx) => {
                  const isCurrent = currentUsername && entry.username.toLowerCase() === currentUsername.toLowerCase();
                  const isTop3 = idx < 3;
                  const rankColor =
                    idx === 0
                      ? 'text-amber-400 font-bold'
                      : idx === 1
                      ? 'text-slate-300 font-bold'
                      : idx === 2
                      ? 'text-amber-700 font-bold'
                      : 'text-zinc-500';

                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 py-3 px-3 rounded-lg items-center text-xs transition-colors ${
                        isCurrent
                          ? 'bg-cyan-950/30 border border-cyan-500/30'
                          : 'hover:bg-zinc-900/40'
                      }`}
                    >
                      <div className={`col-span-2 flex items-center gap-1.5 ${rankColor} tabular-nums font-bold`}>
                        {isTop3 && <Trophy className="w-3.5 h-3.5" />}
                        #{idx + 1}
                      </div>

                      <div className="col-span-4 font-bold text-white truncate flex items-center gap-1.5">
                        <span>{entry.username}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-cyan-400 font-semibold">(You)</span>
                        )}
                      </div>

                      <div className="col-span-2 text-center text-zinc-400 tabular-nums">
                        Zone {entry.level || 1}
                      </div>

                      <div className="col-span-2 text-center text-zinc-300 tabular-nums flex items-center justify-center gap-1">
                        <Skull className="w-3 h-3 text-rose-500" />
                        <span>{entry.kills || 0}</span>
                      </div>

                      <div className="col-span-2 text-right font-bold text-amber-400 tabular-nums">
                        {(entry.score || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
