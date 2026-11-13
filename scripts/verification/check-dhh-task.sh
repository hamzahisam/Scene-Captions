#!/bin/sh
set -eu
label="$1"
mkdir -p artifacts/dhh-ux-checks
npm run typecheck > "artifacts/dhh-ux-checks/$label-types.txt" 2>&1 || { cat "artifacts/dhh-ux-checks/$label-types.txt"; exit 1; }
npm test > "artifacts/dhh-ux-checks/$label-tests.txt" 2>&1 || { tail -65 "artifacts/dhh-ux-checks/$label-tests.txt"; exit 1; }
npm run build > "artifacts/dhh-ux-checks/$label-build.txt" 2>&1 || { tail -65 "artifacts/dhh-ux-checks/$label-build.txt"; exit 1; }
printf '%s: types, tests and build passed\n' "$label"
