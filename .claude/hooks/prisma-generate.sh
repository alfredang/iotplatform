#!/usr/bin/env bash
# PostToolUse hook: regenerate the Prisma client whenever prisma/schema.prisma
# is edited, so the generated types stay in sync with the schema.
# Receives the tool-call JSON on stdin; only acts on schema.prisma edits.
set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | python3 -c 'import sys,json;
try:
    d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))
except Exception:
    print("")' 2>/dev/null || true)"

case "$file_path" in
  */prisma/schema.prisma|prisma/schema.prisma)
    cd "${CLAUDE_PROJECT_DIR:-.}"
    npx prisma generate >/dev/null 2>&1 && echo "[hook] prisma client regenerated" || true
    ;;
esac
