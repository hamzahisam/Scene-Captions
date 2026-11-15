#!/bin/sh
set -eu
label="$1"
out="artifacts/dhh-fixes/checks"
mkdir -p "$out"
npm run typecheck > "$out/$label-types.txt" 2>&1 || { cat "$out/$label-types.txt"; exit 1; }
npm test > "$out/$label-tests.txt" 2>&1 || { tail -90 "$out/$label-tests.txt"; exit 1; }
npm run build > "$out/$label-build.txt" 2>&1 || { tail -90 "$out/$label-build.txt"; exit 1; }
node scripts/verification/protected-check.mjs > "$out/$label-hashes.txt" 2>&1 || { cat "$out/$label-hashes.txt"; exit 1; }
printf '%s: types, tests, build and protected hashes passed\n' "$label"
