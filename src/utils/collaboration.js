import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb'; // Import this
import * as Y from 'yjs';

let doc = null;
let provider = null;
let persistence = null; // Track persistence

export const getSharedDoc = () => {
  if (!doc) {
    doc = new Y.Doc();

    doc.on('update', (update) => {
        // Log all updates to see what's happening
        // 'crousia-shared-room' is the room name
        console.log('--- Yjs Update Size:', update.length);
        console.log('--- Doc Content keys:', Array.from(doc.share.keys()));
    });

    console.log('--- Yjs Doc Created ---');
  }
  return doc;
};

export const getSharedProvider = () => {
  if (!provider) {
    doc = getSharedDoc();
    provider = new WebsocketProvider('ws://localhost:8080', 'crousia-shared-room', doc);
    
    // Add persistence here
    persistence = new IndexeddbPersistence('crousia-shared-room', doc);
    
    persistence.on('synced', () => {
        console.log('--- Yjs Content loaded from IndexedDB ---');
    });

    provider.on('status', event => {
      console.log('--- Yjs Provider status:', event.status);
    });
    
    console.log('--- Yjs Provider Created ---');
  }
  return provider;
};

export const clearSharedData = async () => {
  if (persistence) {
    await persistence.clearData();
    console.log('--- Yjs IndexedDB cleared ---');
  }
  if (doc) {
    // Optionally clear in-memory doc
    doc.destroy();
    doc = null;
    provider = null;
    persistence = null;
    console.log('--- Yjs Doc destroyed ---');
  }
  window.location.reload(); // Reload to re-initialize fresh
};

if (typeof window !== 'undefined') {
  getSharedProvider();
}

