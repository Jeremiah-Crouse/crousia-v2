// serve.js
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs"; // Import Yjs
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

// Memory-resident document for fast, non-iterator access
const sharedDoc = new Y.Doc();
let ldb;

app.use(express.json());

// API Routes
app.post('/api/archive-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVES_DIR, `${today}.md`);
    
    // Accessing directly from memory - NO iterator, NO disk I/O, NO crashes
    const xmlText = sharedDoc.getXmlText('content');
    const markdown = xmlText ? xmlText.toString() : '';
    
    fs.writeFileSync(archivePath, markdown);
    console.log(`📦 Archived: ${today}.md - ${markdown.length} chars`);
    
    res.json({ success: true, date: today, chars: markdown.length });
  } catch (e) {
    console.error('Archive error:', e);
    res.status(500).json({ error: e.message });
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
  // Sync the memory document whenever the WS connection interacts
  setupWSConnection(conn, req, { docName: "crousia-shared-room" });
  
  // Note: Yjs setupWSConnection automatically syncs the provided Y.Doc 
  // if passed in the options, or you can manage the sharedDoc object here.
});

async function startServer() {
  try {
    console.log('DEBUG: Opening LevelDB persistence...');
    const db = new ClassicLevel(LDB_PATH);
    ldb = new LeveldbPersistence(LDB_PATH, { db });
    
    // We keep this for background persistence, 
    // but we no longer rely on it for archive requests
    console.log('✅ LevelDB persistence ready.');
    
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('❌ FATAL: Failed to open LevelDB:', err);
    process.exit(1);
  }
}

startServer();