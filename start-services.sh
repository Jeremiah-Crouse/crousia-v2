#!/bin/bash
# ---------------------------------------
# Crousia V2 – Internal Ubuntu Launcher (non-blocking)
# ---------------------------------------

DIST_DIR="/root/crousia-v2/dist"
SERVE_SCRIPT="/root/crousia-v2/serve.js"
SYNC_SERVER="/root/crousia-v2/server-sync.js"
TUNNEL_UUID="8f48ffd5-c69c-4fe2-911b-d492d965d028"
LOG_DIR="/root/crousia-v2/logs"

mkdir -p "$LOG_DIR"

start_service() {
    local name="$1"
    local cmd="$2"
    local logfile="$3"

    echo "[*] Starting $name..."
    setsid bash -c "$cmd" > "$logfile" 2>&1 &
    echo $! > "$LOG_DIR/$name.pid"
    echo "[*] $name PID: $(cat $LOG_DIR/$name.pid)"
}

# Kill previous instances
pkill -f "serve.js" || true
pkill -f "server-sync.js" || true
pkill -f "cloudflared" || true

# Start services
start_service "React" "node '$SERVE_SCRIPT'" "$LOG_DIR/serve.log"
start_service "Yjs" "node '$SYNC_SERVER'" "$LOG_DIR/sync.log"
start_service "Tunnel" "cloudflared tunnel run '$TUNNEL_UUID'" "$LOG_DIR/tunnel.log"

echo "[*] All services started. Logs: $LOG_DIR"
