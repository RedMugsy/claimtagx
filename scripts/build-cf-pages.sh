#!/bin/sh
# Cloudflare Pages combined build script
# Builds both the marketing site and the handler app, then merges outputs
# so Cloudflare Pages can serve both from a single output directory.

set -e

echo "==> Building marketing site..."
pnpm --filter @workspace/claimtagx run build

echo "==> Building handler app (base path: /handler/)..."
BASE_PATH=/handler/ pnpm --filter @workspace/handler-app run build

echo "==> Merging handler app into marketing site dist..."
mkdir -p artifacts/claimtagx/dist/public/handler
cp -r artifacts/handler-app/dist/public/. artifacts/claimtagx/dist/public/handler/

echo "==> Done. Output: artifacts/claimtagx/dist/public"
