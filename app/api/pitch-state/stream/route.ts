import { NextRequest } from 'next/server';
import { getPitchState } from '@/lib/db/sqlite';

// Map of all active SSE connections
const clients = new Set<ReadableStreamDefaultController>();

// Notify all connected clients with the current pitch state
export function notifyClients() {
  const state = getPitchState();
  const data = `data: ${JSON.stringify(state)}\n\n`;
  const encoder = new TextEncoder();
  for (const ctrl of clients) {
    try {
      ctrl.enqueue(encoder.encode(data));
    } catch {
      clients.delete(ctrl);
    }
  }
}

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);

      // Send initial state on connect
      const state = getPitchState();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          clients.delete(controller);
        }
      }, 30_000);

      // Cleanup on disconnect
      _request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clients.delete(controller);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
