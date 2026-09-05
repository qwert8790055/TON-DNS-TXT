#!/usr/bin/env bash
# One-click pojia auto-run (repo root entry)
exec "$(cd "$(dirname "$0")" && pwd)/null-order/mobile/pojia/auto_run.sh" "$@"
