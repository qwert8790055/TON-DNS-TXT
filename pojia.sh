#!/usr/bin/env bash
# One-click entry: scam report (no device) or pojia (authorized RE)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)/null-order/mobile/pojia"
if [ -f "$SCRIPT_DIR/case.env" ] && grep -q 'SCAM_APP_NAME=' "$SCRIPT_DIR/case.env" 2>/dev/null && \
   ! grep -q '请填写' "$SCRIPT_DIR/case.env" 2>/dev/null; then
  exec "$SCRIPT_DIR/scam_report.sh" --from "$SCRIPT_DIR/case.env"
else
  exec "$SCRIPT_DIR/auto_run.sh" "$@"
fi
