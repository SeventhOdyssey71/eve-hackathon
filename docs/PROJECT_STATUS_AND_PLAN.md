# FEN Project Status and Action Plan

**Date**: March 10, 2026
**Hackathon deadline**: March 31, 2026
**Package deployed**: `0xb05f71abd959c6ffe9c5bb2a2bfb316d201f01dbca8c4508c59bb09efdc20f09` (Sui testnet)

---

## 1. What Exists Today

### Move Contracts (5 modules, deployed to testnet)

| Module | What It Does | Status |
|--------|-------------|--------|
| `corridor.move` | Registry of trade corridors. Each corridor links 2 gates + 2 depots. Creates shared Corridor objects and mints CorridorOwnerCap to the registrant. Tracks jump/trade/revenue counters. | Deployed, tested (5 tests) |
| `toll_gate.move` | Extends `world::gate` with SUI toll payments. Operator sets a toll amount per gate. Players pay the toll to get a JumpPermit. Supports surge pricing (configurable multiplier). Uses FenAuth typed-witness pattern. | Deployed, untested in integration |
| `depot.move` | Extends `world::storage_unit` with item-for-item exchange. Operator sets input/output item types, exchange ratio, and fee (basis points). Players deposit input items and receive output items. | Deployed, untested in integration |
| `treasury.move` | Standalone SUI balance pool per corridor. Deposits, partial withdraws, full withdraws. Owner-gated. | Deployed, tested (3 tests) |
| `deepbook_adapter.move` | Links DeepBook v3 balance managers to corridors. Records order events for dashboard display. | Deployed, no integration tests |

### Dashboard (Next.js 15, all pages built)

| Page | What It Does | Status |
|------|-------------|--------|
| `/` (Home) | Stats grid, 24h volume chart, recent activity feed, top corridors | Reads on-chain events. Chart shows zeroes (no activity yet). |
| `/corridors` | Browse all corridors with status, revenue, jump/trade counts | Discovers corridors via CorridorCreatedEvent + multiGetObjects |
| `/corridors/[id]` | Single corridor detail: gates, depots, activity timeline | Reads corridor object fields |
| `/trade` | Trade route discovery: sortable table, profit calculator | Pulls from corridor data, but depot configs show defaults (not reading dynamic fields) |
| `/operate` | Operator panel: register corridor, manage tolls/depots, emergency controls, withdraw revenue | **Forms exist but OwnerCap is hardcoded to "0x0" -- no transaction will succeed** |

### Tests
- 8 Move tests passing (5 corridor lifecycle, 3 treasury operations)
- No frontend tests

---

## 2. What Does NOT Work Yet

### Critical Bugs

**A. OwnerCap hardcoded to "0x0"**

Every operator action in the dashboard passes `"0x0"` as the `ownerCapId`:
```typescript
// operate/page.tsx
withdrawAll(corridor.id, "0x0")
emergencyLock(corridor.id, "0x0")
activateCorridor(corridor.id, "0x0")
setTollConfig(corridor.id, "0x0", gateId, amount)
```

On-chain, every one of these functions requires a real `CorridorOwnerCap` object:
```move
public fun activate_corridor(corridor: &mut Corridor, owner_cap: &CorridorOwnerCap, ...) {
    assert!(owner_cap.corridor_id == object::id(corridor), ENotOwner);
```

With `"0x0"`, the transaction will abort immediately. **The entire Operate page is non-functional.**

Fix: Query the connected wallet's owned objects filtered by type `{packageId}::corridor::CorridorOwnerCap`, map each cap's `corridor_id` field to the corridor it controls, and pass the real cap object ID into transactions.

**B. TollConfig and DepotConfig not read from chain**

Toll amounts, surge status, depot ratios, and fee percentages are stored as dynamic fields on Corridor objects (keyed by `TollConfigKey { gate_id }` and `DepotConfigKey { storage_unit_id }`). The dashboard does NOT read these dynamic fields -- it shows hardcoded defaults (0 tolls, empty depots).

Fix: After fetching corridor objects, use `getDynamicFields` + `getDynamicFieldObject` to read TollConfig and DepotConfig for each gate/depot ID referenced in the corridor.

**C. No corridors exist on-chain**

The CorridorRegistry has `corridor_count: 0`. No one has called `register_corridor` yet, so the dashboard shows empty state on every page. There is no proof the system works end-to-end.

Fix: Register at least one corridor on testnet using the Sui CLI or the dashboard itself (after fixing OwnerCap discovery).

### README vs Reality Mismatch

The README claims features that do not exist in the codebase:

| README Claims | Reality |
|--------------|---------|
| 9 modules | 5 modules exist |
| 62 tests | 8 tests exist |
| `liquidity_pool.move` -- AMM x*y=k pricing | Does not exist |
| `route_graph.move` -- multi-hop pathfinding | Does not exist |
| `reputation.move` -- on-chain operator trust scores | Does not exist |
| `config.move` -- shared FenConfig with AdminCap | Does not exist (config is per-corridor via dynamic fields) |
| "62 tests, 100% function coverage" | 8 tests, partial coverage |
| Project path `fen/` | Actual path is `contracts/fen/` |

The README must be rewritten to match what actually ships. Claiming nonexistent features will hurt credibility with judges.

---

## 3. What the Register Corridor Form Fields Mean

When an operator clicks "Register Corridor", it calls `corridor::register_corridor` on Sui. Here is what each field is and where the values come from:

### Corridor Name
- **On-chain**: `name: vector<u8>` -- stored on the Corridor object
- **What to enter**: Any human-readable name, e.g. "Helios Express", "Jita-Amarr Run"
- **Where it comes from**: Operator chooses it

### Source Gate ID
- **On-chain**: `source_gate_id: ID` -- reference to a `world::gate::Gate` object
- **What to enter**: The Sui object ID (0x...) of a Gate smart assembly
- **Where it comes from**: The operator must have a Gate deployed in EVE Frontier. Gates are smart assemblies that players anchor in solar systems. The object ID can be found in:
  - The EVE Frontier explorer (eve-explorer)
  - Sui explorer (suiscan.xyz or suivision.xyz) by searching the operator's address for owned Gate objects
  - In-game UI (if supported)

### Destination Gate ID
- **On-chain**: `dest_gate_id: ID` -- reference to another Gate object
- **What to enter**: Object ID of the second gate (the other end of the jump link)
- **Where it comes from**: Same as above. The two gates together define the jump corridor endpoints.

### Depot A (SSU) ID
- **On-chain**: `depot_a_id: ID` -- reference to a `world::storage_unit::StorageUnit` object
- **What to enter**: Object ID of a Smart Storage Unit located at/near the source gate
- **Where it comes from**: The operator deploys an SSU in-game near the source gate's solar system. This SSU will hold tradeable items -- traders deposit input items here and receive output items.
- **Important**: The SSU must have the FenAuth extension authorized on it for deposits/withdrawals to work through the FEN contract.

### Depot B (SSU) ID
- **On-chain**: `depot_b_id: ID` -- reference to another StorageUnit
- **What to enter**: Object ID of an SSU at/near the destination gate
- **Where it comes from**: Same as Depot A, but at the other end of the corridor.

### Fee Recipient Address
- **On-chain**: `fee_recipient: address` -- Sui address that receives toll payments and trade fees
- **What to enter**: A Sui address (0x...)
- **Where it comes from**: Usually the operator's own wallet address. Can be any address (e.g. a DAO treasury, a revenue-splitting contract, etc.)

### What Happens On-Chain When You Register

1. A new shared `Corridor` object is created with all the gate/depot IDs, status=INACTIVE, counters at 0
2. A `CorridorOwnerCap` (owned object) is minted and transferred to the caller's wallet -- this is the "key" needed for all admin operations
3. A `CorridorInfo` entry is added to the shared `CorridorRegistry` table
4. A `CorridorCreatedEvent` is emitted (this is how the dashboard discovers corridors)

The corridor starts as INACTIVE. The operator must then:
1. Set toll config on each gate (`toll_gate::set_toll_config`)
2. Set depot config on each SSU (`depot::set_depot_config`)
3. Activate the depots (`depot::activate_depot`)
4. Activate the corridor (`corridor::activate_corridor`)

Only then can traders use it.

---

## 4. What the Dashboard Should Actually Do (UX Flow)

### For Operators (Operate Page)

**Current state**: Raw 0x... input fields with no guidance. Operator must know Sui object IDs beforehand.

**What it should do**:

1. **Auto-discover owned assemblies**: Query the connected wallet for Gate and StorageUnit objects they own. Show a dropdown/picker instead of raw text inputs.

2. **Auto-fill fee recipient**: Default to the connected wallet address. Let them change it.

3. **Auto-discover OwnerCaps**: After connecting a wallet, query for `CorridorOwnerCap` objects. Map each cap to its corridor. Only show "Manage" controls for corridors the user actually owns.

4. **Guided setup wizard**: After registration, walk the operator through:
   - Step 1: Set toll on Gate A (how much SUI per jump?)
   - Step 2: Set toll on Gate B
   - Step 3: Configure Depot A (which item types? what ratio? what fee?)
   - Step 4: Configure Depot B
   - Step 5: Activate depots
   - Step 6: Activate corridor
   - Step 7: Corridor is LIVE

5. **Read live config from chain**: Show current toll amounts, surge status, depot ratios by reading TollConfig and DepotConfig dynamic fields. Currently everything shows defaults/zeroes.

### For Traders (Trade Page)

**Current state**: Shows trade routes derived from corridor data, but depot configs are all empty defaults.

**What it should do**:

1. Show real exchange rates and fees (requires reading DepotConfig dynamic fields)
2. Show which depots have stock (requires reading SSU inventory)
3. Estimate total cost (toll + trade fee) for a route
4. Build the `pay_toll_and_jump` + `execute_trade` PTB in one click

### For Everyone (Home + Corridors Pages)

**Current state**: Works, but shows empty data because no corridors exist.

**What it should do**: Same as now, but with real data after corridors are registered.

---

## 5. Action Plan (Prioritized)

### Phase 1: Make It Work (Days 1-2)

These are required for the project to function at all.

**1.1 Add useOwnerCaps hook**
- Query connected wallet for objects of type `{packageId}::corridor::CorridorOwnerCap`
- Parse the `corridor_id` field from each cap
- Return a map: `corridorId -> ownerCapId`
- Wire into Operate page so every transaction uses the real cap

**1.2 Add dynamic field reading for TollConfig and DepotConfig**
- After fetching a Corridor object, use `getDynamicFields` to list its dynamic fields
- Parse TollConfig (toll_amount, surge_active, surge_numerator) and DepotConfig (input_type_id, output_type_id, ratio_in, ratio_out, fee_bps, is_active)
- Display real values in the Manage tab and Trade page

**1.3 Register a test corridor on testnet**
- Use the Sui CLI to call `corridor::register_corridor` with placeholder gate/depot IDs
- Configure tolls and depots
- Activate the corridor
- Verify the dashboard shows it correctly

**1.4 Fix the README**
- Remove references to modules that don't exist (liquidity_pool, route_graph, reputation, config)
- Update test count (8, not 62)
- Update project structure to match `contracts/fen/` path
- Accurately describe the 5 modules that exist
- Remove "AMM" and "multi-hop" claims unless they get built

### Phase 2: Make It Good (Days 3-5)

**2.1 Auto-discover owned Gate and StorageUnit objects**
- Query wallet for `world::gate::Gate` and `world::storage_unit::StorageUnit` objects
- Show dropdowns in the registration form instead of raw ID inputs
- Much better UX for operators

**2.2 Guided corridor setup wizard**
- After registration succeeds, show step-by-step config flow
- Each step calls the right transaction and confirms before moving on
- Auto-fill defaults where possible

**2.3 Deploy dashboard to Vercel**
- vercel.json already exists
- Set environment variables
- Get a live URL for the submission
- "Live Frontier Integration" category prize ($5k) requires a deployed, functioning app

**2.4 Add more Move tests**
- Test toll_gate: set config, pay toll, surge pricing
- Test depot: set config, activate/deactivate
- These require test helpers that create mock Gate/StorageUnit objects

### Phase 3: Make It Stand Out (Days 6-10)

**3.1 End-to-end testnet demo with real assemblies**
- If you have access to the EVE Frontier game client on Stillness:
  - Deploy 2 Gates and 2 StorageUnits in-game
  - Register a corridor linking them
  - Configure and activate
  - Have someone pay a toll and execute a trade
  - Screenshot/record the full flow
- This is the strongest possible proof for judges

**3.2 Contribution to world-contracts**
- Issue #44 (extension-managed inventory) -- FEN depots are a direct implementation of this
- Issue #45 (deposit receipts) -- FEN treasury events serve a similar purpose
- PR #125 (deployment script fixes) -- quick win
- Any merged PR adds credibility to the submission

**3.3 (Stretch) Add AMM liquidity pool module**
- `liquidity_pool.move` with constant-product (x*y=k) pricing
- Would replace fixed-ratio depot exchange with dynamic pricing
- High differentiation value but significant effort

**3.4 (Stretch) Add route graph module**
- `route_graph.move` with adjacency lists for corridor-to-corridor connections
- Multi-hop route discovery
- Only valuable if multiple corridors exist

**3.5 Demo video**
- 2-3 minute walkthrough showing:
  - Wallet connection
  - Corridor registration
  - Toll/depot configuration
  - Trader paying toll and trading
  - Revenue withdrawal
- Many hackathons require or strongly prefer video submissions

---

## 6. Prize Category Targeting

| Category | Prize | FEN's Angle | What's Needed |
|----------|-------|------------|---------------|
| **Utility** | $5k | Trade infrastructure that all players use | End-to-end demo with real assemblies |
| **Technical Implementation** | $5k | Clean Move architecture, typed witness pattern, event-driven frontend | Fix bugs, add tests, clean README |
| **Live Frontier Integration** | $5k | Dashboard deployed, corridors on testnet | Deploy to Vercel, register real corridors |
| **Overall 1st** | $15k + extras | Full package: working contracts, live dashboard, real usage | Everything in Phases 1-3 |
| **Creative** | $5k | Novel economic primitives (toll + depot + surge) | Better storytelling in README/video |

The strongest path is **Technical Implementation + Live Frontier Integration** -- these reward working code over aspirational features.

---

## 7. File Reference

| Path | Description |
|------|-------------|
| `contracts/fen/sources/corridor.move` | Core corridor registry (313 lines) |
| `contracts/fen/sources/toll_gate.move` | Gate toll extension (239 lines) |
| `contracts/fen/sources/depot.move` | SSU exchange extension (289 lines) |
| `contracts/fen/sources/treasury.move` | Revenue pool (155 lines) |
| `contracts/fen/sources/deepbook_adapter.move` | DeepBook v3 bridge (186 lines) |
| `contracts/fen/tests/corridor_tests.move` | 5 corridor tests |
| `contracts/fen/tests/treasury_tests.move` | 3 treasury tests |
| `contracts/fen/DEPLOYMENT.md` | Deployed object IDs |
| `dashboard/src/hooks/use-corridors.ts` | On-chain data fetching |
| `dashboard/src/hooks/use-fen-transactions.ts` | Transaction signing hooks |
| `dashboard/src/lib/transactions.ts` | PTB builders (555 lines) |
| `dashboard/src/app/operate/page.tsx` | Operator panel UI |
| `dashboard/src/app/trade/page.tsx` | Trade route discovery UI |
| `dashboard/src/lib/sui-config.ts` | Network config with deployed addresses |
