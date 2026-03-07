// server-sync.js
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';

const port = 1234;
const internalPort = 5001; // Internal port for API requests
const ldb = new LeveldbPersistence('./crousia-db');

// Setup persistence
const persistence = {
  bindState: async (docName, ydoc) => {
    const persistedState = await ldb.getYDoc(docName);
    const stateVector = Y.encodeStateVector(persistedState);
    const diff = Y.encodeStateAsUpdate(ydoc, stateVector);
    Y.applyUpdate(ydoc, diff);
    ydoc.on('update', update => ldb.storeUpdate(docName, update));
  },
  writeState: async (docName, ydoc) => {}
};

// Internal API for archive-server to fetch state
const syncApi = express();
syncApi.get('/internal-state', async (req, res) => {
  const ydoc = await ldb.getYDoc('crousia-shared-room');
  res.send(Buffer.from(Y.encodeStateAsUpdate(ydoc)));
});
syncApi.listen(internalPort, '127.0.0.1');

const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { docName: 'crousia-shared-room', persistence });
});

server.listen(port, '0.0.0.0', () => console.log(`🚀 Sync Server on ${port}, Internal API on ${internalPort}`));