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
app.post('/api/archive-today', async (req, res) => {
  const rootType = sharedDoc.get('root');
  
  // Let's log the actual prototype of the object
  console.log('DEBUG: Prototype of root:', Object.getPrototypeOf(rootType).constructor.name);
  
  // If it's a Y.Map, let's list every single key it contains
  if (rootType.constructor.name === 'Map') {
      console.log('DEBUG: Map keys:', Array.from(rootType.keys()));
  }
  
  // If it's an XmlFragment, let's see its children
  if (rootType.constructor.name === 'XmlFragment') {
      console.log('DEBUG: XmlFragment child count:', rootType.length);
  }
  
  res.json({ status: "Check console logs" });
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