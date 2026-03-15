#!/bin/bash
# FEN Development Setup
# Clones required dependencies if not present.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== FEN Development Setup ==="

# Clone world-contracts (required dependency for Move compiler)
if [ ! -d "$REPO_ROOT/world-contracts" ]; then
    echo "Cloning world-contracts..."
    git clone https://github.com/evefrontier/world-contracts.git "$REPO_ROOT/world-contracts"
else
    echo "world-contracts already present."
fi

# Clone evevault (EVE Frontier wallet — Chrome extension + web app)
if [ ! -d "$REPO_ROOT/evevault" ]; then
    echo "Cloning evevault..."
    git clone https://github.com/evefrontier/evevault.git "$REPO_ROOT/evevault"
    echo "Installing evevault dependencies..."
    cd "$REPO_ROOT/evevault" && bun install
    cd "$REPO_ROOT"
else
    echo "evevault already present."
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Build FEN:       cd contracts/fen && sui move build"
echo "Test FEN:        cd contracts/fen && sui move test"
echo "Dev dashboard:   cd dashboard && pnpm dev"
echo "Dev evevault:    cd evevault && bun run dev"
