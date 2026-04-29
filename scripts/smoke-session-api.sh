#!/usr/bin/env bash
# Smoke test: session start + GET session (requires built server: npm run build)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="${TMPDIR:-/tmp}/originer-smoke-$$.sqlite"
PORT="${SMOKE_PORT:-4099}"
export DATABASE_PATH="$DB"
export PORT="$PORT"

cleanup() {
  rm -f "$DB" 2>/dev/null || true
  if [[ -n "${PID:-}" ]]; then
    kill "$PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "$ROOT"
node dist/src/server.js &
PID=$!
sleep 1

START=$(curl -s -X POST "http://127.0.0.1:${PORT}/api/v1/sessions/start" \
  -H "Content-Type: application/json" \
  -d '{"instructor_id":"default","learner_id":"anonymous"}')

SID=$(node -e "const j=JSON.parse(process.argv[1]);\
 if(!j.success||!j.data?.session?.id) process.exit(1);\
 console.log(j.data.session.id)" "$START")

GET=$(curl -s "http://127.0.0.1:${PORT}/api/v1/sessions/${SID}")
node -e "const j=JSON.parse(process.argv[1]);\
 if(!j.success||j.data.session.id!==process.argv[2]) process.exit(1)" "$GET" "$SID"

echo "smoke-session-api: OK"
