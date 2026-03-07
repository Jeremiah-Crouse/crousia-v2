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

const ARCHIVES_DIR = path.join(__dirname, "archives");
const ldb = new LeveldbPersistence('./crousia-db');

if (!fs.existsSync(ARCHIVES_DIR)) {
  fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
}

app.use(express.json());

function yjsDocToMarkdown(doc) {
  try {
    const xmlText = doc.getXmlText('content');
    return xmlText.toString() || '';
  } catch (e) {
    console.error('Error converting doc to markdown:', e);
    return '';
  }
}

function clearYjsDoc() {
  const doc = new Y.Doc();
  const emptyState = Y.encodeStateAsUpdate(doc);
  ldb.storeUpdate('crousia-shared-room', emptyState);
  console.log('📄 Yjs doc cleared for new day');
}

app.post('/api/archive-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVES_DIR, `${today}.md`);
    
    const ydoc = await ldb.getYDoc('crousia-shared-room');
    const markdown = yjsDocToMarkdown(ydoc);
    
    fs.writeFileSync(archivePath, markdown);
    console.log(`📦 Archived: ${today}.md`);
    
    clearYjsDoc();
    
    res.json({ success: true, date: today });
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
      const content = fs.readFileSync(archivePath, 'utf-8');
      res.json({ date, content });
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
  if (req.path.startsWith('/ysl') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (conn, req) => {
  console.log("✅ Yjs WS connected!");
  setupWSConnection(conn, req, { docName: "crousia-shared-room" });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Yjs WS endpoint at ws://${HOST}:${PORT}/ysl`);
  console.log(`📚 Archives served at http://${HOST}:${PORT}/archives`);
});
