# FEN Deployment — Sui Testnet

**Redeployed**: 2026-03-23 (v3 — compatible with world-contracts v0.0.21)
**Transaction**: `Hv21YEoA2PB1jtTMc367YRjbiQpPhEEED9mwXnQFr4RY`
**Deployer**: `0x33a514d95ba2f0a4cd334d00a7d82120af22ce51cf53f4b3d41026733fb48eeb`

## Package

| Key | Value |
|-----|-------|
| Package ID | `0xff753421606a061120d2fcd75df86fdb0682d78051e6e365ec2af81f0f56620a` |

## Shared Objects (created at publish)

| Object | ID |
|--------|----|
| CorridorRegistry | `0x2ec8e3f9be1952852fd6879005a580c705f25b57ad3077f9d369b355e807aa4c` |
| BalanceManagerRegistry | `0x11e2fcfbada5497ce9f28b1b76b806bbdab1bbf9134ed06f00bd32f32647ea3b` |

## Live Corridor: Helios Express

| Object | ID |
|--------|----|
| Corridor | `0x54392157ea30dc0503d36bfa9963514b1ba5a03d5c1fc2324077fc7e81224856` |
| OwnerCap | `0x829865996ded44f74f959ce18c14b771631695610517528637b8b96c0941e206` |

**Configuration:**
- Status: Active
- Source Gate toll: 0.1 SUI
- Dest Gate toll: 0.05 SUI
- Depot A: Crude Fuel (#78437) → Refined Fuel (#78515), 3:1, 2.5% fee (active)
- Depot B: Technocore (#84868) → Smart Parts (#88319), 1:5, 3% fee (active)
- AMM Pool (Depot A): Crude Fuel, 0.01 SUI / 1000 items, 1% fee (active)

## Compatibility

- Built against **world-contracts v0.0.21** (latest)
- Sui CLI **1.68.0** / protocol version **114**
- `withdraw_item` updated for new `quantity: u32` parameter

## Previous Deployments

| Version | Package ID | Date | Notes |
|---------|-----------|------|-------|
| v2 | `0x294fc90bf2c62a428ebed1a5e10406ef023b22a458881ef667b02af6e99d89af` | 2026-03-15 | Added liquidity_pool module |
| v1 | `0xb05f71abd959c6ffe9c5bb2a2bfb316d201f01dbca8c4508c59bb09efdc20f09` | 2026-03-10 | Initial deploy (no liquidity_pool) |
