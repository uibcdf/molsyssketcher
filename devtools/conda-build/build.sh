#!/usr/bin/env bash
set -euo pipefail

test "$(node --version)" = "v24.22.1"
test "$(npm --version)" = "11.19.1"
npm ci --cache "${SRC_DIR}/.npm-cache"
npm run check
node devtools/stage-conda-assets.mjs "${PREFIX}" "${PKG_VERSION}"
