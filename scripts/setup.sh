#!/bin/bash
# FEN Development Setup
# Clones required reference repos if not present.

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

# Clone builder-documentation (reference)
if [ ! -d "$REPO_ROOT/builder-documentation" ]; then
    echo "Cloning builder-documentation..."
    git clone https://github.com/DionisisLougaris/builder-documentation.git "$REPO_ROOT/builder-documentation"
else
    echo "builder-documentation already present."
fi

# Clone eve-explorer (reference)
if [ ! -d "$REPO_ROOT/eve-explorer" ]; then
    echo "Cloning eve-explorer..."
    git clone https://github.com/DionisisLougaris/eve-explorer.git "$REPO_ROOT/eve-explorer"
else
    echo "eve-explorer already present."
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Build FEN:  cd contracts/fen && sui move build"
echo "Test FEN:   cd contracts/fen && sui move test"
