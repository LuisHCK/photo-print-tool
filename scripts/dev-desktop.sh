#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cleanup() {
  if [ -n "$VITE_PID" ]; then
    kill "$VITE_PID" 2>/dev/null || true
    wait "$VITE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting Vite dev server..."
bun dev &
VITE_PID=$!

echo "Waiting for dev server at http://localhost:5173..."
for i in $(seq 1 30); do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Dev server ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Timed out waiting for dev server."
    exit 1
  fi
  sleep 0.5
done

echo "Building desktop app..."
cmake -B "$ROOT_DIR/desktop/build" -S "$ROOT_DIR/desktop"
cmake --build "$ROOT_DIR/desktop/build"

echo "Launching Photo Print Tool..."
"$ROOT_DIR/desktop/build/photo-print" "http://localhost:5173"
