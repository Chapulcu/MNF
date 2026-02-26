import { NextRequest, NextResponse } from 'next/server';
import { getPlayerById, updatePlayer, deletePlayer, hashPassword } from '@/lib/db/sqlite';
import { requireAdmin, withAuth } from '@/lib/utils/auth-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = getPlayerById(id);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error) {
    console.error('Failed to get player:', error);
    return NextResponse.json({ error: 'Failed to get player' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(requireAdmin, async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { name, positionPreference, photoUrl, password, isAdmin } = body;

      // Hash new password if provided
      const hashedPassword = password ? await hashPassword(password) : undefined;

      const player = updatePlayer(id, {
        name,
        positionPreference,
        photoUrl,
        password: hashedPassword,
        isAdmin,
      });

      return NextResponse.json(player);
    } catch (error) {
      console.error('Failed to update player:', error);
      return NextResponse.json(
        { error: 'Failed to update player' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(requireAdmin, async () => {
    try {
      const { id } = await params;
      deletePlayer(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Failed to delete player:', error);
      return NextResponse.json(
        { error: 'Failed to delete player' },
        { status: 500 }
      );
    }
  });
}
