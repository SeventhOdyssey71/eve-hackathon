# Frontier Exchange Network (FEN)

> Player-owned trade corridors for EVE Frontier on Sui

**EVE Frontier x Sui 2026 Hackathon** | Theme: *A Toolkit for Civilization* | 6 Move modules | 152 tests | Deployed on Sui testnet

**Categories**: Utility, Technical Implementation, Live Frontier Integration

## Overview

FEN turns isolated smart assemblies into a connected trade network. Operators link two gates and two depots into a **corridor**, set toll prices and exchange rates, and earn revenue from every jump and trade. Traders discover the best routes and execute trades through the dashboard.

FEN includes the **first on-chain AMM (automated market maker) for EVE Frontier items** -- constant-product (x*y=k) pools where items trade against SUI with dynamic pricing, slippage protection, and configurable fees.

```
  Source Gate ──────── Jump Link ──────── Dest Gate
  (toll: 0.1 SUI)                        (toll: 0.05 SUI)
       │                                       │
   Depot A                                 Depot B
   (Crude → Refined                    (Refined → Crude
    3:1, 2% fee)                        1:2, 1.5% fee)
       │                                       │
       └────────── Treasury (SUI) ─────────────┘
                   (owner withdraws)
```

## Deployed on Sui Testnet

| Component | ID |
|-----------|-----|
| Package (v4 Utopia) | `0x4c2f4a85fdf9667aca3c877b71b112dd017dab2824c251b9291f407b033a441a` |
| CorridorRegistry (Utopia) | `0x6cb994308037d32961623b5a198365155108b6c1dc2a36df4680bd4be2dea6d3` |
| BalanceManagerRegistry (Utopia) | `0x50495a9ed1e8205ecb5d9c05730ac3a398d1a2099f546445de14f232321f0df4` |
| Live Corridor: Odyssey Express | `0x6f5c71b7714bf2ef663685e6fa08aaa011885fa793062203bb65e177e74d8eb1` |
| **Package (Stillness)** | `0x9063f530b8efe37ede0d1163862a54f609622aa794e6a23b10f4b529de40aa06` |
| CorridorRegistry (Stillness) | `0xf146755edc53b206a5d03b6e4d5b7a52201f6f9c9d20e9b6fadda87ab52cb665` |
| BalanceManagerRegistry (Stillness) | `0xe7b1d23eed593b35387ac5a3f2e04ed32959fd85c4b79ce8dd7acdc243f48935` |

**Live Dashboard:** [https://fen-tan.vercel.app](https://fen-tan.vercel.app)

See [DEPLOYMENT.md](contracts/fen/DEPLOYMENT.md) for all object IDs.

## Project Structure

```
eve-hackathon/
├── contracts/fen/              # Sui Move extension package
│   ├── sources/
│   │   ├── corridor.move       # Corridor registry + lifecycle (shared objects, OwnerCap)
│   │   ├── toll_gate.move      # Gate toll extension: SUI payments, surge pricing
│   │   ├── depot.move          # SSU exchange extension: item-for-item trading
│   │   ├── treasury.move       # Revenue pool with owner-gated withdrawals
│   │   ├── liquidity_pool.move # Constant-product AMM: Items <-> SUI DEX
│   │   └── deepbook_adapter.move # DeepBook v3 balance manager bridge
│   └── tests/
│       ├── corridor_tests.move          # 15 tests: register, activate, emergency, fee update
│       ├── toll_gate_tests.move         # 15 tests: config, surge pricing, effective toll math
│       ├── depot_tests.move             # 19 tests: config, activation, ratios, fees, status
│       ├── treasury_tests.move          # 8 tests: create, deposit/withdraw, overflow
│       ├── liquidity_pool_tests.move    # 45 tests: AMM math, pool lifecycle, swaps, liquidity
│       └── deepbook_adapter_tests.move  # 10 tests: link/unlink managers, order recording
│
├── dashboard/                  # Next.js 15 operator dashboard
│   └── src/
│       ├── app/                # Routes: /, /corridors, /trade, /swap, /operate
│       ├── components/         # Sidebar, Header, StatsGrid, Charts, AssemblyPicker
│       ├── hooks/              # On-chain data, OwnerCap discovery, assembly discovery
│       ├── lib/                # PTB builders, types, config
│       └── providers/          # Sui dApp Kit provider
│
└── docs/                       # Documentation
```

## Smart Contracts (6 Move Modules)

Built as a **world-contracts extension package** using the typed witness pattern (`FenAuth`):

| Module | What It Does |
|--------|-------------|
| `corridor` | Shared corridor registry with `Table<ID, CorridorInfo>`. Each corridor links 2 gates + 2 depots. Mints `CorridorOwnerCap` on registration. Tracks jump/trade/revenue counters. |
| `toll_gate` | Extends `world::gate` with SUI toll collection. Per-gate `TollConfig` stored as dynamic field on Corridor. Surge pricing with configurable multiplier. Issues `JumpPermit` via `FenAuth` witness after payment. |
| `depot` | Extends `world::storage_unit` with item-for-item exchange. Per-depot `DepotConfig` stored as dynamic field. Configurable input/output types, exchange ratio, and basis-point fee. |
| `treasury` | Shared SUI `Balance` pool linked to a corridor. Owner-gated partial and full withdrawals. |
| `liquidity_pool` | **Constant-product AMM** -- the first on-chain DEX for EVE Frontier items. SUI-denominated pools (Items <-> SUI) with configurable fees, slippage protection, price impact calculation, and liquidity management. Stored as `PoolConfig` dynamic field on Corridor. |
| `deepbook_adapter` | Links DeepBook v3 balance managers to corridors. Event-based order tracking. |

### Key Events

`CorridorCreatedEvent`, `CorridorStatusChangedEvent`, `TollPaidEvent`, `TollConfigUpdatedEvent`, `SurgeActivatedEvent`, `SurgeDeactivatedEvent`, `TradeExecutedEvent`, `DepotConfigUpdatedEvent`, `DepotActivatedEvent`, `DepotDeactivatedEvent`, `PoolCreatedEvent`, `SwapEvent`, `LiquidityChangedEvent`, `ManagerLinkedEvent`, `OrderPlacedEvent`

### Build & Test

```bash
cd contracts/fen
sui move build
sui move test    # 152 tests, all passing
```

## Dashboard

Next.js 15 + React 19 + Tailwind CSS + `@mysten/dapp-kit` + `@mysten/sui` v2

| Route | Description |
|-------|-------------|
| `/` | Stats grid, volume chart, recent activity, top corridors |
| `/corridors` | Browse all corridors with status, revenue, jump/trade counts |
| `/corridors/[id]` | Gate-depot visualization, toll/surge display, activity timeline |
| `/trade` | Trade route discovery with sortable table and cost calculator |
| `/swap` | AMM swap interface: sell items for SUI or buy items with SUI, real-time price impact, slippage protection |
| `/operate` | Operator panel: register corridors, configure tolls/depots, emergency controls |
| `/activity` | Real-time event explorer with type filters (jumps, trades, swaps, config changes) |
| `/rankings` | Leaderboards — top corridors by revenue, jumps, trades |
| `/authorize` | Extension setup — authorize FEN on gates and SSUs (3-step borrow pattern) |

### Key Features

- **AMM DEX** -- constant-product swap interface with live price impact, slippage settings, and pool stats
- **OwnerCap discovery** -- auto-detects `CorridorOwnerCap` objects from connected wallet
- **Assembly auto-discovery** -- finds owned Gates and Storage Units for the registration form
- **Dynamic field reading** -- displays real TollConfig, DepotConfig, and PoolConfig from on-chain dynamic fields
- **Ownership-aware UI** -- disables controls for corridors you don't own
- **Event-based corridor discovery** -- uses `CorridorCreatedEvent` + `multiGetObjects` since registry uses `Table`

### Run

```bash
cd dashboard
pnpm install
pnpm dev
```

Environment variables (defaults point to deployed testnet package):
```
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_EVE_TENANT=utopia
NEXT_PUBLIC_FEN_PACKAGE_ID=0x4c2f4a85fdf9667aca3c877b71b112dd017dab2824c251b9291f407b033a441a
NEXT_PUBLIC_CORRIDOR_REGISTRY_ID=0x6cb994308037d32961623b5a198365155108b6c1dc2a36df4680bd4be2dea6d3
```

For external-browser usage, the official docs use tenant routing with query params such as `?tenant=utopia` or `?tenant=stillness`. The dashboard now defaults to `utopia` and preserves tenant selection in the header.

## How It Works

### For Operators
1. Deploy and link two gates in EVE Frontier (via world-contracts)
2. Deploy two SSUs at each gate endpoint
3. Connect wallet on the dashboard, go to Operate > Create New
4. Select your gates and depots (auto-discovered from wallet)
5. Register the corridor (mints a CorridorOwnerCap to your wallet)
6. Configure tolls per gate: `toll_gate::set_toll_config`
7. Configure depots (exchange ratio, item types, fee): `depot::set_depot_config`
8. Activate depots and the corridor
9. Revenue flows to your fee recipient address
10. Withdraw anytime: `treasury::withdraw_all`

### For Traders
1. Browse routes on the Trade page (sorted by rate, toll cost)
2. Use the calculator to estimate output for a given input quantity
3. Pay toll at source gate: `toll_gate::pay_toll_and_jump` (sends SUI, issues JumpPermit)
4. Trade at depot: `depot::execute_trade` (deposit input item, receive output item)

## Architecture

### Extension Pattern

FEN uses the typed-witness pattern from world-contracts:

```move
// FenAuth witness authorizes gate jumps and SSU deposits/withdrawals
public struct FenAuth has drop {}

// Only FEN logic can issue jump permits for FEN-authorized gates
gate::issue_jump_permit<FenAuth>(source, dest, character, FenAuth {}, expiry, ctx);

// Only FEN logic can move items in FEN-authorized storage units
storage_unit::deposit_item<FenAuth>(su, character, item, FenAuth {}, ctx);
```

### Dynamic Field Config

Toll, depot, and pool configs are stored as dynamic fields on Corridor objects:

```
Corridor (shared object)
  ├── TollConfigKey { gate_id: source } => TollConfig { toll_amount, surge_active, surge_numerator }
  ├── TollConfigKey { gate_id: dest }   => TollConfig { ... }
  ├── DepotConfigKey { su_id: depot_a } => DepotConfig { ratio_in, ratio_out, fee_bps, is_active, ... }
  ├── DepotConfigKey { su_id: depot_b } => DepotConfig { ... }
  ├── PoolConfigKey { su_id: depot_a }  => PoolConfig { reserve_sui, reserve_items, fee_bps, ... }
  └── PoolConfigKey { su_id: depot_b }  => PoolConfig { ... }
```

This allows the corridor owner to update configs without redeploying, and any reader can query them via `getDynamicFieldObject`.

## Tech Stack

- **Smart Contracts**: Sui Move (edition 2024), extends `evefrontier/world-contracts`
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Wallet**: `@mysten/dapp-kit` + `@mysten/sui` v2
- **Charts**: Recharts
- **Icons**: Lucide React

## Hackathon Context

**EVE Frontier x Sui 2026** -- "A Toolkit for Civilization"

FEN is trade infrastructure that other mods build on top of. It directly addresses open needs in the EVE Frontier ecosystem:

- [world-contracts#44](https://github.com/evefrontier/world-contracts/issues/44) -- Extension-managed inventory (FEN depots manage SSU inventory via typed witness)
- [world-contracts#45](https://github.com/evefrontier/world-contracts/issues/45) -- Deposit receipts for trustless trading (FEN treasury + events)

### Why FEN Matters

| Before FEN | With FEN |
|-----------|----------|
| Manual off-chain item negotiation | On-chain depot exchange with configured ratios |
| No automated market making | Constant-product AMM (x*y=k) with Items <-> SUI pools |
| Free jumps only | Dynamic tolls with surge pricing |
| No revenue model for gate operators | Toll + trade fee + AMM fee revenue with treasury |
| No visibility into exchange rates | Dashboard shows all rates, tolls, fees, and AMM prices |
| Raw Sui object IDs to interact | Assembly auto-discovery from wallet |

### What Ships

| Component | Details |
|-----------|---------|
| Smart Contracts | 6 Move modules (corridor, toll_gate, depot, treasury, liquidity_pool, deepbook_adapter) |
| Test Suite | 87 Move tests, all passing |
| Dashboard | Next.js 15 with 8 routes: home, corridors, corridor detail, trade, swap, operate, activity, rankings |
| Deployment | Sui testnet with live "Odyssey Express" corridor (real EVE assemblies, tolls + depots + AMM pool, working swaps) |
| Wallet Integration | @mysten/dapp-kit with OwnerCap auto-discovery and assembly picker |
| On-chain Data | Event-based corridor discovery, dynamic field reading for configs, real-time activity feed |

## License

MIT
