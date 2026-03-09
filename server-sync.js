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

/// CRAZY

import { $getRoot } from 'lexical'; // not needed — pure JSON manipulation

function sanitizeLexicalNodes(node) {
  if (!node) return node;
  if (node.type === 'authored-text') {
    node.type = 'text';
    delete node.author;
  }
  if (Array.isArray(node.children)) {
    node.children = node.children.map(sanitizeLexicalNodes);
  }
  return node;
}

syncApi.post('/admin/sanitize-doc', async (req, res) => {
  try {
    const ydoc = await ldb.getYDoc('crousia-shared-room');
    const xmlFragment = ydoc.getXmlFragment('root'); // Lexical's default Yjs binding key

    // Lexical stores its state as a serialized JSON string inside a Yjs Text node
    const lexicalText = ydoc.getText('lexical');
    const raw = lexicalText.toString();

    if (!raw) {
      return res.json({ ok: true, message: 'No lexical text found, nothing to sanitize' });
    }

    const parsed = JSON.parse(raw);
    const sanitized = sanitizeLexicalNodes(parsed);
    
    // Replace the content in a single Yjs transaction
    ydoc.transact(() => {
      lexicalText.delete(0, lexicalText.length);
      lexicalText.insert(0, JSON.stringify(sanitized));
    });

    await ldb.storeUpdate('crousia-shared-room', Y.encodeStateAsUpdate(ydoc));
    res.json({ ok: true, message: 'Sanitized successfully' });
  } catch (err) {
    console.error('Sanitize failed:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

syncApi.get('/admin/inspect-doc', async (req, res) => {
  const ydoc = await ldb.getYDoc('crousia-shared-room');
  const keys = {
    texts: [...ydoc.share.entries()]
      .filter(([, v]) => v.constructor.name === 'Text')
      .map(([k]) => k),
    xmlFragments: [...ydoc.share.entries()]
      .filter(([, v]) => v.constructor.name === 'XmlFragment')
      .map(([k]) => k),
    maps: [...ydoc.share.entries()]
      .filter(([, v]) => v.constructor.name === 'Map')
      .map(([k]) => k),
  };
  res.json(keys);
});

/// CRAZY


server.listen(port, '0.0.0.0', () => console.log(`🚀 Sync Server on ${port}, Internal API on ${internalPort}`));