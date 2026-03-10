# First Place Plan -- Frontier Exchange Network

**Goal**: Win the $15k + FanFest + $10k SUI overall first place
**Build period**: March 11-31 (21 days)
**Community voting**: April 1-15
**Bonus**: Deploying to live Stillness server in early April

---

## The Winning Formula

First place goes to the project that is **real, deep, and live**. Not the one with the most features on paper. Judges will ask three questions:

1. **Does it actually work?** Can I connect a wallet, do something, and see results on-chain?
2. **Is the technical implementation serious?** Real Move contracts, real tests, real architecture -- not a mockup?
3. **Would players actually use this?** Does it solve a problem people have in EVE Frontier?

Right now FEN has good bones (5 deployed Move modules, a dashboard) but nothing actually functions end-to-end. The plan below turns it from "impressive code that doesn't work" into "the project everyone votes for."

---

## Strategic Priorities (in order)

### Priority 1: Make it REAL (March 11-15)
No feature matters if the core flow doesn't work. Fix every bug, register a corridor, prove it live.

### Priority 2: Make it DEEP (March 16-22)
Add the AMM liquidity pool -- the single biggest differentiator. Build a FEN event indexer. This is where you pull ahead of projects that only have surface-level integration.

### Priority 3: Make it LIVE (March 23-27)
Deploy to Vercel. If possible, deploy assemblies on Stillness and demo real player interaction. Submit a PR to world-contracts for ecosystem credibility.

### Priority 4: Make it SHINE (March 28-31)
Polish the UI, record the demo video, write the submission, make it bulletproof.

---

## Week 1: Make It Real (March 11-15)

Everything this week is about making the existing system actually functional.

### Day 1 (March 11): Fix the Operate Page

**Morning -- Add useOwnerCaps hook**

The entire Operate page is broken because every transaction passes "0x0" as the CorridorOwnerCap. Fix this first.

```
New hook: useOwnerCaps()
- useSuiClientQuery("getOwnedObjects") filtered by type:
  `{packageId}::corridor::CorridorOwnerCap`
- Parse the `corridor_id` field from each cap
- Return Map<corridorId, ownerCapId>
```

Wire it into the Operate page so every action uses the real cap object. Remove all "0x0" hardcoding.

**Afternoon -- Add dynamic field reading**

Toll amounts, depot configs, and surge status all live in dynamic fields on Corridor objects. The dashboard doesn't read them.

```
After fetching each Corridor object:
- Call getDynamicFields(corridorId) to list field keys
- For each TollConfigKey: read toll_amount, surge_active, surge_numerator
- For each DepotConfigKey: read input_type_id, output_type_id, ratio_in, ratio_out, fee_bps, is_active
- Merge into the Corridor data model
```

This makes the Manage tab show real numbers instead of zeroes.

**Files to touch:**
- New: `dashboard/src/hooks/use-owner-caps.ts`
- Edit: `dashboard/src/hooks/use-corridors.ts` (add dynamic field reads)
- Edit: `dashboard/src/app/operate/page.tsx` (use real ownerCapId)

### Day 2 (March 12): End-to-End On-Chain Demo

**Morning -- Register a corridor via Sui CLI**

Use the deployer wallet to call register_corridor with test gate/depot IDs. This proves the contract works and gives the dashboard something to display.

```bash
sui client call --package $PKG --module corridor --function register_corridor \
  --args $REGISTRY $SOURCE_GATE $DEST_GATE $DEPOT_A $DEPOT_B $FEE_ADDR "[72,101,108,105,111,115]" 0x6
```

Then configure it:
1. set_toll_config on both gates
2. set_depot_config on both depots
3. activate_depot on both depots
4. activate_corridor

Verify the dashboard shows the corridor with correct data.

**Afternoon -- Fix the Create Corridor form**

Make the registration form actually work from the dashboard:
- Auto-fill Fee Recipient from connected wallet address
- Add form validation (name required, IDs must be 0x... format)
- After successful registration, switch to Manage tab and select the new corridor
- Show guided next steps: "Now configure your tolls..."

**Files to touch:**
- Edit: `dashboard/src/app/operate/page.tsx`

### Day 3 (March 13): Auto-Discover Assemblies

Operators shouldn't have to copy-paste raw hex IDs. Query their wallet for owned assemblies.

**Add useOwnedAssemblies hook**

```
useOwnedAssemblies():
- Query getOwnedObjects for type world::gate::Gate -> extract gate IDs and metadata
- Query getOwnedObjects for type world::storage_unit::StorageUnit -> extract SSU IDs
- Return { gates: [...], storageUnits: [...] }
```

Replace the raw text inputs in the Create Corridor form with dropdowns showing the user's owned gates and SSUs with human-readable names (from metadata dynamic fields).

**Also add: Assembly picker component**
- Shows object ID (abbreviated), type, and name
- Click to select
- Falls back to manual entry for advanced users

**Files to touch:**
- New: `dashboard/src/hooks/use-owned-assemblies.ts`
- New: `dashboard/src/components/AssemblyPicker.tsx`
- Edit: `dashboard/src/app/operate/page.tsx`

### Day 4 (March 14): Fix the Trade Page

The Trade page shows routes but with empty/default data because depot configs aren't being read.

**Morning -- Wire depot configs into trade routes**

Now that dynamic field reading works (Day 1), the Trade page should show:
- Real exchange ratios (e.g. "3 Crude Fuel -> 1 Refined Fuel")
- Real fee percentages
- Real toll costs per gate
- Whether depots are active or inactive

**Afternoon -- Build the trade execution flow**

Add a "Trade" button on each route that builds a PTB combining:
1. `toll_gate::pay_toll_and_jump` (pay toll, get JumpPermit)
2. `gate::jump_with_permit` (consume permit, jump)
3. `depot::execute_trade` (deposit input item, receive output)

This is a multi-step transaction in a single PTB. Show a confirmation modal with:
- Toll cost (in SUI)
- Expected output (item type + quantity)
- Fee deducted
- Total cost

**Files to touch:**
- Edit: `dashboard/src/app/trade/page.tsx`
- New: `dashboard/src/lib/transactions-trade.ts` (composite PTB builders)

### Day 5 (March 15): Fix README + Add Tests + Clean Up

**Morning -- Rewrite README**

The README currently claims features that don't exist (AMM, route graph, reputation, 62 tests). This destroys credibility. Rewrite it to:
- Accurately describe the 5 modules that exist
- Show real deployed addresses
- Include real test count
- Remove references to unbuilt modules
- Update project structure to match `contracts/fen/` path
- Add clear "Getting Started" section
- Add architecture diagram that matches reality

**Afternoon -- Add Move tests**

Current: 8 tests (5 corridor, 3 treasury)
Target: 20+ tests

Add tests for:
- toll_gate: set_toll_config, surge activate/deactivate, get_effective_toll
- depot: set_depot_config, activate/deactivate
- Integration: register corridor + set toll + pay toll flow
- Edge cases: empty name rejection, zero ratio rejection, double activate

**Files to touch:**
- Rewrite: `README.md`
- New: `contracts/fen/tests/toll_gate_tests.move`
- New: `contracts/fen/tests/depot_tests.move`

---

## Week 2: Make It Deep (March 16-22)

This is where you pull ahead of every other project. Two major features that no one else will have.

### Days 6-8 (March 16-18): AMM Liquidity Pool Module

This is THE differentiator. The first on-chain DEX for EVE Frontier items. Instead of fixed exchange ratios, depots can use dynamic pricing based on supply and demand.

**New module: `contracts/fen/sources/liquidity_pool.move`**

Core mechanics:
```
Pool { reserve_x: u64, reserve_y: u64, k: u128 }

Swap: output = (input * reserve_out) / (reserve_in + input)
Price impact grows with swap size relative to pool depth
Fee collected per swap (configurable basis points)
```

Functions needed:
- `initialize_pool(corridor, owner_cap, storage_unit_id, x_type_id, y_type_id, initial_x, initial_y, fee_bps)` -- create pool with initial liquidity
- `add_liquidity(corridor, owner_cap, storage_unit_id, x_amount, y_amount)` -- add more reserves
- `remove_liquidity(corridor, owner_cap, storage_unit_id, x_amount, y_amount)` -- withdraw reserves
- `swap(corridor, storage_unit, character, input_item, min_output, clock, ctx)` -- swap with slippage protection
- `get_quote(corridor, storage_unit_id, input_type_id, input_amount): (output_amount, price_impact, fee)` -- price oracle

Events:
- `PoolCreatedEvent`, `LiquidityAddedEvent`, `LiquidityRemovedEvent`, `SwapEvent`

Config stored as dynamic field on Corridor (same pattern as TollConfig/DepotConfig).

**Day 16**: Write the Move module + tests (aim for 10+ tests)
**Day 17**: Add PTB builders and hooks to dashboard
**Day 18**: Add AMM swap UI to Trade page (price chart, slippage settings, quote preview)

**Why this wins**: No other hackathon project will have an on-chain AMM for EVE items. The judges from Sui Foundation will recognize this as technically sophisticated. CCP judges will see it transforms the in-game economy.

### Days 9-10 (March 19-20): FEN Event Indexer

The eve-explorer indexes 29 event types using gRPC checkpoint streaming + Turso (cloud SQLite). Build a FEN-specific indexer that does the same for FEN events.

**New package: `indexer/`**

Architecture (mirror eve-explorer):
```
indexer/
  src/
    stream.ts       -- gRPC checkpoint listener (reuse @mysten/sui SuiGrpcClient)
    processor.ts     -- filter for FEN package events
    handlers/
      corridor.ts    -- CorridorCreatedEvent, CorridorStatusChangedEvent
      toll.ts        -- TollPaidEvent, TollConfigUpdatedEvent, SurgeActivated/Deactivated
      depot.ts       -- TradeExecutedEvent, DepotConfigUpdated, DepotActivated/Deactivated
      treasury.ts    -- TreasuryDepositEvent, TreasuryWithdrawEvent
      deepbook.ts    -- ManagerLinkedEvent, OrderPlacedEvent
      pool.ts        -- PoolCreatedEvent, SwapEvent, LiquidityAddedEvent
    db/
      schema.ts      -- Drizzle schema for FEN tables
      index.ts       -- Turso connection
  package.json
```

Tables:
- `corridors` -- latest state per corridor
- `toll_events` -- all toll payments (for revenue charts)
- `trade_events` -- all trades (for volume charts)
- `swap_events` -- AMM swaps (for price charts)
- `pool_state` -- current AMM pool reserves
- `indexer_state` -- checkpoint cursor

This gives the dashboard REAL time-series data instead of fake hourly charts. The volume chart, recent activity feed, and revenue tracking all become live.

**Day 19**: Set up indexer package, gRPC stream, processor, Turso schema
**Day 20**: Write handlers for all FEN events, connect dashboard to indexed data

**API endpoints the indexer powers:**
- `GET /api/corridors` -- all corridors with latest state
- `GET /api/corridors/:id/activity` -- time-series events
- `GET /api/stats` -- aggregate dashboard stats (total volume, revenue, jumps)
- `GET /api/pools/:id/price-history` -- AMM price over time

### Days 11-12 (March 21-22): Dashboard Data Layer Upgrade

Replace the current on-chain-only data fetching with indexed data. This makes the dashboard fast and rich.

**Day 21**: Connect dashboard to indexer API
- StatsGrid: real aggregate numbers from indexed data
- VolumeChart: real 24h time-series from toll_events + trade_events
- RecentActivity: real event feed from all FEN events
- TopCorridors: ranked by indexed volume/revenue

**Day 22**: Build AMM price chart
- Pool price over time (from swap_events)
- Current reserves display
- Liquidity depth visualization
- "Best routes" that account for AMM pricing + slippage

---

## Week 3: Make It Live + Polish (March 23-31)

### Days 13-14 (March 23-24): Deploy Everything

**Day 23 -- Deploy dashboard to Vercel**
- Set environment variables (FEN_PACKAGE_ID, CORRIDOR_REGISTRY_ID, indexer URL)
- Custom domain if possible (fen.xyz or similar)
- Verify all pages work with live testnet data
- Add og:image and meta tags for link previews

**Day 24 -- Live Stillness integration (if possible)**
- Connect to the EVE Frontier game client on Stillness testnet
- Deploy actual Gate and StorageUnit assemblies in-game
- Register a real corridor linking them
- Configure tolls, stock depots with items
- Have another player (or alt account) pay a toll and execute a trade
- Screenshot/record the entire flow

This hits the "Live Frontier Integration" category ($5k) directly. If you can show real player interaction, you are in a completely different tier from projects that only work on testnet with fake data.

### Days 15-16 (March 25-26): World-Contracts Contribution

Contributing back to the ecosystem shows you're not just building for the hackathon -- you're building for EVE Frontier.

**Option A: PR for Issue #44 (Extension-Managed Inventory)**
FEN depots are literally an implementation of this. Extract the pattern into a reusable module that other extensions can use. This is high-visibility because blurpesec (prolific contributor) authored the issue.

**Option B: PR for Issue #45 (Deposit Receipts)**
FEN treasury deposit events could be formalized into owned receipt objects. Write a small module that mints receipts on deposit.

**Option C: Documentation PR**
Write a "Building Extensions" tutorial based on what you learned building FEN. Reference real FEN code. This is lower effort but still valuable.

Pick ONE and do it well. A merged PR is gold. An open PR with good discussion is silver. Both beat not contributing.

### Day 17 (March 27): Comprehensive Test Suite

Target: 35+ Move tests, all passing

```
corridor_tests.move      -- 8 tests (existing 5 + 3 new edge cases)
toll_gate_tests.move     -- 8 tests (config, surge, effective toll calculation)
depot_tests.move         -- 8 tests (config, activate/deactivate, ratio validation)
liquidity_pool_tests.move -- 8 tests (create pool, swap, slippage, add/remove liquidity)
treasury_tests.move      -- 5 tests (existing 3 + 2 new)
```

Also add:
- Integration test: full flow (register -> configure -> activate -> trade)
- Negative tests: unauthorized access, overflow, zero amounts

### Days 18-19 (March 28-29): UI Polish

The dashboard should look like a real product, not a hackathon prototype.

**Day 28 -- Operator experience**
- Guided setup wizard: after registration, step through toll config -> depot config -> activation
- Real-time transaction status (pending -> confirmed with tx link)
- Revenue dashboard with charts (daily/weekly toll + trade revenue)
- Alert banners for corridors with issues (inactive, emergency locked, empty depots)

**Day 29 -- Trader experience**
- Trade route comparison table (sort by profit, liquidity, toll cost)
- AMM swap calculator with live price quote
- Slippage tolerance setting
- One-click "Pay Toll + Trade" composite transaction
- Trade history (from indexed events)

**Visual polish:**
- Loading skeletons instead of empty states
- Animated transitions between tabs
- Responsive layout (mobile-friendly)
- Toast notifications for transaction results
- Sui explorer links for all on-chain references

### Days 20-21 (March 30-31): Submission

**Day 30 -- Demo Video (2-3 minutes)**

Script:
```
0:00 - "FEN is the economic infrastructure layer for EVE Frontier"
0:15 - Show the problem: isolated assemblies, no trade network, manual negotiation
0:30 - Show the solution: connect wallet, register a corridor linking gates + depots
0:50 - Operator configures tolls and depot exchange rates (or AMM pool)
1:10 - Trader discovers routes, sees prices, executes a trade in one click
1:30 - Show on-chain: events on Sui explorer, toll payment, item transfer
1:50 - Show the indexer: live volume charts, activity feed, revenue tracking
2:10 - Show the AMM: dynamic pricing, slippage protection, price impact
2:30 - "FEN transforms isolated smart assemblies into a connected trade economy"
2:45 - Architecture overview: 7 Move modules, 35+ tests, event indexer, live dashboard
```

Record with screen capture. Clean browser (no bookmarks bar, no tabs). Use a high-res display.

**Day 31 -- Final Submission**

Checklist:
- [ ] All code committed and pushed
- [ ] README accurate and compelling
- [ ] Dashboard deployed to Vercel (live URL)
- [ ] Demo video uploaded
- [ ] Contracts verified on Sui explorer
- [ ] At least one corridor registered and active on testnet
- [ ] world-contracts PR submitted
- [ ] Submission form completed on deepsurge.xyz

---

## What You Ship (Summary)

### Smart Contracts (7 Move modules, 35+ tests)
| Module | Innovation |
|--------|-----------|
| `corridor.move` | Trade corridor registry with lifecycle management |
| `toll_gate.move` | Gate extension: SUI tolls with surge pricing, FenAuth typed witness |
| `depot.move` | SSU extension: fixed-ratio item exchange with fee collection |
| `liquidity_pool.move` | **First on-chain AMM for EVE items** -- constant-product pricing |
| `treasury.move` | Revenue pool with owner-gated withdrawals |
| `deepbook_adapter.move` | DeepBook v3 CLOB bridge for multi-token operations |

### Event Indexer
- gRPC checkpoint streaming (same architecture as eve-explorer)
- 6 event handlers covering all FEN contract events
- Turso (cloud SQLite) for persistent storage
- Powers time-series charts, activity feeds, and aggregate stats

### Dashboard (Next.js 15, deployed to Vercel)
| Feature | What It Shows |
|---------|--------------|
| Live stats | Total corridors, volume, revenue, jumps -- all from indexed data |
| Volume charts | Real 24h time-series from toll + trade events |
| AMM price charts | Pool price over time with liquidity depth |
| Corridor browser | All corridors with real toll/depot/status data from dynamic fields |
| Trade routes | Sortable by profit, with AMM quotes and one-click trade execution |
| Operator panel | Wallet-aware: auto-discovers your OwnerCaps and assemblies |
| Activity feed | Live event stream from all FEN contracts |

### Ecosystem Contribution
- PR to evefrontier/world-contracts (Issue #44 or #45)

---

## Category Coverage

| Category | How FEN Wins | Confidence |
|----------|-------------|------------|
| **Overall 1st** | Full-stack: contracts + indexer + dashboard + live demo | Target |
| **Utility** | Trade infrastructure every player needs | High |
| **Technical Implementation** | 7 Move modules, typed witness pattern, AMM, gRPC indexer, 35+ tests | Very High |
| **Live Frontier Integration** | Deployed dashboard + corridors on testnet + (ideal) Stillness demo | High if Stillness works |
| **Creative** | First on-chain AMM/DEX for EVE items, surge pricing, composite PTBs | Medium-High |

You can only win one category, but competing strongly in all of them is how you win Overall 1st.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| AMM module takes too long | Start with fixed-ratio depots (already working). AMM is additive, not blocking. |
| Can't access Stillness testnet | Focus on Sui testnet demo. Dashboard + testnet corridors still strong for Live Integration. |
| Indexer complexity | Start with polling approach (queryEvents), upgrade to gRPC stream if time. Dashboard works without indexer (just with less rich data). |
| world-contracts PR rejected/stale | A well-written open PR still shows ecosystem engagement. Don't need it merged. |
| Time crunch on polish | Week 1 deliverables alone make a top-3 project. Everything after is icing. |

---

## Daily Checklist

| Day | Date | Deliverable | Done? |
|-----|------|-------------|-------|
| 1 | Mar 11 | useOwnerCaps hook + dynamic field reading | |
| 2 | Mar 12 | Register corridor on testnet + fix Create form | |
| 3 | Mar 13 | Assembly auto-discovery + picker component | |
| 4 | Mar 14 | Trade page with real data + trade execution flow | |
| 5 | Mar 15 | Rewrite README + add 12 Move tests | |
| 6 | Mar 16 | AMM module: Move contract + tests (part 1) | |
| 7 | Mar 17 | AMM module: PTB builders + dashboard hooks | |
| 8 | Mar 18 | AMM swap UI + price quotes on Trade page | |
| 9 | Mar 19 | Event indexer: gRPC stream + processor + schema | |
| 10 | Mar 20 | Event indexer: handlers + connect to dashboard | |
| 11 | Mar 21 | Dashboard data layer upgrade (indexed data) | |
| 12 | Mar 22 | AMM price charts + best routes with AMM pricing | |
| 13 | Mar 23 | Deploy dashboard to Vercel | |
| 14 | Mar 24 | Stillness integration (if accessible) | |
| 15 | Mar 25 | world-contracts PR (Issue #44 or #45) | |
| 16 | Mar 26 | world-contracts PR continued + review | |
| 17 | Mar 27 | Comprehensive test suite (35+ tests) | |
| 18 | Mar 28 | UI polish: operator wizard + transaction UX | |
| 19 | Mar 29 | UI polish: trader UX + AMM calculator | |
| 20 | Mar 30 | Demo video recording | |
| 21 | Mar 31 | Final submission | |

---

## The One Thing That Matters Most

If you do nothing else, do this: **Make one corridor work end-to-end by Day 2.**

Register it. Configure tolls. Activate it. Have a second wallet pay a toll. See it on the dashboard. That single working demo is worth more than any amount of unfinished code. Everything else builds on that foundation.
