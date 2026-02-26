import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSession, Player } from '@/lib/db/sqlite';

/**
 * Verifies the session cookie and returns the player.
 * Throws a 401 NextResponse if not authenticated.
 */
export async function requireAuth(): Promise<Player> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    throw NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
  }

  const sessionData = getSession(sessionId);
  if (!sessionData) {
    throw NextResponse.json({ error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' }, { status: 401 });
  }

  return sessionData.player;
}

/**
 * Verifies the session cookie and ensures the player is an admin.
 * Throws a 401 or 403 NextResponse otherwise.
 */
export async function requireAdmin(): Promise<Player> {
  const player = await requireAuth();

  if (!player.isAdmin) {
    throw NextResponse.json({ error: 'Bu işlem için admin yetkisi gereklidir.' }, { status: 403 });
  }

  return player;
}

/**
 * Helper to wrap a route handler with auth guard error handling.
 * Usage: return withAuth(requireAdmin, async (player) => { ... });
 */
export async function withAuth(
  guard: () => Promise<Player>,
  handler: (player: Player) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const player = await guard();
    return await handler(player);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
