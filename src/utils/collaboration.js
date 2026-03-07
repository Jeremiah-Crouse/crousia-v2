// src/utils/collaboration.js
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// ----- Shared state -----
let doc = null;
let provider = null;
let lastSyncTime = 0;

// ----- Get or create Y.Doc -----
export const getSharedDoc = () => {
  if (!doc) {
    doc = new Y.Doc();
    console.log("📄 New Y.Doc created");
  }
  return doc;
};

// ----- Force reconnect and sync -----
export const forceReconnect = () => {
  if (provider) {
    console.log("🔄 Forcing reconnection...");
    provider.disconnect();
    provider.connect();
  }
};

// ----- Check if need to force sync on return -----
export const checkAndSync = () => {
  pass;
};

// ----- Create WebSocket Provider -----
export const getSharedProvider = ({ readonly = false, username = "guest" } = {}) => {
  if (!provider) {
    const doc = getSharedDoc();

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = 'admin.crousia.com';
    provider = new WebsocketProvider(`${protocol}://${host}/ysl`, "crousia-shared-room", doc, {
      connect: !readonly,
    });

    provider.on("status", (event) => console.log("🌟 Yjs Provider status:", event.status));
    provider.on("sync", (isSynced) => {
      console.log("🔗 Yjs Provider sync:", isSynced ? "✅ synced" : "❌ unsynced");
      if (isSynced) {
        lastSyncTime = Date.now();
      }
    });

    if (readonly) console.log("👀 Read-only mode active for this client");

    provider.awareness.setLocalStateField('user', {
      name: username,
      color: "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"),
    });
  }
  return provider;
};

// ----- Clear shared data -----
export const clearSharedData = async () => {
  if (doc) {
    // Instead of destroy, clear the contents
    doc.getMap('root').clear(); 
    // Or just reload
    window.location.reload();
  }
};

// ----- Check if user is admin -----
export const isAdmin = () => window.location.hostname.startsWith("admin.");
