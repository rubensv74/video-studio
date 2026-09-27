#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

run_step() {
  local name="$1"
  shift
  echo
  echo "==> $name"
  "$@"
}

run_step "Environment check" node scripts/check-env.mjs

if [[ -f package-lock.json ]]; then
  run_step "Install dependencies from lockfile" npm ci --no-audit --no-fund
else
  run_step "Initial dependency install" npm install --no-audit --no-fund
fi

run_step "Foundation checks" npm run check
run_step "Render demo" npm run render -- projects/demo-product/project.json
run_step "Verify rendered media" npm run verify:render -- projects/demo-product/project.json

test -f package-lock.json

echo
echo "PASS VS-G02 local bootstrap"
echo "Output: output/remotion-demo.mp4"
echo "Lockfile: package-lock.json"
