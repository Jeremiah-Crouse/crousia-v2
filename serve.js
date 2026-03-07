// serve.js
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { setupWSConnection } from "y-websocket/bin/utils";

const app = express();
const PORT = 5000;
const HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVES_DIR = '/root/crousia-v2/archives';
const PERSISTENCE_FILE = '/root/crousia-v2/crousia-db.bin';

if (!fs.existsSync(ARCHIVES_DIR)) fs.mkdirSync(ARCHIVES_DIR, { recursive: true });

// Memory-resident document
const sharedDoc = new Y.Doc();

// Persistence Wrapper: This mocks the LevelDB interface for y-websocket
const persistence = {
  bindState: async (docName, doc) => {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const persistedState = fs.readFileSync(PERSISTENCE_FILE);
      Y.applyUpdate(doc, persistedState);
    }
    doc.on('update', (update) => {
      const current = fs.existsSync(PERSISTENCE_FILE) ? fs.readFileSync(PERSISTENCE_FILE) : new Uint8Array();
      fs.writeFileSync(PERSISTENCE_FILE, Y.mergeUpdates([current, update]));
    });
  },
  writeState: async (docName, doc) => {
    fs.writeFileSync(PERSISTENCE_FILE, Y.encodeStateAsUpdate(doc));
  }
};

app.use(express.json());

// API Routes
app.post('/api/archive-today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const archivePath = path.join(ARCHIVES_DIR, `${today}.md`);
  const markdown = sharedDoc.getXmlText('content').toString();
  fs.writeFileSync(archivePath, markdown);
  res.json({ success: true, date: today, chars: markdown.length });
});

app.get('/api/archives', (req, res) => {
  const files = fs.readdirSync(ARCHIVES_DIR).filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')).reverse();
  res.json({ archives: files });
});

app.get('/api/archive/:date', (req, res) => {
  const { date } = req.params;
  const p = path.join(ARCHIVES_DIR, `${date}.md`);
  if (fs.existsSync(p)) res.json({ date, content: fs.readFileSync(p, 'utf-8') });
  else res.status(404).json({ error: 'Not found' });
});

app.use(express.static(path.join(__dirname, "dist")));
app.use((req, res) => res.sendFile(path.join(__dirname, "dist/index.html")));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/ysl')) {
    wss.handleUpgrade(request, socket, head, (conn) => wss.emit('connection', conn, request));
  }
});

wss.on("connection", (conn, req) => {
  setupWSConnection(conn, req, { 
    docName: "crousia-shared-room", 
    doc: sharedDoc,
    persistence: persistence 
  });
});

server.listen(PORT, HOST, () => console.log(`🚀 Server running on http://${HOST}:${PORT}`));