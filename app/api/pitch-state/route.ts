import { NextRequest, NextResponse } from 'next/server';
import { getPitchState, updatePitchState, clearPitchState } from '@/lib/db/sqlite';

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
  try {
    const body = await request.json();
    const { matchType, activePlayers, teamAFormation, teamBFormation, scheduledAt, isActive } = body;

    updatePitchState({
      matchType,
      activePlayers,
      teamAFormation,
      teamBFormation,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : scheduledAt === null ? null : undefined,
      isActive,
    });

    const updatedState = getPitchState();
    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Failed to update pitch state:', error);
    return NextResponse.json(
      { error: 'Failed to update pitch state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
}
