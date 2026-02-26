import { NextRequest, NextResponse } from 'next/server';
import { getPitchState, updatePitchState, clearPitchState } from '@/lib/db/sqlite';
import { requireAuth, requireAdmin, withAuth } from '@/lib/utils/auth-guard';
import { notifyClients } from './stream/route';

export async function GET() {
  try {
    const state = getPitchState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to get pitch state:', error);
    return NextResponse.json(
      { error: 'Failed to get pitch state' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return withAuth(requireAuth, async () => {
    try {
      const body = await request.json();
      const { matchType, activePlayers, teamAFormation, teamBFormation, scheduledAt, isActive, playerPositions } = body;

      updatePitchState({
        matchType,
        activePlayers,
        teamAFormation,
        teamBFormation,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : scheduledAt === null ? null : undefined,
        isActive,
        playerPositions,
      });

      // Notify all SSE-connected clients of the state change
      notifyClients();

      const updatedState = getPitchState();
      return NextResponse.json(updatedState);
    } catch (error) {
      console.error('Failed to update pitch state:', error);
      return NextResponse.json(
        { error: 'Failed to update pitch state' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(requireAdmin, async () => {
    try {
      const body = await request.json();
      const { action } = body;

      if (action === 'clear') {
        clearPitchState();
        const state = getPitchState();
        return NextResponse.json(state);
      }

      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    } catch (error) {
      console.error('Failed to clear pitch state:', error);
      return NextResponse.json(
        { error: 'Failed to clear pitch state' },
        { status: 500 }
      );
    }
  });
}
