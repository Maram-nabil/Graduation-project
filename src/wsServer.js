import { WebSocketServer } from 'ws';

let wss;

export function startWsServer({ port }) {
  wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    console.log('🟢 WebSocket client connected');

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket server is working'
    }));
  });

  console.log(`[WS] WebSocket server started on ws://localhost:${port}`);
}

export function broadcast(data) {
  if (!wss) return;

  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

