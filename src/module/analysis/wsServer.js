import { WebSocketServer } from 'ws';

let wss = null;
let clients = new Set();

export function startWsServer(options = {}) {
  if (wss) return wss;
  // start standalone WebSocket server on port 3002 by default
  const port = options.port || 3002;
  wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WS] Client disconnected. Total:', clients.size);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error', err);
    });
  });

  console.log(`[WS] WebSocket server started on ws://0.0.0.0:${port}`);

  return wss;
}

export function broadcast(message) {
  const raw = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(raw);
    }
  }
}

export function broadcastAnalysis(payload) {
  broadcast({
    type: 'analytics_update',
    data: payload
  });
}
