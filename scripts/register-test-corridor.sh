#!/bin/bash
# Register a test corridor on Sui Testnet
# Uses the deployer wallet (angry-apatite / 0x33a514...)
# Run from repo root: bash scripts/register-test-corridor.sh

set -e

PKG="0xff753421606a061120d2fcd75df86fdb0682d78051e6e365ec2af81f0f56620a"
REGISTRY="0x2ec8e3f9be1952852fd6879005a580c705f25b57ad3077f9d369b355e807aa4c"
CLOCK="0x6"
DEPLOYER="0x33a514d95ba2f0a4cd334d00a7d82120af22ce51cf53f4b3d41026733fb48eeb"

# Placeholder Gate and SSU IDs (the contract stores these as IDs, doesn't validate they exist)
SOURCE_GATE="0x0000000000000000000000000000000000000000000000000000000000000001"
DEST_GATE="0x0000000000000000000000000000000000000000000000000000000000000002"
DEPOT_A="0x0000000000000000000000000000000000000000000000000000000000000003"
DEPOT_B="0x0000000000000000000000000000000000000000000000000000000000000004"

# Corridor name as hex bytes ("Helios Express")
NAME_HEX=$(echo -n "Helios Express" | xxd -p)

echo "=== Step 1: Register Corridor ==="
echo "Package: $PKG"
echo "Registry: $REGISTRY"

REGISTER_RESULT=$(sui client call \
  --package "$PKG" \
  --module corridor \
  --function register_corridor \
  --args "$REGISTRY" "$SOURCE_GATE" "$DEST_GATE" "$DEPOT_A" "$DEPOT_B" "$DEPLOYER" "0x$NAME_HEX" "$CLOCK" \
  --gas-budget 50000000 \
  --json 2>&1)

echo "$REGISTER_RESULT"

# Extract created object IDs
CORRIDOR_ID=$(echo "$REGISTER_RESULT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for obj in data.get('objectChanges', []):
    if obj.get('type') == 'created' and 'corridor::Corridor' in obj.get('objectType', ''):
        print(obj['objectId'])
        break
" 2>/dev/null || echo "PARSE_FAILED")

OWNER_CAP_ID=$(echo "$REGISTER_RESULT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for obj in data.get('objectChanges', []):
    if obj.get('type') == 'created' and 'CorridorOwnerCap' in obj.get('objectType', ''):
        print(obj['objectId'])
        break
" 2>/dev/null || echo "PARSE_FAILED")

echo ""
echo "Corridor ID: $CORRIDOR_ID"
echo "OwnerCap ID: $OWNER_CAP_ID"

if [ "$CORRIDOR_ID" = "PARSE_FAILED" ] || [ -z "$CORRIDOR_ID" ]; then
  echo "ERROR: Failed to parse corridor ID from result"
  exit 1
fi

echo ""
echo "=== Step 2: Set Toll Config (Source Gate: 0.1 SUI) ==="
sui client call \
  --package "$PKG" \
  --module toll_gate \
  --function set_toll_config \
  --args "$CORRIDOR_ID" "$OWNER_CAP_ID" "$SOURCE_GATE" "100000000" \
  --gas-budget 20000000

echo ""
echo "=== Step 3: Set Toll Config (Dest Gate: 0.05 SUI) ==="
sui client call \
  --package "$PKG" \
  --module toll_gate \
  --function set_toll_config \
  --args "$CORRIDOR_ID" "$OWNER_CAP_ID" "$DEST_GATE" "50000000" \
  --gas-budget 20000000

echo ""
echo "=== Step 4: Set Depot A Config (Crude Fuel → Refined Fuel, 3:1, 2.5% fee) ==="
sui client call \
  --package "$PKG" \
  --module depot \
  --function set_depot_config \
  --args "$CORRIDOR_ID" "$OWNER_CAP_ID" "$DEPOT_A" "78437" "78515" "3" "1" "250" \
  --gas-budget 20000000

echo ""
echo "=== Step 5: Set Depot B Config (Technocore → Smart Parts, 1:5, 3% fee) ==="
sui client call \
  --package "$PKG" \
  --module depot \
  --function set_depot_config \
  --args "$CORRIDOR_ID" "$OWNER_CAP_ID" "$DEPOT_B" "84868" "88319" "1" "5" "300" \
  --gas-budget 20000000

echo ""
echo "=== Step 6: Activate Depot A ==="
sui client call \
  --package "$PKG" \
  --module depot \
  --function activate_depot \
  --args "$CORRIDOR_ID" "$OWNER_CAP_ID" "$DEPOT_A" \
  --gas-budget 20000000

echo ""
echo "=== Step 7: Activate Depot B ==="
sui client call \
  --package "$PKG" \
  --module depot \
  --function activate_depot \
  --args "$CORRIDOR_ID" "$OWNER_CAP_ID" "$DEPOT_B" \
  --gas-budget 20000000

echo ""
echo "=== Step 8: Activate Corridor ==="
sui client call \
  --package "$PKG" \
  --module corridor \
  --function activate_corridor \
  --args "$CORRIDOR_ID" "$OWNER_CAP_ID" \
  --gas-budget 20000000

echo ""
echo "=== DONE ==="
echo "Corridor ID: $CORRIDOR_ID"
echo "OwnerCap ID: $OWNER_CAP_ID"
echo ""
echo "The corridor is now active with:"
echo "  - Source gate toll: 0.1 SUI"
echo "  - Dest gate toll: 0.05 SUI"
echo "  - Depot A: Crude Fuel → Refined Fuel (3:1, 2.5% fee)"
echo "  - Depot B: Technocore → Smart Parts (1:5, 3% fee)"
