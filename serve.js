// serve.js
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import * as Y from "yjs";

const app = express();
const PORT = 5000;
const HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVES_DIR = '/root/crousia-v2/archives';

if (!fs.existsSync(ARCHIVES_DIR)) {
  fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
}

app.use(express.json());

// API Route: Archive Today
// This fetches the current Yjs state from server-sync.js (Port 5001)
app.post('/api/archive-today', async (req, res) => {
  try {
    // 1. Fetch the latest binary state snapshot from the sync server
    const response = await fetch('http://127.0.0.1:5001/internal-state');
    if (!response.ok) throw new Error("Could not reach sync server");
    
    const update = new Uint8Array(await response.arrayBuffer());
    
    // 2. Reconstruct document in memory
    const doc = new Y.Doc();
    Y.applyUpdate(doc, update);
    const markdown = doc.getXmlText('content')?.toString() || '';
    
    // 3. Save to disk
    const today = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVES_DIR, `${today}.md`);
    fs.writeFileSync(archivePath, markdown);
    
    console.log(`📦 Archived: ${today}.md - ${markdown.length} chars`);
    res.json({ success: true, date: today, chars: markdown.length });
  } catch (e) {
    console.error('Archive error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Existing API Routes
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
  const { date } = req.params;
  const p = path.join(ARCHIVES_DIR, `${date}.md`);
  if (fs.existsSync(p)) res.json({ date, content: fs.readFileSync(p, 'utf-8') });
  else res.status(404).json({ error: 'Not found' });
});

// Static Hosting
app.use(express.static(path.join(__dirname, "dist")));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

const server = http.createServer(app);
server.listen(PORT, HOST, () => {
  console.log(`🚀 Web/Archive Server running on http://${HOST}:${PORT}`);
});