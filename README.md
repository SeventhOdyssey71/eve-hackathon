# Frontier Exchange Network (FEN)

> The interstellar economic protocol for EVE Frontier — EVE Frontier x Sui 2026 Hackathon

## Overview

FEN is the **economic backbone** of EVE Frontier. It transforms isolated smart assemblies into a connected trade network with automated market making, multi-hop route discovery, and on-chain operator reputation.

**Operators** build profitable trade corridors. **Traders** discover optimal multi-hop routes. **The protocol** handles pricing, fees, and trust — autonomously.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Gate A    │◄───────►│   Gate B    │◄───────►│   Gate C    │
│  (toll)     │  hop 1   │  (toll)     │  hop 2   │  (toll)     │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
┌──────┴──────┐         ┌──────┴──────┐         ┌──────┴──────┐
│  Depot A    │         │  Depot B    │         │  Depot C    │
│  AMM Pool   │         │  AMM Pool   │         │  AMM Pool   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       └───────┐   ┌───────────┼───────────┐   ┌──────┘
               ▼   ▼           ▼           ▼   ▼
          ┌──────────┐    ┌──────────┐   ┌──────────┐
          │ Treasury │    │  Route   │   │Reputation│
          │ (fees)   │    │  Graph   │   │ Scores   │
          └──────────┘    └──────────┘   └──────────┘
```

### Key Innovations

1. **AMM Liquidity Pools** — First on-chain DEX for EVE Frontier items. Depots use constant-product pricing (`x * y = k`) for dynamic, supply-driven exchange rates. No more fixed ratios.

2. **Multi-Hop Route Graph** — Corridors form a directed graph. The protocol discovers optimal multi-hop routes across chained corridors — "Google Maps for interstellar trade."

3. **Operator Reputation** — On-chain trust scores computed from uptime, volume, fee fairness, and emergency lockdowns. Traders see who to trust before committing.

4. **DeepBook v3 Integration** — Native Sui CLOB integration enables multi-token toll payments, treasury revenue swaps, corridor market making with maker rebates, and on-chain price oracles.

## Project Structure

```
eve-hackathon/
├── fen/                         # Sui Move extension package (9 modules)
│   ├── sources/
│   │   ├── config.move          # Shared config via dynamic fields + AdminCap
│   │   ├── toll_gate.move       # Gate extension: SUI toll, surge pricing, emergency lock
│   │   ├── depot.move           # SSU extension: fixed-ratio trading pairs
│   │   ├── liquidity_pool.move  # AMM constant-product pricing engine
│   │   ├── corridor.move        # Registry linking gates + depots into trade routes
│   │   ├── route_graph.move     # Multi-hop route graph with adjacency lists
│   │   ├── reputation.move      # On-chain operator reputation scores
│   │   ├── treasury.move        # Pooled revenue collection and withdrawal
│   │   └── deepbook_adapter.move # DeepBook v3 CLOB integration
│   └── tests/
│       └── fen_tests.move       # 62 tests, 100% function coverage
│
├── docs/                        # PDF documentation (6 documents)
│   ├── 01_Project_Overview_and_Architecture.pdf
│   ├── 02_Smart_Contract_Documentation.pdf
│   ├── 03_DeepBook_DeFi_Integration.pdf
│   ├── 04_Testing_and_Quality_Assurance.pdf
│   ├── 05_Dashboard_and_Frontend.pdf
│   └── 06_Work_Log_and_Progress.pdf
│
├── dashboard/                   # Next.js 15 operator dashboard
│   └── src/
│       ├── app/                 # Routes: /, /corridors, /trade, /operate
│       ├── components/          # Sidebar, Header, StatsGrid, Charts
│       ├── hooks/               # Sui transaction hooks + data fetching
│       ├── lib/                 # PTB builders, types, mock data, config
│       └── providers/           # Sui dApp Kit provider
│
└── scripts/                     # Setup and deployment scripts
```

## Smart Contracts (Move)

Built as a **world-contracts extension package** using the typed witness pattern:

| Module | Type | Description |
|--------|------|-------------|
| `toll_gate` | `TollAuth` on `Gate` | SUI toll payments, surge pricing (configurable multiplier), emergency lockdown |
| `depot` | `DepotAuth` on `StorageUnit` | Fixed-ratio trading pairs with basis-point fees |
| `liquidity_pool` | AMM Engine | Constant-product (x*y=k) pricing, slippage protection, fee collection |
| `corridor` | Registry | On-chain corridor registry with jump/trade/revenue counters |
| `route_graph` | Network Graph | Bidirectional adjacency lists for multi-hop route discovery |
| `reputation` | Trust System | Composite scoring from uptime, volume, fees, and lockdown history |
| `treasury` | Revenue Pool | Pooled fee collection, recipient-only withdrawal |
| `config` | Config Layer | Shared `FenConfig` with dynamic field rules per gate/depot/pool |
| `deepbook_adapter` | DeFi Bridge | DeepBook v3 CLOB: swaps, orders, price oracle, balance management |

Events emitted for indexer: `TollPaidEvent`, `DepotTradeEvent`, `SwapEvent`, `CorridorCreatedEvent`, `ReputationUpdatedEvent`, `EdgeAddedEvent`, `TreasuryDepositEvent`, `ManagerLinkedEvent`, etc.

### Build & Test

```bash
# Clone reference contracts
./scripts/setup.sh

# Build
cd fen && sui move build

# Run tests (62 tests, all passing)
sui move test
```

## Dashboard

Next.js 15 + React 19 + Tailwind CSS + `@mysten/dapp-kit`

| Route | Description |
|-------|-------------|
| `/` | Dashboard home: stats grid, 24h volume chart, recent activity |
| `/corridors` | Browse corridors: routes, depot pairs, revenue, status |
| `/corridors/[id]` | Corridor detail: gate-depot visualization, activity timeline |
| `/trade` | Trade route discovery: sortable by profit/liquidity, dynamic calculator |
| `/operate` | Operator panel: toll/depot config, surge pricing, emergency controls, registration |

### Run

```bash
cd dashboard
pnpm install
pnpm dev
```

The dashboard runs in **mock mode** by default (env vars default to `0x0`). Set these in `.env.local` after deploying contracts:

```
NEXT_PUBLIC_FEN_PACKAGE_ID=0x...
NEXT_PUBLIC_CORRIDOR_REGISTRY_ID=0x...
NEXT_PUBLIC_FEN_CONFIG_ID=0x...
```

## How It Works

### For Operators
1. Deploy and link two gates (via world-contracts)
2. Deploy two SSUs at each gate endpoint
3. Register a corridor: `corridor::register_corridor`
4. Configure tolls: `toll_gate::set_toll_config` (per-gate pricing)
5. Choose pricing mode:
   - **Fixed ratio**: `depot::set_depot_config` (simple X:Y ratios)
   - **AMM pool**: `liquidity_pool::initialize_pool` (dynamic x*y=k pricing)
6. Stock depots with tradeable items
7. Reputation builds automatically from transaction history
8. Collect revenue: `treasury::withdraw_all`

### For Traders
1. Discover routes via dashboard (cheapest multi-hop paths, best AMM rates)
2. Check operator reputation scores
3. Pay toll at source gate: `toll_gate::pay_toll_and_jump`
4. Receive `JumpPermit` and jump through linked gates
5. Trade items at depots: `depot::execute_trade` or swap via AMM pool
6. Chain multiple corridors for multi-hop journeys

### AMM Pricing Example

```
Pool: 10,000 Crude Fuel (X) ↔ 5,000 Refined Fuel (Y)
k = 10,000 × 5,000 = 50,000,000

Trader swaps 1,000 Crude Fuel:
  → output = (1,000 × 5,000) / (10,000 + 1,000) = 454 Refined Fuel
  → Price impact: got 0.454/unit instead of 0.5/unit (9.1% slippage)

After trade: 11,000 Crude Fuel ↔ 4,546 Refined Fuel
  → New price shifted: 0.413 Refined per Crude (incentivizes reverse trade)
```

## Tech Stack

- **Smart Contracts**: Sui Move (edition 2024), extends `evefrontier/world-contracts` + DeepBook v3
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Wallet**: `@mysten/dapp-kit` + `@mysten/sui` v2
- **Charts**: Recharts
- **Icons**: Lucide React

## Hackathon Context

**EVE Frontier x Sui 2026** — "A Toolkit for Civilization"

FEN is the **civilization infrastructure layer** — the economic backbone that other mods build on top of. It directly addresses:

- [world-contracts#44](https://github.com/evefrontier/world-contracts/issues/44) — Extension-managed inventory (FEN depots manage SSU inventory autonomously via typed witness pattern)
- [world-contracts#45](https://github.com/evefrontier/world-contracts/issues/45) — Deposit receipts for trustless trading (FEN treasury + deposit events)
- Deploy script improvements for [PR #125](https://github.com/evefrontier/world-contracts/pull/125) — Multi-package deployment, better error handling

### What Makes FEN Different

| Feature | Before FEN | With FEN |
|---------|-----------|----------|
| Item pricing | Manual, off-chain negotiation | Automated AMM (x*y=k) |
| Route discovery | Trial and error | On-chain graph pathfinding |
| Operator trust | Reputation unknown | Composite on-chain scores |
| Multi-hop trade | Manual gate-by-gate | Chained corridors with route optimization |
| Gate economics | Free jumps only | Dynamic tolls with surge pricing |
| Revenue management | None | Pooled treasury with auditable withdrawal |
| DeFi integration | None | DeepBook v3 CLOB: swaps, orders, price oracle |

## License

MIT
