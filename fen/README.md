# Frontier Exchange Network (FEN)

Player-owned trade corridors for EVE Frontier on Sui.

## What Is This?

FEN lets players create **trade corridors** — paired gates and depots that form profitable trade routes across the galaxy. Corridor operators earn by setting tolls and inventory spreads. Traders use corridors because they're liquid, profitable, and discoverable.

**A corridor = Gate A + Gate B + Depot A + Depot B + Treasury**

## Architecture

```
┌─────────────┐         ┌─────────────┐
│   Gate A    │◄───────►│   Gate B    │
│  (toll)     │  linked  │  (toll)     │
└──────┬──────┘         └──────┬──────┘
       │                       │
┌──────┴──────┐         ┌──────┴──────┐
│  Depot A    │         │  Depot B    │
│  (SSU)      │         │  (SSU)      │
│  buy/sell   │         │  buy/sell   │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────┐   ┌───────────┘
               ▼   ▼
          ┌──────────┐
          │ Treasury │
          │ (fees)   │
          └──────────┘
```

## Modules

| Module | Purpose |
|--------|---------|
| `config.move` | Shared config via dynamic fields |
| `toll_gate.move` | Gate extension: SUI toll + surge pricing + emergency lock |
| `depot.move` | SSU extension: trading pairs with ratios and fees |
| `corridor.move` | Registry linking gates + depots into trade routes |
| `treasury.move` | Pooled revenue collection and withdrawal |

## How It Works

### For Operators
1. Deploy and link two gates (using world contracts)
2. Deploy two SSUs at each gate endpoint
3. Register a corridor via `corridor::register_corridor`
4. Configure tolls via `toll_gate::set_toll_config`
5. Configure trading pairs via `depot::set_depot_config`
6. Stock depots with tradeable items
7. Collect revenue from treasury

### For Traders
1. Discover corridors via the dashboard
2. Pay toll at Gate A via `toll_gate::pay_toll_and_jump`
3. Trade items at Depot A or B via `depot::execute_trade`
4. Jump through linked gates using the JumpPermit

## Build

```bash
# Prerequisites: Sui CLI installed
# Reference contracts must be cloned alongside this repo
git clone https://github.com/evefrontier/world-contracts.git

# Build
cd fen
sui move build

# Test
sui move test
```

## Project Structure

```
eve-hackathon/
├── fen/                    # FEN extension package (this)
│   ├── sources/            # Move modules
│   ├── tests/              # Move tests
│   └── Move.toml
├── dashboard/              # React dApp (week 2)
├── scripts/                # Deployment scripts
└── world-contracts/        # Reference (gitignored, cloned separately)
```

## Hackathon Categories

- **Utility**: Real corridor economics — tolls, spreads, route planning
- **Technical**: Gate + SSU + registry + treasury + indexed dashboard
- **Creative**: Civilization through player-owned infrastructure
- **Live Integration**: Deploy one functioning corridor and show real traffic

## Related Issues

This project directly addresses:
- [evefrontier/world-contracts#44](https://github.com/evefrontier/world-contracts/issues/44) — Extension-managed inventory
- [evefrontier/world-contracts#45](https://github.com/evefrontier/world-contracts/issues/45) — Deposit receipts

## License

MIT
