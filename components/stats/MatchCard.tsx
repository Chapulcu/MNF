'use client';

import { useState } from 'react';
import { MatchWithGoals, GoalWithPlayer } from '@/lib/api/matches';
import { Circle, Pencil, Trash2, Plus, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

function formatSeconds(seconds: number | null) {
    if (seconds === null || Number.isNaN(seconds)) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function ResultBadge({ result }: { result: 'win' | 'loss' | 'draw' }) {
    const config = {
        win: { bg: 'bg-emerald-100/80 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-200', label: 'A Kazandı' },
        loss: { bg: 'bg-red-100/80 dark:bg-red-500/15', text: 'text-red-700 dark:text-red-200', label: 'B Kazandı' },
        draw: { bg: 'bg-slate-100/80 dark:bg-slate-700/40', text: 'text-slate-700 dark:text-slate-200', label: 'Berabere' },
    };
    const { bg, text, label } = config[result];
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>{label}</span>;
}

function getResult(a: number, b: number): 'win' | 'loss' | 'draw' {
    if (a > b) return 'win';
    if (a < b) return 'loss';
    return 'draw';
}

interface MatchCardProps {
    match: MatchWithGoals;
    isAdmin: boolean;
    showPendingOnly: boolean;
    selectedPendingGoals: Set<string>;
    onToggleSelectPending: (goalId: string) => void;
    onEditMatch: () => void;
    onDeleteMatch: () => void;
    onAddGoal: () => void;
    onExportGoals: () => void;
    onEditGoal: (goal: GoalWithPlayer) => void;
    onDeleteGoal: (goalId: string) => void;
    onConfirmGoal: (goalId: string, confirmed: boolean) => void;
}

export function MatchCard({
    match, isAdmin, showPendingOnly, selectedPendingGoals,
    onToggleSelectPending, onEditMatch, onDeleteMatch, onAddGoal,
    onExportGoals, onEditGoal, onDeleteGoal, onConfirmGoal,
}: MatchCardProps) {
    const [goalsOpen, setGoalsOpen] = useState(false);
    const result = getResult(match.teamAScore, match.teamBScore);
    const filteredGoals = showPendingOnly ? match.goals.filter((g) => !g.isConfirmed) : match.goals;
    const teamAGoals = filteredGoals.filter(g => g.team === 'A');
    const teamBGoals = filteredGoals.filter(g => g.team === 'B');

    const formatDate = (date: Date | string) =>
        new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const GoalRow = ({ goal, teamColor }: { goal: GoalWithPlayer; teamColor: string }) => (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                {showPendingOnly && (
                    <input type="checkbox" checked={selectedPendingGoals.has(goal.id)} onChange={() => onToggleSelectPending(goal.id)}
                        className="w-3.5 h-3.5 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900" />
                )}
                <span className={`${teamColor} font-medium`}>{goal.playerName}</span>
                {!goal.isConfirmed && (
                    <span className="px-1.5 py-0.5 bg-yellow-100/80 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-200 text-xs rounded">Onay bekliyor</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                {goal.minute !== null && <span className="text-slate-500 dark:text-slate-300">{formatSeconds(goal.minute)}</span>}
                {goal.youtubeUrl && (
                    <a href={goal.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                        YouTube <ExternalLink className="w-3 h-3" />
                    </a>
                )}
                {isAdmin && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => onEditGoal(goal)} className="p-2 rounded text-slate-600 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center" title="Golü düzenle"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onConfirmGoal(goal.id, !goal.isConfirmed)} className="p-2 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center" title={goal.isConfirmed ? 'Onayı kaldır' : 'Onayla'}>
                            {goal.isConfirmed ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => onDeleteGoal(goal.id)} className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center" title="Golü sil"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg border border-slate-200/70 dark:border-slate-700/60 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-300">{formatDate(match.date)}</span>
                        <span className="px-2 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-full">{match.matchType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ResultBadge result={result} />
                        {isAdmin && (
                            <div className="flex items-center gap-1">
                                <button onClick={onExportGoals} className="p-2.5 rounded-lg text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center" title="Maç gollerini dışa aktar"><Circle className="w-4 h-4" /></button>
                                <button onClick={onEditMatch} className="p-2.5 rounded-lg text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center" title="Maçı düzenle"><Pencil className="w-4 h-4" /></button>
                                <button onClick={onDeleteMatch} className="p-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center" title="Maçı sil"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 py-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto shadow-lg">A</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{match.teamAScore}</div>
                    </div>
                    <div className="text-2xl text-slate-400 dark:text-slate-500 font-light">-</div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto shadow-lg">B</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{match.teamBScore}</div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-700/60">
                    <button onClick={() => setGoalsOpen(prev => !prev)} className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 min-h-[44px]">
                        <span className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">⚽</span>
                            Goller {showPendingOnly ? '(Bekleyenler)' : ''}
                        </span>
                        <span className="text-slate-500 dark:text-slate-300">{filteredGoals.length} {goalsOpen ? '▲' : '▼'}</span>
                    </button>

                    {goalsOpen && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-lg border border-blue-200/60 dark:border-blue-400/20 bg-blue-50/50 dark:bg-blue-500/10 p-3">
                                <div className="text-xs font-semibold text-blue-700 dark:text-blue-200 mb-2">Takım A</div>
                                {teamAGoals.length === 0 ? <div className="text-xs text-slate-500 dark:text-slate-300">Gol yok</div> : (
                                    <div className="space-y-2">{teamAGoals.map(g => <GoalRow key={g.id} goal={g} teamColor="text-blue-700 dark:text-blue-200" />)}</div>
                                )}
                            </div>
                            <div className="rounded-lg border border-red-200/60 dark:border-red-400/20 bg-red-50/50 dark:bg-red-500/10 p-3">
                                <div className="text-xs font-semibold text-red-700 dark:text-red-200 mb-2">Takım B</div>
                                {teamBGoals.length === 0 ? <div className="text-xs text-slate-500 dark:text-slate-300">Gol yok</div> : (
                                    <div className="space-y-2">{teamBGoals.map(g => <GoalRow key={g.id} goal={g} teamColor="text-red-700 dark:text-red-200" />)}</div>
                                )}
                            </div>
                        </div>
                    )}
                    {showPendingOnly && filteredGoals.length === 0 && (
                        <div className="mt-3 text-sm text-slate-500 dark:text-slate-300">Bu maçta onay bekleyen gol yok.</div>
                    )}
                </div>

                <div className="mt-3">
                    <button onClick={onAddGoal} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm">
                        <Plus className="w-4 h-4" /> Gol Ekle
                    </button>
                </div>

                {match.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
                        <p className="text-sm text-slate-600 dark:text-slate-300">{match.notes}</p>
                    </div>
                )}

                {(match.teamAPlayers?.length || match.teamBPlayers?.length) && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Kadro</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50/80 dark:bg-blue-500/15 text-blue-700 dark:text-blue-200">A: {match.teamAPlayers?.length || 0}</span>
                            <span className="px-2 py-0.5 rounded-full bg-red-50/80 dark:bg-red-500/15 text-red-700 dark:text-red-200">B: {match.teamBPlayers?.length || 0}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
