import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

let doc = null;
let provider = null;

export const getSharedDoc = () => {
  if (!doc) {
    doc = new Y.Doc();
    console.log('--- Yjs Doc Created ---');
  }
  return doc;
};

export const getSharedProvider = () => {
  if (!provider) {
    doc = getSharedDoc();
    provider = new WebsocketProvider('ws://localhost:8080', 'crousia-shared-room', doc);
    
    provider.on('status', event => {
      console.log('--- Yjs Provider status:', event.status);
    });
    
    console.log('--- Yjs Provider Created ---');
  }
  return provider;
};

if (typeof window !== 'undefined') {
  getSharedProvider();
}
