// serve.js
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";
import * as Y from "yjs";
import { LeveldbPersistence } from "y-leveldb";

const app = express();
const PORT = 5000;
const HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROOT_ROOT = '/data/data/com.termux/files/usr/var/lib/proot-distro/installed-rootfs/ubuntu/root';
const ARCHIVES_DIR = path.join(PROOT_ROOT, 'crousia-v2', 'archives');
const LDB_PATH = path.join(PROOT_ROOT, 'crousia-v2', 'crousia-db');

// Ensure directories
if (!fs.existsSync(ARCHIVES_DIR)) {
  fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
}

// Global persistence
let ldb;

async function initDatabase() {
  try {
    // Only initialize the instance. Do not call methods that create iterators here.
    ldb = new LeveldbPersistence(LDB_PATH);
    console.log('✅ LevelDB handler initialized.');
  } catch (err) {
    console.error('❌ Failed to initialize LevelDB:', err);
    process.exit(1);
  }
}

app.use(express.json());

function yjsDocToMarkdown(doc) {
  try {
    if (!doc) return '';
    const xmlText = doc.getXmlText('content');
    return xmlText ? xmlText.toString() : '';
  } catch (e) {
    console.error('Error converting doc to markdown:', e);
    return '';
  }
}

app.post('/api/archive-today', async (req, res) => {
  if (!ldb) return res.status(503).json({ error: "Database not ready." });

  try {
    const today = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVES_DIR, `${today}.md`);
    
    // getYDoc opens the iterator only when requested
    const ydoc = await ldb.getYDoc('crousia-shared-room');
    
    if (!ydoc) throw new Error("Could not retrieve document from LevelDB.");
    
    const markdown = yjsDocToMarkdown(ydoc);
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
  setupWSConnection(conn, req, { docName: "crousia-shared-room" });
});

// Final initialization
initDatabase().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  });
});