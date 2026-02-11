import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStats, getMatchStats } from '@/lib/db/sqlite';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');

    if (playerId) {
      // Get stats for a specific player
      const allStats = getPlayerStats();
      const playerStats = allStats.find(s => s.playerId === playerId);
      if (!playerStats) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json(playerStats);
    }

    // Get all stats
    const playerStats = getPlayerStats();
    const matchStats = getMatchStats();

    return NextResponse.json({
      players: playerStats,
      matches: matchStats,
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
