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

run_step "Generate deterministic media fixtures" npm run fixtures:media
run_step "Foundation checks" npm run check
run_step "Render primary" npm run render -- projects/demo-product/project.json
run_step "Verify primary" npm run verify:render -- projects/demo-product/project.json
run_step "Render derivatives" npm run render:derivatives -- projects/demo-product/project.json
run_step "Verify media stack" npm run verify:media-stack -- projects/demo-product/project.json

test -f package-lock.json

echo
echo "PASS Video Studio local bootstrap"
echo "Primary: output/remotion-demo.mp4"
echo "Media stack: VERIFIED"
