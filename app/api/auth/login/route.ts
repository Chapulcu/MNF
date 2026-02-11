import { NextRequest, NextResponse } from 'next/server';
import { loginPlayer, getSession } from '@/lib/db/sqlite';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, password } = body;

    if (!playerId || !password) {
      return NextResponse.json(
        { error: 'Oyuncu ID ve şifre gerekli' },
        { status: 400 }
      );
    }

    const result = loginPlayer(playerId, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Giriş başarısız' },
        { status: 401 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session_id', result.sessionId || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      player: {
        id: result.player?.id,
        name: result.player?.name,
        isAdmin: result.player?.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false });
    }

    const sessionData = getSession(sessionId);

    if (!sessionData) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      player: {
        id: sessionData.player.id,
        name: sessionData.player.name,
        isAdmin: sessionData.player.isAdmin,
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Oturum doğrulanırken hata oluştu' },
      { status: 500 }
    );
  }
}
