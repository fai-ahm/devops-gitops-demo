#!/usr/bin/env bash
# Generates light traffic so the Grafana graphs move during the demo.
# Needs the app port-forward running:
#   kubectl port-forward -n app svc/devops-app-service 8000:3000
# Usage: scripts/load.sh [base-url]     (Ctrl+C to stop)
set -u

URL="${1:-http://localhost:8000}"
DELAY="${DELAY:-0.2}"   # seconds between requests (~5 req/s)
POST_EVERY="${POST_EVERY:-20}"  # one POST every N requests

i=0; ok=0; fail=0
trap 'echo; echo "sent $i requests: $ok ok, $fail failed"; exit 0' INT TERM

echo "Sending traffic to $URL (GET /api/posts, a POST every $POST_EVERY requests). Ctrl+C to stop."
while true; do
  i=$((i + 1))
  if (( i % POST_EVERY == 0 )); then
    code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL/api/posts" \
      -H 'Content-Type: application/json' \
      -d "{\"content\":\"Load test post #$i at $(date +%H:%M:%S)\"}")
  else
    code=$(curl -s -o /dev/null -w '%{http_code}' "$URL/api/posts")
  fi

  if [[ "$code" =~ ^2 ]]; then ok=$((ok + 1)); else fail=$((fail + 1)); fi
  (( i % 50 == 0 )) && echo "$(date +%H:%M:%S)  $i requests  ok=$ok  failed=$fail  (last: HTTP $code)"
  sleep "$DELAY"
done
