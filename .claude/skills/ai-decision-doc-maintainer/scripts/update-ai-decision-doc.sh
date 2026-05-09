#!/usr/bin/env bash
set -euo pipefail

DOC_DIR="${1:-docs/ai-agent-decision-tree}"
MD_FILE="${DOC_DIR}/matrice-decision-claude-copilot-homelab.md"
D2_FILE="${DOC_DIR}/decision-tree.d2"
SVG_FILE="${DOC_DIR}/decision-tree.svg"
PNG_FILE="${DOC_DIR}/decision-tree.png"

echo "== AI decision documentation maintenance =="
echo "DOC_DIR=${DOC_DIR}"

if [[ ! -f "${MD_FILE}" ]]; then
  echo "ERROR: Markdown file not found: ${MD_FILE}" >&2
  exit 1
fi

if [[ ! -f "${D2_FILE}" ]]; then
  echo "ERROR: D2 file not found: ${D2_FILE}" >&2
  exit 1
fi

if grep -q "shape: note" "${D2_FILE}"; then
  echo "ERROR: D2 file contains unsupported shape: note" >&2
  echo "Replace it with shape: rectangle and style.stroke-dash: 4" >&2
  exit 1
fi

if ! grep -q "decision-tree.svg" "${MD_FILE}"; then
  echo "ERROR: Markdown file does not reference ./decision-tree.svg" >&2
  echo "Add this block near the top:" >&2
  echo "## Diagramme de décision" >&2
  echo "![Arbre de décision Claude Code / Copilot / homelab](./decision-tree.svg)" >&2
  exit 1
fi

if ! command -v d2 >/dev/null 2>&1; then
  echo "ERROR: d2 command not found." >&2
  echo "Install D2, then run:" >&2
  echo "  d2 ${D2_FILE} ${SVG_FILE}" >&2
  echo "  d2 ${D2_FILE} ${PNG_FILE}" >&2
  exit 1
fi

echo "Generating SVG..."
d2 "${D2_FILE}" "${SVG_FILE}"

echo "Generating PNG..."
d2 "${D2_FILE}" "${PNG_FILE}"

echo "Checking generated files..."
test -f "${SVG_FILE}"
test -f "${PNG_FILE}"

echo "OK: generated ${SVG_FILE}"
echo "OK: generated ${PNG_FILE}"
