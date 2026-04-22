#!/bin/sh
# Cloudflare Pages combined build script
# Builds both the marketing site and the handler app, then merges outputs
# so Cloudflare Pages can serve both from a single output directory.

set -e

echo "==> Building marketing site..."
pnpm --filter @workspace/claimtagx run build

echo "==> Done. Output: artifacts/claimtagx/dist/public"
