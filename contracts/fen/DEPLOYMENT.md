# FEN Deployment — Sui Testnet

**Redeployed**: 2026-03-15 (v2 — adds `liquidity_pool` module)
**Transaction**: `EVWK9dUMrzkycKCVNmWYEH8KvYxHmx5TgEXcFw6yHuq4`
**Deployer**: `0x33a514d95ba2f0a4cd334d00a7d82120af22ce51cf53f4b3d41026733fb48eeb`

## Package

| Key | Value |
|-----|-------|
| Package ID | `0x294fc90bf2c62a428ebed1a5e10406ef023b22a458881ef667b02af6e99d89af` |

## Shared Objects (created at publish)

| Object | ID |
|--------|----|
| CorridorRegistry | `0x8cef4d30d52630f224b1b0909de1c6238264ba7ecdffb827313ff30592de7687` |
| BalanceManagerRegistry | `0xe3da17bc78ae8ce89bf8ecb3e3633234e4445390f10c4ce6962a88a897e6bfc0` |

## Owned Objects (deployer wallet)

| Object | ID |
|--------|----|
| UpgradeCap | `0xb3c96b8624ee264f9c59f8ae747042774e3e23a9bcdb135e9a782d0cef55134f` |

## Published Modules

`access`, `assembly`, `character`, `corridor`, `deepbook_adapter`, `depot`, `energy`, `fuel`, `gate`, `in_game_id`, `inventory`, `killmail`, **`liquidity_pool`**, `location`, `metadata`, `network_node`, `object_registry`, `sig_verify`, `status`, `storage_unit`, `toll_gate`, `treasury`, `world`

## Live Corridor: Helios Express

| Object | ID |
|--------|----|
| Corridor | `0x8fe8d1dcefae096f44ddc639af6c8ac2697071420432391359ef13b0fe0cc5bc` |
| OwnerCap | `0xa07666c570a37fe847200f5c3bf6070a251c155d85445dc8dfd835c0e24c9a58` |

**Configuration:**
- Status: Active
- Source Gate toll: 0.1 SUI
- Dest Gate toll: 0.05 SUI
- Depot A: Crude Fuel (#78437) → Refined Fuel (#78515), 3:1, 2.5% fee (active)
- Depot B: Technocore (#84868) → Smart Parts (#88319), 1:5, 3% fee (active)
- AMM Pool (Depot A): Crude Fuel, 0.5 SUI / 1000 items, 1% fee (active)

## Previous Deployment (v1 — no liquidity_pool)

| Key | Value |
|-----|-------|
| Package ID | `0xb05f71abd959c6ffe9c5bb2a2bfb316d201f01dbca8c4508c59bb09efdc20f09` |
| CorridorRegistry | `0xe01806aa7e0ebf3ea03140137b972b795f81059e654b53ee99c9711dc3ce1b2d` |
| BalanceManagerRegistry | `0x27d5587b2f07301e8e1694f00f06b6e0ebcc9274a9caa45180eb93b629852920` |
