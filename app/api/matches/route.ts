import { NextRequest, NextResponse } from 'next/server';
import { getAllMatches, createMatch, getGoalsByMatch, getPlayerById } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const matches = getAllMatches();

    // Add goals with player names to each match
    const matchesWithGoals = matches.map(match => {
      const goals = getGoalsByMatch(match.id);

      // Add player names to goals
      const goalsWithPlayerNames = goals.map(goal => {
        const player = getPlayerById(goal.playerId);
        return {
          ...goal,
          playerName: player?.name || 'Bilinmeyen Oyuncu',
        };
      });

      return {
        ...match,
        goals: goalsWithPlayerNames,
      };
    });

    return NextResponse.json(matchesWithGoals);
  } catch (error) {
    console.error('Failed to get matches:', error);
    return NextResponse.json({ error: 'Failed to get matches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, matchType, teamAScore, teamBScore, teamAFormation, teamBFormation, teamAPlayers, teamBPlayers, notes } = body;

    // Validate input
    if (!date || !matchType || teamAScore === undefined || teamBScore === undefined) {
      return NextResponse.json(
        { error: 'Date, matchType, and scores are required' },
        { status: 400 }
      );
    }

    const match = createMatch({
      date: new Date(date),
      matchType,
      teamAScore,
      teamBScore,
      teamAFormation: teamAFormation || null,
      teamBFormation: teamBFormation || null,
      teamAPlayers: teamAPlayers || [],
      teamBPlayers: teamBPlayers || [],
      notes: notes || null,
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Failed to create match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}
