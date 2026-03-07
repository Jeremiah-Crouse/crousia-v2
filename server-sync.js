// server-sync.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Force the use of the root-level Yjs
const Y = require('/root/crousia-v2/node_modules/yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { LeveldbPersistence } = require('y-leveldb');
const { setPersistence } = require('y-websocket/bin/utils');

import http from 'http';
import { WebSocketServer } from 'ws';

const port = 1234;
const ldb = new LeveldbPersistence('./crousia-db');

setPersistence({
  bindState: async (docName, ydoc) => {
    const persistedState = await ldb.getYDoc(docName);
    const stateVector = Y.encodeStateVector(persistedState);
    const diff = Y.encodeStateAsUpdate(ydoc, stateVector);
    Y.applyUpdate(ydoc, diff);
    ydoc.on('update', update => ldb.storeUpdate(docName, update));
  },
  writeState: async (docName, ydoc) => {}
});

const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (conn, req) => {
  console.log('🔗 Client connected');
  setupWSConnection(conn, req, { docName: 'crousia-shared-room' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Yjs Sync Server live on port ${port}`);
});

