// serve.js
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import WebSocket from "ws";

const app = express();
const PORT = 5000;
const HOST = "0.0.0.0";
const ARCHIVES_DIR = '/root/crousia-v2/archives';

if (!fs.existsSync(ARCHIVES_DIR)) fs.mkdirSync(ARCHIVES_DIR, { recursive: true });

// 1. The shared document, kept in sync by the provider
const sharedDoc = new Y.Doc();

// 2. Connect as a client to the binary sync server (port 1234)
// This keeps the sync binary as the "Owner" of the LevelDB lock
const provider = new WebsocketProvider(
  'ws://localhost:1234', 
  'crousia-shared-room', 
  sharedDoc,
  { WebSocketPolyfill: WebSocket }
);

app.use(express.json());

// 3. API Routes
// Add these to your serve.js, replacing the old ones
app.post('/api/archive-today', async (req, res) => {
  if (!provider.synced) {
    return res.status(503).json({ error: "Server sync in progress. Try again in a few seconds." });
  }

  const rootType = sharedDoc.get('root');
  // Use recursion to find text regardless of the Yjs type (Map/Array/Fragment)
  const extractText = (node) => {
    if (!node) return '';
    if (typeof node.toString === 'function' && node.constructor.name !== 'Doc') {
      const val = node.toString();
      if (val.length > 0) return val;
    }
    if (typeof node.toArray === 'function') {
      return node.toArray().map(extractText).join('\n');
    }
    return '';
  };

  const markdown = extractText(rootType);
  const today = new Date().toISOString().split('T')[0];
  const archivePath = path.join(ARCHIVES_DIR, `${today}.md`);
  
  fs.writeFileSync(archivePath, markdown);
  console.log(`📦 Archived: ${today}.md - ${markdown.length} chars`);
  res.json({ success: true, date: today, chars: markdown.length });
});

app.get('/api/debug-surgical', (req, res) => {
  const root = sharedDoc.get('root');
  const children = typeof root.toArray === 'function' ? root.toArray() : [];
  
  res.json({
    synced: provider.synced,
    type: root ? root.constructor.name : 'null',
    childCount: children.length,
    childTypes: children.slice(0, 5).map(c => c.constructor.name),
    isEmpty: sharedDoc.isEmpty
  });
});

app.get('/api/archives', (req, res) => {
  try {
    const files = fs.readdirSync(ARCHIVES_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .sort()
      .reverse();
    res.json({ archives: files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/archive/:date', (req, res) => {
  try {
    const { date } = req.params;
    const p = path.join(ARCHIVES_DIR, `${date}.md`);
    if (fs.existsSync(p)) {
      res.json({ date, content: fs.readFileSync(p, 'utf-8') });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add this check to your API routes
app.get('/api/status', (req, res) => {
  res.json({
    synced: provider.synced,
    isLocalEmpty: sharedDoc.isEmpty // True if it hasn't received data yet
  });
});

// 4. Static Hosting
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "dist")));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

const server = http.createServer(app);
server.listen(PORT, HOST, () => {
  console.log(`🚀 Federated Server running on http://${HOST}:${PORT}`);
});