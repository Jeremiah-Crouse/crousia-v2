// Remove the forceReconnect and checkAndSync logic entirely.
// Yjs handles reconnection automatically when the network state changes.

export const checkAndSync = () => {
  // Do nothing. Delete the manual disconnect/connect calls.
  console.log("🔄 Sync handled automatically by Yjs.");
};