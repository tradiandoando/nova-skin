#!/usr/bin/env bash
# NOVA Skin — QA local (sin dependencias externas).
# Uso:  bash tools/check.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== NOVA Skin QA ==="

# 1) Validador Python puro (sin npm)
python3 tools/validate.py

# 2) Sintaxis JS (requiere node, pero no npm)
for f in content.js popup.js; do
  node --check "$f" && echo "  OK    $f (sintaxis JS)" || echo "  FAIL  $f"
done

echo ""
echo "=== FIN ==="