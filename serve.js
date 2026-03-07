// serve.js
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { setupWSConnection } from "y-websocket/bin/utils";
import { LeveldbPersistence } from "y-leveldb";
import { ClassicLevel } from "classic-level";

const app = express();
const PORT = 5000;
const HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVES_DIR = '/root/crousia-v2/archives';
const LDB_PATH = '/root/crousia-v2/crousia-db';

if (!fs.existsSync(ARCHIVES_DIR)) {
  fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
}

// Memory-resident document for high-performance non-iterator access
const sharedDoc = new Y.Doc();
let ldb;

app.use(express.json());

// API Routes
app.post('/api/archive-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVES_DIR, `${today}.md`);
    
    // Accessing directly from memory - Bypasses iterator/disk I/O entirely
    const xmlText = sharedDoc.getXmlText('content');
    const markdown = xmlText ? xmlText.toString() : '';
    
    fs.writeFileSync(archivePath, markdown);
    console.log(`📦 Archived: ${today}.md - ${markdown.length} chars`);
    
    res.json({ success: true, date: today, chars: markdown.length });
  } catch (e) {
    console.error('Archive error:', e);
    res.status(500).json({ error: "Failed to archive from memory" });
  }
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
    const archivePath = path.join(ARCHIVES_DIR, `${date}.md`);
    if (fs.existsSync(archivePath)) {
      res.json({ date, content: fs.readFileSync(archivePath, 'utf-8') });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/archives', express.static(ARCHIVES_DIR));
app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res, next) => {
  if (req.path.startsWith('/ysl') || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/ysl')) {
    wss.handleUpgrade(request, socket, head, (conn) => {
      wss.emit('connection', conn, request);
    });
  }
});

wss.on("connection", (conn, req) => {
  console.log("✅ Yjs WS connected!");
  setupWSConnection(conn, req, { docName: "crousia-shared-room", doc: sharedDoc });
});

async function startServer() {
  try {
    console.log('DEBUG: Initializing and Hydrating from LevelDB...');
    const db = new ClassicLevel(LDB_PATH);
    ldb = new LeveldbPersistence(LDB_PATH, { db });
    
    // HYDRATION: Pull from disk once at startup
    // We fetch the document once; subsequent operations use the in-memory sharedDoc
    const persistedDoc = await ldb.getYDoc('crousia-shared-room');
    Y.applyUpdate(sharedDoc, Y.encodeStateAsUpdate(persistedDoc));
    
    console.log('✅ Memory hydrated, LevelDB ready.');
    
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('❌ FATAL: Initialization failed:', err);
    process.exit(1);
  }
}

startServer();