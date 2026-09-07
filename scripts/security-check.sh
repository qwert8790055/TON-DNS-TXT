#!/usr/bin/env bash
# Quick security health check for production deployment.
# Usage: bash scripts/security-check.sh

set -euo pipefail

TARGET="${TARGET:-http://135.181.228.18:8080}"
API="$TARGET/api"
VALID="EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"
PASS=0
FAIL=0

check() {
  local name="$1" result="$2" expected="$3"
  if [[ "$result" == "$expected" ]]; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name (got: $result, expected: $expected)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Security Health Check: $TARGET ==="
echo ""

# Frontend
code=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET/")
check "Frontend reachable" "$code" "200"

# API
code=$(curl -s -o /dev/null -w "%{http_code}" "$API/domains?wallet=$VALID")
check "API reachable" "$code" "200"

# CORS evil blocked
cors=$(curl -sD - -o /dev/null -H "Origin: https://evil.com" "$API/domains?wallet=$VALID" 2>&1 | grep -i "access-control-allow-origin:" || echo "none")
if [[ "$cors" == "none" ]] || [[ "$cors" != *"*"* ]]; then
  echo "  ✅ CORS evil origin blocked"
  PASS=$((PASS + 1))
else
  echo "  ❌ CORS allows evil origin: $cors"
  FAIL=$((FAIL + 1))
fi

# Input validation
resp=$(curl -s "$API/domains?wallet=invalid")
if echo "$resp" | grep -q "Invalid wallet"; then
  echo "  ✅ Input validation active"
  PASS=$((PASS + 1))
else
  echo "  ❌ Input validation missing"
  FAIL=$((FAIL + 1))
fi

# Security headers
headers=$(curl -sD - -o /dev/null "$TARGET/" 2>&1)
if echo "$headers" | grep -qi "x-content-type-options: nosniff"; then
  echo "  ✅ Security headers present"
  PASS=$((PASS + 1))
else
  echo "  ❌ Security headers missing"
  FAIL=$((FAIL + 1))
fi

# TonConnect manifest
manifest_url=$(curl -s "$TARGET/tonconnect-manifest.json" | grep -o '"url"[^,]*' || echo "")
if echo "$manifest_url" | grep -q "135.181.228.18"; then
  echo "  ✅ TonConnect manifest correct"
  PASS=$((PASS + 1))
else
  echo "  ❌ TonConnect manifest mismatch: $manifest_url"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
