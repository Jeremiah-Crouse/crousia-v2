// src/utils/collaboration.js
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// ----- Shared state -----
let doc = null;
let provider = null;

// ----- Get or create Y.Doc -----
export const getSharedDoc = () => {
  if (!doc) {
    doc = new Y.Doc();
    console.log("📄 New Y.Doc created");
  }
  return doc;
};

// ----- Create WebSocket Provider -----
export const getSharedProvider = ({ readonly = false, username = "guest" } = {}) => {
  if (!provider) {
    const doc = getSharedDoc();

    // WebSocket Provider (central sync - server is source of truth)
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = 'admin.crousia.com';
    provider = new WebsocketProvider(`${protocol}://${host}/ysl`, "crousia-shared-room", doc, {
      connect: !readonly,
    });

    provider.on("status", (event) => console.log("🌟 Yjs Provider status:", event.status));
    provider.on("sync", (isSynced) =>
      console.log("🔗 Yjs Provider sync:", isSynced ? "✅ synced" : "❌ unsynced")
    );

    if (readonly) console.log("👀 Read-only mode active for this client");

    provider.userColor = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    provider.username = username;
  }
  return provider;
};

// ----- Clear shared data -----
export const clearSharedData = async () => {
  if (doc) {
    doc.destroy();
    doc = null;
    provider = null;
    console.log("🧹 Y.Doc destroyed");
  }
  window.location.reload();
};

// ----- Check if user is admin -----
export const isAdmin = () => window.location.hostname.startsWith("admin.");
