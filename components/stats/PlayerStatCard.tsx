import { PlayerStats } from '@/lib/api/matches';

export function PlayerStatCard({ stat }: { stat: PlayerStats }) {
    return (
        <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg border border-slate-200/70 dark:border-slate-700/60 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
                {stat.photoUrl ? (
                    <img src={stat.photoUrl} alt={stat.playerName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {stat.playerName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{stat.playerName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{stat.position}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50/80 dark:bg-emerald-500/15 rounded-lg p-2">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300">{stat.totalGoals}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Gol</div>
                </div>
                <div className="bg-blue-50/80 dark:bg-blue-500/15 rounded-lg p-2">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-300">{stat.totalMatches}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Maç</div>
                </div>
                <div className="bg-purple-50/80 dark:bg-purple-500/15 rounded-lg p-2">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-300">{stat.goalsPerMatch.toFixed(2)}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Gol/Maç</div>
                </div>
            </div>
        </div>
    );
}
