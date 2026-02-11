'use client';

import { useState } from 'react';
import { MatchType } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Formation {
  name: string;
  description: string;
  // Positions for ONE team: [{x, y, role}] where x,y are 0-100 (percentage)
  positions: Array<{ x: number; y: number; role: string }>;
}

interface FormationDiagramProps {
  matchType: MatchType;
  onClose: (teamAFormation: Formation | null, teamBFormation: Formation | null) => void;
  initialTeamAIndex?: number;
  initialTeamBIndex?: number;
  currentTeamAFormation?: Formation | null;
  currentTeamBFormation?: Formation | null;
}

const formations: Record<MatchType, Formation[]> = {
  '5v5': [
    {
      name: '1-2-1 (Klasik)',
      description: '1 Kaleci - 2 Defans - 1 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },  // Kaleci
        { x: 25, y: 30, role: 'D' }, // Defans sol
        { x: 25, y: 70, role: 'D' }, // Defans sağ
        { x: 50, y: 50, role: 'OS' }, // Orta Saha
        { x: 80, y: 50, role: 'F' },  // Forvet
      ],
    },
    {
      name: '1-1-2 (Saldırgan)',
      description: '1 Kaleci - 1 Defans - 2 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 25, y: 50, role: 'D' },
        { x: 45, y: 35, role: 'OS' },
        { x: 45, y: 65, role: 'OS' },
        { x: 80, y: 50, role: 'F' },
      ],
    },
    {
      name: '1-1-1-1 (Denge)',
      description: '1 Kaleci - 1 Defans - 1 Orta Saha - 1 Forvet (Çok yönlü)',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 25, y: 50, role: 'D' },
        { x: 50, y: 50, role: 'OS' },
        { x: 75, y: 50, role: 'F' },
      ],
    },
    {
      name: '2-1-1 (Defansif)',
      description: '1 Kaleci - 3 Defans - 1 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 25, y: 25, role: 'D' },
        { x: 25, y: 50, role: 'D' },
        { x: 25, y: 75, role: 'D' },
        { x: 55, y: 50, role: 'OS' },
        { x: 80, y: 50, role: 'F' },
      ],
    },
  ],
  '6v6': [
    {
      name: '1-2-2 (Klasik)',
      description: '1 Kaleci - 2 Defans - 2 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 25, y: 30, role: 'D' },
        { x: 25, y: 70, role: 'D' },
        { x: 45, y: 35, role: 'OS' },
        { x: 45, y: 65, role: 'OS' },
        { x: 80, y: 50, role: 'F' },
      ],
    },
    {
      name: '1-3-1 (Orta Saha)',
      description: '1 Kaleci - 2 Defans - 3 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 20, y: 35, role: 'D' },
        { x: 20, y: 65, role: 'D' },
        { x: 45, y: 30, role: 'OS' },
        { x: 45, y: 50, role: 'OS' },
        { x: 45, y: 70, role: 'OS' },
        { x: 80, y: 50, role: 'F' },
      ],
    },
    {
      name: '1-1-2-1 (Saldırgan)',
      description: '1 Kaleci - 1 Defans - 2 Orta Saha - 2 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 25, y: 50, role: 'D' },
        { x: 45, y: 40, role: 'OS' },
        { x: 45, y: 60, role: 'OS' },
        { x: 75, y: 35, role: 'F' },
        { x: 75, y: 65, role: 'F' },
      ],
    },
    {
      name: '2-2-1 (Defansif)',
      description: '1 Kaleci - 3 Defans - 2 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 25, y: 25, role: 'D' },
        { x: 25, y: 50, role: 'D' },
        { x: 25, y: 75, role: 'D' },
        { x: 50, y: 35, role: 'OS' },
        { x: 50, y: 65, role: 'OS' },
        { x: 80, y: 50, role: 'F' },
      ],
    },
  ],
  '7v7': [
    {
      name: '1-2-3-1 (Klasik)',
      description: '1 Kaleci - 2 Defans - 3 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 20, y: 30, role: 'D' },
        { x: 20, y: 70, role: 'D' },
        { x: 40, y: 25, role: 'OS' },
        { x: 40, y: 50, role: 'OS' },
        { x: 40, y: 75, role: 'OS' },
        { x: 80, y: 50, role: 'F' },
      ],
    },
    {
      name: '1-3-2-1 (Saldırgan)',
      description: '1 Kaleci - 2 Defans - 3 Orta Saha - 2 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 20, y: 35, role: 'D' },
        { x: 20, y: 65, role: 'D' },
        { x: 40, y: 30, role: 'OS' },
        { x: 40, y: 50, role: 'OS' },
        { x: 40, y: 70, role: 'OS' },
        { x: 75, y: 40, role: 'F' },
        { x: 75, y: 60, role: 'F' },
      ],
    },
    {
      name: '1-2-2-1 (Denge)',
      description: '1 Kaleci - 2 Defans - 2 Orta Saha - 2 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 20, y: 30, role: 'D' },
        { x: 20, y: 70, role: 'D' },
        { x: 40, y: 35, role: 'OS' },
        { x: 40, y: 65, role: 'OS' },
        { x: 75, y: 40, role: 'F' },
        { x: 75, y: 60, role: 'F' },
      ],
    },
    {
      name: '1-4-1 (Orta Saha)',
      description: '1 Kaleci - 2 Defans - 4 Orta Saha - 1 Forvet',
      positions: [
        { x: 5, y: 50, role: 'K' },
        { x: 20, y: 35, role: 'D' },
        { x: 20, y: 65, role: 'D' },
        { x: 40, y: 20, role: 'OS' },
        { x: 40, y: 40, role: 'OS' },
        { x: 40, y: 60, role: 'OS' },
        { x: 40, y: 80, role: 'OS' },
        { x: 80, y: 50, role: 'F' },
      ],
    },
  ],
  '8v8': [
    {
      name: 'Dengeli 3-3-1',
      description: 'Basit ve dengeli dizilim',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 22, y: 25, role: 'D' },
        { x: 22, y: 50, role: 'D' },
        { x: 22, y: 75, role: 'D' },
        { x: 45, y: 25, role: 'OS' },
        { x: 45, y: 50, role: 'OS' },
        { x: 45, y: 75, role: 'OS' },
        { x: 75, y: 50, role: 'F' },
      ],
    },
    {
      name: 'Hucum 3-2-2',
      description: 'Önde iki forvet',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 22, y: 25, role: 'D' },
        { x: 22, y: 50, role: 'D' },
        { x: 22, y: 75, role: 'D' },
        { x: 45, y: 35, role: 'OS' },
        { x: 45, y: 65, role: 'OS' },
        { x: 72, y: 40, role: 'F' },
        { x: 72, y: 60, role: 'F' },
      ],
    },
  ],
  '9v9': [
    {
      name: 'Dengeli 3-3-2',
      description: 'Kompakt ve anlaşılır',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 20, y: 25, role: 'D' },
        { x: 20, y: 50, role: 'D' },
        { x: 20, y: 75, role: 'D' },
        { x: 42, y: 25, role: 'OS' },
        { x: 42, y: 50, role: 'OS' },
        { x: 42, y: 75, role: 'OS' },
        { x: 75, y: 40, role: 'F' },
        { x: 75, y: 60, role: 'F' },
      ],
    },
    {
      name: 'Defans 4-2-2',
      description: 'Güvenli savunma hattı',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 18, y: 20, role: 'D' },
        { x: 18, y: 40, role: 'D' },
        { x: 18, y: 60, role: 'D' },
        { x: 18, y: 80, role: 'D' },
        { x: 42, y: 35, role: 'OS' },
        { x: 42, y: 65, role: 'OS' },
        { x: 75, y: 40, role: 'F' },
        { x: 75, y: 60, role: 'F' },
      ],
    },
  ],
  '10v10': [
    {
      name: 'Dengeli 4-3-2',
      description: 'Klasik ve kolay',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 18, y: 20, role: 'D' },
        { x: 18, y: 40, role: 'D' },
        { x: 18, y: 60, role: 'D' },
        { x: 18, y: 80, role: 'D' },
        { x: 40, y: 25, role: 'OS' },
        { x: 40, y: 50, role: 'OS' },
        { x: 40, y: 75, role: 'OS' },
        { x: 75, y: 40, role: 'F' },
        { x: 75, y: 60, role: 'F' },
      ],
    },
    {
      name: 'Orta Saha 3-4-2',
      description: 'Topa sahip olmaya uygun',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 20, y: 25, role: 'D' },
        { x: 20, y: 50, role: 'D' },
        { x: 20, y: 75, role: 'D' },
        { x: 40, y: 20, role: 'OS' },
        { x: 40, y: 40, role: 'OS' },
        { x: 40, y: 60, role: 'OS' },
        { x: 40, y: 80, role: 'OS' },
        { x: 75, y: 40, role: 'F' },
        { x: 75, y: 60, role: 'F' },
      ],
    },
  ],
  '11v11': [
    {
      name: 'Klasik 4-3-3',
      description: 'Herkesin bildigi temel dizilim',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 18, y: 20, role: 'D' },
        { x: 18, y: 40, role: 'D' },
        { x: 18, y: 60, role: 'D' },
        { x: 18, y: 80, role: 'D' },
        { x: 40, y: 25, role: 'OS' },
        { x: 40, y: 50, role: 'OS' },
        { x: 40, y: 75, role: 'OS' },
        { x: 75, y: 25, role: 'F' },
        { x: 75, y: 50, role: 'F' },
        { x: 75, y: 75, role: 'F' },
      ],
    },
    {
      name: 'Dengeli 4-4-2',
      description: 'Kullanimi kolay, net roller',
      positions: [
        { x: 6, y: 50, role: 'K' },
        { x: 18, y: 20, role: 'D' },
        { x: 18, y: 40, role: 'D' },
        { x: 18, y: 60, role: 'D' },
        { x: 18, y: 80, role: 'D' },
        { x: 40, y: 20, role: 'OS' },
        { x: 40, y: 40, role: 'OS' },
        { x: 40, y: 60, role: 'OS' },
        { x: 40, y: 80, role: 'OS' },
        { x: 75, y: 40, role: 'F' },
        { x: 75, y: 60, role: 'F' },
      ],
    },
  ],
};

export function FormationDiagram({ matchType, onClose, initialTeamAIndex = 0, initialTeamBIndex = 0, currentTeamAFormation, currentTeamBFormation }: FormationDiagramProps) {
  const matchFormations = formations[matchType];
  const [teamAIndex, setTeamAIndex] = useState(initialTeamAIndex);
  const [teamBIndex, setTeamBIndex] = useState(initialTeamBIndex);
  const teamAFormation = matchFormations[teamAIndex];
  const teamBFormation = matchFormations[teamBIndex];

  const getPositionColor = (role: string) => {
    switch (role) {
      case 'K': return 'bg-yellow-500 border-yellow-700';
      case 'D': return 'bg-blue-500 border-blue-700';
      case 'OS': return 'bg-green-500 border-green-700';
      case 'F': return 'bg-red-500 border-red-700';
      default: return '';
    }
  };

  const getPositionLabel = (role: string) => {
    switch (role) {
      case 'K': return 'K';
      case 'D': return 'D';
      case 'OS': return 'OS';
      case 'F': return 'F';
      default: return '';
    }
  };

  const handleApplyTeamA = () => {
    onClose(teamAFormation ?? null, currentTeamBFormation ?? null);
  };

  const handleApplyTeamB = () => {
    onClose(currentTeamAFormation ?? null, teamBFormation ?? null);
  };

  const handleApplyBoth = () => {
    onClose(teamAFormation ?? null, teamBFormation ?? null);
  };

  const handleCancel = () => {
    onClose(currentTeamAFormation ?? null, currentTeamBFormation ?? null);
  };

  // Mirror X position for Team B (they play from right to left)
  const getMirroredX = (x: number) => 100 - x;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full p-6 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Formasyon Seçimi - {matchType}</h3>
          <button
            onClick={handleCancel}
            className="p-2 text-white/80 hover:bg-slate-700/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Selection Areas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Team A */}
          <div className="bg-blue-500/20 border-2 border-blue-400/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-blue-300">TAKIM A (Mavi)</h4>
              <span className="text-sm text-blue-400">({teamAIndex + 1}/{matchFormations.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTeamAIndex((prev) => (prev === 0 ? matchFormations.length - 1 : prev - 1))}
                className="p-1 bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-sm font-semibold text-white">{teamAFormation.name}</p>
                <p className="text-xs text-blue-200">{teamAFormation.description}</p>
              </div>
              <button
                onClick={() => setTeamAIndex((prev) => (prev === matchFormations.length - 1 ? 0 : prev + 1))}
                className="p-1 bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1 mt-2 justify-center">
              {matchFormations.map((_, index) => (
                <button
                  key={`a-${index}`}
                  onClick={() => setTeamAIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === teamAIndex ? 'bg-blue-400 w-4' : 'bg-blue-500/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Team B */}
          <div className="bg-red-500/20 border-2 border-red-400/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-red-300">TAKIM B (Kırmızı)</h4>
              <span className="text-sm text-red-400">({teamBIndex + 1}/{matchFormations.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTeamBIndex((prev) => (prev === 0 ? matchFormations.length - 1 : prev - 1))}
                className="p-1 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-sm font-semibold text-white">{teamBFormation.name}</p>
                <p className="text-xs text-red-200">{teamBFormation.description}</p>
              </div>
              <button
                onClick={() => setTeamBIndex((prev) => (prev === matchFormations.length - 1 ? 0 : prev + 1))}
                className="p-1 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1 mt-2 justify-center">
              {matchFormations.map((_, index) => (
                <button
                  key={`b-${index}`}
                  onClick={() => setTeamBIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === teamBIndex ? 'bg-red-400 w-4' : 'bg-red-500/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Full Pitch with Both Teams */}
        <div className="relative w-full rounded-lg border-4 border-emerald-400/80 overflow-hidden mb-4" style={{ aspectRatio: '3/2', background: 'linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)' }}>
          {/* Center line */}
          <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-white/80 transform -translate-x-1/2 pointer-events-none" />
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 w-16 h-16 border-2 border-white/80 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          {/* Center spot */}
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/90 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Left Penalty Area (Team A defends) */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-12 h-28 border-2 border-l-0 border-white/80 pointer-events-none" />
          {/* Left Goal Area */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-16 border-2 border-l-0 border-white/80 pointer-events-none" />
          {/* Left Goal */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-white/40 rounded-r-lg border border-white/60 border-l-0 pointer-events-none" />

          {/* Right Penalty Area (Team B defends) */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-28 border-2 border-r-0 border-white/80 pointer-events-none" />
          {/* Right Goal Area */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-16 border-2 border-r-0 border-white/80 pointer-events-none" />
          {/* Right Goal */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-white/40 rounded-l-lg border border-white/60 border-r-0 pointer-events-none" />

          {/* Team A Positions (Left side, attacking right) */}
          {teamAFormation.positions.map((pos, index) => (
            <div
              key={`team-a-${index}`}
              className={`absolute w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-lg ${getPositionColor(pos.role)}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
            >
              {getPositionLabel(pos.role)}
            </div>
          ))}

          {/* Team B Positions (Right side, mirrored, attacking left) */}
          {teamBFormation.positions.map((pos, index) => (
            <div
              key={`team-b-${index}`}
              className={`absolute w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-lg ${getPositionColor(pos.role)}`}
              style={{
                left: `${getMirroredX(pos.x)}%`,
                top: `${pos.y}%`,
              }}
            >
              {getPositionLabel(pos.role)}
            </div>
          ))}

          {/* Team Labels */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm border border-blue-400/50 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
            TAKIM A
          </div>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm border border-red-400/50 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
            TAKIM B
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-slate-600/80 hover:bg-slate-700/80 text-white rounded-lg font-medium transition-colors border border-slate-500/50"
          >
            İptal
          </button>
          <button
            onClick={handleApplyTeamA}
            className="px-6 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded-lg font-medium transition-colors border border-blue-400/50"
          >
            Sadece Takım A
          </button>
          <button
            onClick={handleApplyTeamB}
            className="px-6 py-2 bg-red-500/80 hover:bg-red-600/80 text-white rounded-lg font-medium transition-colors border border-red-400/50"
          >
            Sadece Takım B
          </button>
          <button
            onClick={handleApplyBoth}
            className="px-6 py-2 bg-emerald-500/80 hover:bg-emerald-600/80 text-white rounded-lg font-medium transition-colors border border-emerald-400/50"
          >
            İkisini de Uygula
          </button>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border border-yellow-700"></div>
            <span className="text-sm text-slate-300">Kaleci</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-700"></div>
            <span className="text-sm text-slate-300">Defans</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border border-green-700"></div>
            <span className="text-sm text-slate-300">Orta Saha</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border border-red-700"></div>
            <span className="text-sm text-slate-300">Forvet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export formations type for use in other components
export type { Formation };
