import { NextRequest, NextResponse } from 'next/server';
import { getMatchById, updateMatch, deleteMatch, getGoalsByMatch, createGoal, updateGoal, deleteGoal, getAllPlayers } from '@/lib/db/sqlite';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = getMatchById(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const goals = getGoalsByMatch(id);

    // Get player details for goals
    const players = getAllPlayers();
    const goalsWithPlayerNames = goals.map(goal => ({
      ...goal,
      playerName: players.find(p => p.id === goal.playerId)?.name || 'Bilinmiyor',
    }));

    return NextResponse.json({ match, goals: goalsWithPlayerNames });
  } catch (error) {
    console.error('Failed to get match:', error);
    return NextResponse.json({ error: 'Failed to get match' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, matchType, teamAScore, teamBScore, teamAFormation, teamBFormation, teamAPlayers, teamBPlayers, notes } = body;

    const match = updateMatch(id, {
      date: date ? new Date(date) : undefined,
      matchType,
      teamAScore,
      teamBScore,
      teamAFormation,
      teamBFormation,
      teamAPlayers,
      teamBPlayers,
      notes,
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error('Failed to update match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteMatch(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}

// Goal operations for a specific match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // match id
    const body = await request.json();
    const { playerId, minute, team, isConfirmed } = body;

    if (!playerId || !team) {
      return NextResponse.json(
        { error: 'PlayerId and team are required' },
        { status: 400 }
      );
    }

    const goal = createGoal({
      matchId: id,
      playerId,
      minute: minute || null,
      team,
      isConfirmed: isConfirmed ?? false,
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
