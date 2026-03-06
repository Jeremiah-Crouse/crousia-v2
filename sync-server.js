import http from 'http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const port = 8080;
const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (conn, req) => {
  // Add this log to confirm the connection hit the server
  console.log('✅ Connection upgraded successfully!');
  setupWSConnection(conn, req);
});

server.listen(port, () => {
  console.log(`🚀 Sync Server live on port ${port}`);
});