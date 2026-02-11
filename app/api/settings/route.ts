import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateMaxPlayers, getPlayerCount } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const settings = getSettings();
    const playerCount = getPlayerCount();
    return NextResponse.json({ ...settings, playerCount });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxPlayers } = body;

    if (typeof maxPlayers !== 'number' || maxPlayers < 1) {
      return NextResponse.json(
        { error: 'maxPlayers must be a positive number' },
        { status: 400 }
      );
    }

    const currentCount = getPlayerCount();
    if (maxPlayers < currentCount) {
      return NextResponse.json(
        { error: `Mevcut oyuncu sayısı (${currentCount}) yeni limitten (${maxPlayers}) fazla olamaz.` },
        { status: 400 }
      );
    }

    updateMaxPlayers(maxPlayers);
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
