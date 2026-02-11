import { NextRequest, NextResponse } from 'next/server';
import { updateGoal, deleteGoal, getGoalsByMatch } from '@/lib/db/sqlite';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // goal id
    const body = await request.json();
    const { isConfirmed, minute } = body;

    const goal = updateGoal(id, {
      isConfirmed: isConfirmed ?? undefined,
      minute: minute ?? undefined,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to update goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // goal id
    deleteGoal(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
