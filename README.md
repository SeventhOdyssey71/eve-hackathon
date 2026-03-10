# Frontier Exchange Network (FEN)

> Player-owned trade corridors for EVE Frontier — EVE Frontier x Sui 2026 Hackathon

## Overview

FEN enables players to build and operate **trade corridors** — paired smart gates and depots that form profitable trade routes across the galaxy. Operators earn SUI through tolls and inventory spreads. Traders discover corridors with the best rates and most liquidity.

**A corridor = Gate A + Gate B + Depot A + Depot B + Treasury**

```
┌─────────────┐         ┌─────────────┐
│   Gate A    │◄───────►│   Gate B    │
│  (toll)     │  linked  │  (toll)     │
└──────┬──────┘         └──────┬──────┘
       │                       │
┌──────┴──────┐         ┌──────┴──────┐
│  Depot A    │         │  Depot B    │
│  buy/sell   │         │  buy/sell   │
└──────┬──────┘         └──────┬──────┘
       └───────┐   ┌───────────┘
               ▼   ▼
          ┌──────────┐
          │ Treasury │
          │ (fees)   │
          └──────────┘
```

## Project Structure

```
eve-hackathon/
├── fen/                    # Sui Move extension package
│   ├── sources/
│   │   ├── config.move     # Shared config via dynamic fields + AdminCap
│   │   ├── toll_gate.move  # Gate extension: SUI toll, surge pricing, emergency lock
│   │   ├── depot.move      # SSU extension: trading pairs with ratios and fees
│   │   ├── corridor.move   # Registry linking gates + depots into trade routes
│   │   └── treasury.move   # Pooled revenue collection and withdrawal
│   └── tests/
│       └── fen_tests.move  # 20 tests covering all modules
│
├── dashboard/              # Next.js 15 operator dashboard
│   └── src/
│       ├── app/            # Routes: /, /corridors, /trade, /operate
│       ├── components/     # Sidebar, Header, StatsGrid, Charts
│       ├── hooks/          # Sui transaction hooks + data fetching
│       ├── lib/            # PTB builders, types, mock data, config
│       └── providers/      # Sui dApp Kit provider
│
└── scripts/                # Setup and deployment scripts
```

## Smart Contracts (Move)

Built as a **world-contracts extension package** using the typed witness pattern:

| Module | Extension | Description |
|--------|-----------|-------------|
| `toll_gate` | `TollAuth` on `Gate` | SUI toll payments, surge pricing (configurable multiplier), emergency lockdown |
| `depot` | `DepotAuth` on `StorageUnit` | Trading pairs with exchange ratios and basis-point fees |
| `corridor` | — | On-chain registry of trade routes with jump/trade/revenue counters |
| `treasury` | — | Pooled fee collection, recipient-only withdrawal |
| `config` | — | Shared `FenConfig` with dynamic field rules per gate/depot |

Events emitted for indexer: `TollPaidEvent`, `DepotTradeEvent`, `CorridorCreatedEvent`, `TreasuryDepositEvent`, etc.

### Build & Test

```bash
# Clone reference contracts
./scripts/setup.sh

# Build
cd fen && sui move build

# Run tests (20 tests, all passing)
sui move test
```

## Dashboard

Next.js 15 + React 19 + Tailwind CSS + `@mysten/dapp-kit`

| Route | Description |
|-------|-------------|
| `/` | Dashboard home: stats grid, 24h volume chart, recent activity |
| `/corridors` | Browse corridors: routes, depot pairs, revenue, status |
| `/corridors/[id]` | Corridor detail: gate-depot visualization, activity timeline |
| `/trade` | Trade route discovery: sortable by profit/liquidity, calculator |
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
5. Configure trading pairs: `depot::set_depot_config` (ratios, fees)
6. Stock depots with tradeable items
7. Collect revenue: `treasury::withdraw_all`

### For Traders
1. Discover corridors via dashboard (best rates, liquidity)
2. Pay toll at source gate: `toll_gate::pay_toll_and_jump`
3. Receive `JumpPermit` and jump through linked gates
4. Trade items at depots: `depot::execute_trade`

## Tech Stack

- **Smart Contracts**: Sui Move (edition 2024), extends `evefrontier/world-contracts`
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Wallet**: `@mysten/dapp-kit` + `@mysten/sui` v2
- **Charts**: Recharts
- **Icons**: Lucide React

## Hackathon Context

**EVE Frontier x Sui 2026** — "A Toolkit for Civilization"

This project is an **in-world mod** that adds trade corridor infrastructure to EVE Frontier. It directly addresses:
- [world-contracts#44](https://github.com/evefrontier/world-contracts/issues/44) — Extension-managed inventory
- [world-contracts#45](https://github.com/evefrontier/world-contracts/issues/45) — Deposit receipts for trustless trading

## License

MIT
