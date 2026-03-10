#!/usr/bin/env bash
set -euo pipefail

# Publish FEN Move package to Sui testnet
# Usage: ./scripts/publish.sh
#
# Prerequisites:
#   - sui CLI installed and configured
#   - Active address has testnet SUI (get from faucet: sui client faucet)
#   - sui client switch --env testnet

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building FEN package..."
cd "$PKG_DIR"
sui move build

echo ""
echo "Publishing to $(sui client active-env)..."
echo "Active address: $(sui client active-address)"
echo ""

# Publish and capture output
RESULT=$(sui client publish --gas-budget 500000000 --json 2>&1)

# Extract package ID from publish result
PACKAGE_ID=$(echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'published':
        print(change['packageId'])
        break
" 2>/dev/null || echo "")

if [ -z "$PACKAGE_ID" ]; then
    echo "Could not extract package ID from publish result."
    echo "Raw output:"
    echo "$RESULT"
    exit 1
fi

# Extract CorridorRegistry and BalanceManagerRegistry shared object IDs
REGISTRY_ID=$(echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and 'CorridorRegistry' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null || echo "")

BM_REGISTRY_ID=$(echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and 'BalanceManagerRegistry' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null || echo "")

echo ""
echo "========================================"
echo "FEN Package Published Successfully!"
echo "========================================"
echo ""
echo "Package ID:               $PACKAGE_ID"
echo "CorridorRegistry ID:      $REGISTRY_ID"
echo "BalanceManagerRegistry ID: $BM_REGISTRY_ID"
echo ""
echo "Add to your dashboard .env.local:"
echo ""
echo "  NEXT_PUBLIC_FEN_PACKAGE_ID=$PACKAGE_ID"
echo "  NEXT_PUBLIC_CORRIDOR_REGISTRY_ID=$REGISTRY_ID"
echo ""
