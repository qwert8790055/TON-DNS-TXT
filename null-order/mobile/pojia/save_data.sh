#!/usr/bin/env bash
# Archive and index pojia operation data.
# Called automatically at end of armor_break.sh, or standalone:
#   ./save_data.sh POJIA-20260905-140111
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
ARCHIVE_DIR="$DATA_DIR/archive"
INDEX_FILE="$DATA_DIR/index.json"
LATEST_DIR="$DATA_DIR/latest"

OPERATION_ID="${1:-}"
if [ -z "$OPERATION_ID" ]; then
  echo "Usage: $0 <OPERATION_ID>" >&2
  exit 1
fi

ARTIFACT_SRC="$SCRIPT_DIR/artifacts/$OPERATION_ID"
REPORT_GLOB="$REPO_ROOT/null-order/reports/NØ-OPERATION-破甲-${OPERATION_ID}.md"
REPORT_FILE=$(ls $REPORT_GLOB 2>/dev/null | head -1 || true)

mkdir -p "$ARCHIVE_DIR" "$LATEST_DIR"

if [ ! -d "$ARTIFACT_SRC" ]; then
  echo "[save] ERROR: artifacts not found: $ARTIFACT_SRC" >&2
  exit 1
fi

TIMESTAMP=$(date -Is)
ARCHIVE_NAME="${OPERATION_ID}.tar.gz"
ARCHIVE_PATH="$ARCHIVE_DIR/$ARCHIVE_NAME"

# ── Build manifest ─────────────────────────────────────────────────────────────
DEVICE_UUID=$(grep -m1 '^UUID:' "$ARTIFACT_SRC/01_recon.txt" 2>/dev/null | cut -d' ' -f2- || echo "")
DEVICE_NAME=$(grep -m1 '^Name:' "$ARTIFACT_SRC/01_recon.txt" 2>/dev/null | cut -d' ' -f2- || echo "")
IOS_VERSION=$(grep -m1 '^iOS:' "$ARTIFACT_SRC/01_recon.txt" 2>/dev/null | cut -d' ' -f2- || echo "")
FRIDA_VER=$(source "$REPO_ROOT/ios-re/venv/bin/activate" 2>/dev/null && frida --version 2>/dev/null || echo "unknown")

MANIFEST="$ARTIFACT_SRC/manifest.json"
python3 - <<PYEOF
import json, os, hashlib, datetime

op_id = "$OPERATION_ID"
artifact_dir = "$ARTIFACT_SRC"
files = {}
for fname in sorted(os.listdir(artifact_dir)):
    fpath = os.path.join(artifact_dir, fname)
    if os.path.isfile(fpath):
        with open(fpath, 'rb') as f:
            files[fname] = hashlib.sha256(f.read()).hexdigest()[:16]

manifest = {
    "operation_id": op_id,
    "saved_at": "$TIMESTAMP",
    "device": {
        "uuid": "$DEVICE_UUID" or None,
        "name": "$DEVICE_NAME" or None,
        "ios": "$IOS_VERSION" or None,
    },
    "tools": {"frida": "$FRIDA_VER"},
    "report": os.path.basename("$REPORT_FILE") if "$REPORT_FILE" else None,
    "archive": "$ARCHIVE_NAME",
    "artifacts": files,
}
with open("$MANIFEST", 'w') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print(json.dumps(manifest, ensure_ascii=False))
PYEOF

# ── Create tarball (artifacts + report + manifest) ────────────────────────────
TMP_PACK=$(mktemp -d)
cp -r "$ARTIFACT_SRC" "$TMP_PACK/"
[ -n "$REPORT_FILE" ] && [ -f "$REPORT_FILE" ] && cp "$REPORT_FILE" "$TMP_PACK/"
tar -czf "$ARCHIVE_PATH" -C "$TMP_PACK" .
rm -rf "$TMP_PACK"

# ── Update index.json ──────────────────────────────────────────────────────────
python3 - <<PYEOF
import json, os

index_path = "$INDEX_FILE"
entry = {
    "operation_id": "$OPERATION_ID",
    "saved_at": "$TIMESTAMP",
    "archive": "$ARCHIVE_NAME",
    "device_connected": bool("$DEVICE_UUID"),
    "report": os.path.basename("$REPORT_FILE") if "$REPORT_FILE" else None,
}

index = {"operations": [], "last_saved": None}
if os.path.exists(index_path):
    with open(index_path) as f:
        raw = json.load(f)
    if isinstance(raw, list):
        index["operations"] = raw
    elif isinstance(raw, dict):
        index = raw
        if "operations" not in index:
            index["operations"] = []

ops = [o for o in index.get("operations", []) if o.get("operation_id") != "$OPERATION_ID"]
ops.insert(0, entry)
index["operations"] = ops[:50]  # keep last 50
index["last_saved"] = "$OPERATION_ID"
index["updated_at"] = "$TIMESTAMP"

with open(index_path, 'w') as f:
    json.dump(index, f, indent=2, ensure_ascii=False)
PYEOF

# ── Sync latest snapshot ──────────────────────────────────────────────────────
rm -rf "$LATEST_DIR"/*
cp -r "$ARTIFACT_SRC"/* "$LATEST_DIR/"
[ -n "$REPORT_FILE" ] && [ -f "$REPORT_FILE" ] && cp "$REPORT_FILE" "$LATEST_DIR/report.md"
ln -sf "$ARCHIVE_PATH" "$LATEST_DIR/archive.tar.gz" 2>/dev/null || cp "$ARCHIVE_PATH" "$LATEST_DIR/archive.tar.gz"

echo "[save] Archived → $ARCHIVE_PATH"
echo "[save] Index    → $INDEX_FILE"
echo "[save] Latest   → $LATEST_DIR/"
