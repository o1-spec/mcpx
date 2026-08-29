#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# MCPx Development Environment Bootstrap Script
# ==============================================================================

echo "=========================================="
echo "⚡ Bootstrapping MCPx Development Platform"
echo "=========================================="

# 1. Check Prerequisites
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required for PostgreSQL persistence."; exit 1; }

# 2. Setup Environment Variables
if [ ! -f .env ]; then
  echo "📄 Creating root .env from .env.example..."
  cp .env.example .env
fi

if [ ! -f apps/mcpx-web/.env ]; then
  echo "📄 Creating apps/mcpx-web/.env..."
  cp .env.example apps/mcpx-web/.env
fi

# 3. Start PostgreSQL Container
echo "🐘 Starting PostgreSQL control plane on port 5435..."
docker compose up -d postgres

# 4. Wait for PostgreSQL Readiness
echo "⏳ Waiting for PostgreSQL to accept connections..."
until docker compose exec postgres pg_isready -U mcpx -d mcpx_control >/dev/null 2>&1; do
  sleep 1
done
echo "✓ PostgreSQL is ready!"

# 5. Install Dependencies
echo "📦 Installing workspace dependencies..."
pnpm install

echo "=========================================="
echo "✓ MCPx bootstrap complete!"
echo "Run 'pnpm dev' to launch all WebMCP services and the control plane."
echo "=========================================="
