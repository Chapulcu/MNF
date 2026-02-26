import { NextRequest, NextResponse } from 'next/server';
import { getAllPlayers, createPlayer, isMaxPlayersReached, hashPassword, getSettings } from '@/lib/db/sqlite';
import { requireAdmin, withAuth } from '@/lib/utils/auth-guard';

export async function GET() {
  try {
    const players = getAllPlayers();
    return NextResponse.json(players);
  } catch (error) {
    console.error('Failed to get players:', error);
    return NextResponse.json({ error: 'Failed to get players' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(requireAdmin, async () => {
    try {
      const body = await request.json();
      const { name, positionPreference, photoUrl, password, isAdmin } = body;

      // Validate input
      if (!name || !positionPreference) {
        return NextResponse.json(
          { error: 'Name and positionPreference are required' },
          { status: 400 }
        );
      }

      // Check max players limit
      if (isMaxPlayersReached()) {
        const settings = getSettings();
        return NextResponse.json(
          { error: `Maksimum oyuncu sayısı (${settings.maxPlayers})'e ulaşıldı.` },
          { status: 400 }
        );
      }

      // Hash password if provided
      const hashedPassword = password ? await hashPassword(password) : null;

      const player = createPlayer({
        name,
        positionPreference,
        photoUrl: photoUrl || null,
        password: hashedPassword,
        isAdmin: isAdmin || false,
      });

      return NextResponse.json(player, { status: 201 });
    } catch (error) {
      console.error('Failed to create player:', error);
      return NextResponse.json(
        { error: 'Failed to create player' },
        { status: 500 }
      );
    }
  });
}
