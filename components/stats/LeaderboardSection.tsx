import { PlayerStats, MatchStats } from '@/lib/api/matches';
import { Circle, Target, TrendingUp, Trophy, Calendar } from 'lucide-react';

function getMedal(index: number) {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
}

function LeaderTable({
    title, icon, data, valueKey, valueColor, secondKey, thirdKey, secondLabel, thirdLabel,
}: {
    title: string;
    icon: React.ReactNode;
    data: PlayerStats[];
    valueKey: keyof PlayerStats;
    valueColor: string;
    secondKey: keyof PlayerStats;
    thirdKey: keyof PlayerStats;
    secondLabel: string;
    thirdLabel: string;
}) {
    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
                {data.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 dark:text-slate-300">Veri yok</p>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-100/80 dark:bg-slate-800/70">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">#</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Oyuncu</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{title.split(' ')[0]}</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{secondLabel}</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{thirdLabel}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((stat, index) => (
                                <tr key={stat.playerId} className="border-t border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">{getMedal(index)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {stat.photoUrl
                                                ? <img src={stat.photoUrl} alt={stat.playerName} className="w-8 h-8 rounded-full object-cover" />
                                                : <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{stat.playerName.charAt(0).toUpperCase()}</div>
                                            }
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{stat.playerName}</span>
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 text-right font-semibold ${valueColor}`}>
                                        {typeof stat[valueKey] === 'number'
                                            ? Number.isInteger(stat[valueKey]) ? String(stat[valueKey]) : (stat[valueKey] as number).toFixed(2)
                                            : String(stat[valueKey] ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                        {String(stat[secondKey] ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                        {typeof stat[thirdKey] === 'number'
                                            ? Number.isInteger(stat[thirdKey]) ? String(stat[thirdKey]) : (stat[thirdKey] as number).toFixed(2)
                                            : String(stat[thirdKey] ?? '')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export function LeaderboardSection({ playerStats, matchStats }: { playerStats: PlayerStats[]; matchStats: MatchStats | null }) {
    const topScorers = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 10);
    const mostMatches = [...playerStats].sort((a, b) => b.totalMatches - a.totalMatches).slice(0, 10);
    const bestRatio = [...playerStats].filter(p => p.totalMatches >= 3).sort((a, b) => b.goalsPerMatch - a.goalsPerMatch).slice(0, 10);

    return (
        <div className="space-y-6">
            {matchStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Toplam Maç', value: matchStats.totalMatches, icon: <Circle className="w-5 h-5" />, grade: 'from-green-400 to-green-600' },
                        { label: 'Toplam Gol', value: matchStats.totalGoals, icon: <Target className="w-5 h-5" />, grade: 'from-blue-400 to-blue-600' },
                        { label: 'Ort. Gol', value: matchStats.avgGoalsPerMatch.toFixed(1), icon: <TrendingUp className="w-5 h-5" />, grade: 'from-purple-400 to-purple-600' },
                        { label: 'A Galibiyet', value: matchStats.teamAWins, icon: <Trophy className="w-5 h-5" />, grade: 'from-orange-400 to-orange-600' },
                        { label: 'B Galibiyet', value: matchStats.teamBWins, icon: <Trophy className="w-5 h-5" />, grade: 'from-rose-400 to-red-600' },
                    ].map(({ label, value, icon, grade }) => (
                        <div key={label} className={`bg-gradient-to-br ${grade} rounded-xl p-4 text-white`}>
                            <div className="flex items-center gap-2 mb-1">{icon}<span className="text-sm opacity-90">{label}</span></div>
                            <div className="text-3xl font-bold">{value}</div>
                        </div>
                    ))}
                </div>
            )}

            <LeaderTable title="Gol Kralları" icon={<Target className="w-5 h-5 text-yellow-500" />}
                data={topScorers} valueKey="totalGoals" valueColor="text-emerald-600 dark:text-emerald-300"
                secondKey="totalMatches" thirdKey="goalsPerMatch" secondLabel="Maç" thirdLabel="Ort" />

            <LeaderTable title="En Çok Oynayanlar" icon={<Calendar className="w-5 h-5 text-blue-500" />}
                data={mostMatches} valueKey="totalMatches" valueColor="text-blue-600 dark:text-blue-300"
                secondKey="totalGoals" thirdKey="goalsPerMatch" secondLabel="Gol" thirdLabel="Ort" />

            <LeaderTable title="En Verimli (Min. 3 Maç)" icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
                data={bestRatio} valueKey="goalsPerMatch" valueColor="text-purple-600 dark:text-purple-300"
                secondKey="totalGoals" thirdKey="totalMatches" secondLabel="Gol" thirdLabel="Maç" />
        </div>
    );
}
