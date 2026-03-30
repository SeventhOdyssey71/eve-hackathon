# Frontier Exchange Network — Complete Build Journal

**EVE Frontier x Sui 2026 Hackathon**
**Builder:** SeventhOdyssey71 | **Dates:** March 11–31, 2026 | **Prize Pool:** $80,000 USD

---

## Table of Contents

1. [The Hackathon & The Idea](#1-the-hackathon--the-idea)
2. [Smart Contract Architecture](#2-smart-contract-architecture)
3. [The Dashboard](#3-the-dashboard)
4. [Deploying to Sui Testnet](#4-deploying-to-sui-testnet)
5. [EVE Frontier Utopia — Setting Up In-Game](#5-eve-frontier-utopia--setting-up-in-game)
6. [Wiring Real Assemblies to FEN](#6-wiring-real-assemblies-to-fen)
7. [The World Package Mismatch](#7-the-world-package-mismatch)
8. [Character Discovery — Three Addresses, One Player](#8-character-discovery--three-addresses-one-player)
9. [Extension Authorization — The Borrow Pattern](#9-extension-authorization--the-borrow-pattern)
10. [The Final Swap — End-to-End Proof](#10-the-final-swap--end-to-end-proof)
11. [Deployment IDs & Object Reference](#11-deployment-ids--object-reference)
12. [Lessons Learned](#12-lessons-learned)

---

## 1. The Hackathon & The Idea

### The Event

The EVE Frontier x Sui 2026 Hackathon ran from March 11–31 with an $80,000 USD prize pool. The theme was **"A Toolkit for Civilization"** — build external tools that extend EVE Frontier's blockchain-integrated space sandbox. Submissions required a GitHub repo, a live contract address on Sui Testnet, a demo video on YouTube, and a deployed website.

An additional +10% bonus was available for deploying to EVE Frontier's Stillness network after April 1.

### The Problem

EVE Frontier gives players two key primitives on the Sui blockchain:

- **Smart Gates** — warp points for travel between solar systems
- **Smart Storage Units (SSUs)** — warehouses for storing in-game items

But there is no native mechanism for **charging tolls** on gates, **exchanging items** through storage units, **discovering fair prices**, or **tracking revenue** across assemblies. Every trade is manual, off-chain, and opaque.

### The Solution: FEN

**Frontier Exchange Network (FEN)** is a complete trade infrastructure layer. It introduces **trade corridors** — configurable pipelines that bundle two gates and two storage units into a single economic unit. Operators configure toll prices, set exchange ratios, deploy AMM liquidity pools, and earn revenue from every transaction. Traders browse routes, compare rates, and execute trades atomically.

FEN does not modify EVE Frontier's world contracts. It **extends** them using Sui's typed-witness pattern, meaning any player can deploy FEN without permission from CCP or the game developers.

---

## 2. Smart Contract Architecture

### Six Move Modules (1,846 lines, 117 tests)

| Module | Lines | Tests | Purpose |
|--------|-------|-------|---------|
| `corridor` | 314 | 15 | Registry, lifecycle (inactive/active/emergency), ownership via CorridorOwnerCap |
| `toll_gate` | 240 | 13 | SUI toll collection, dynamic surge pricing (basis 10,000), JumpPermit issuance |
| `depot` | 298 | 14 | Item-for-item exchange at fixed ratios with configurable fees (max 50%) |
| `treasury` | 156 | 8 | SUI accumulation, partial/full withdrawal, recipient management |
| `liquidity_pool` | 657 | 45 | **First on-chain AMM for EVE Frontier** — constant-product (x·y=k), slippage protection |
| `deepbook_adapter` | 187 | 10 | DeepBook v3 order book integration, balance manager linking |

### Key Design Patterns

**Typed-Witness Authorization (FenAuth)**

```move
public struct FenAuth has drop {}
```

Only FEN modules can construct `FenAuth`. When FEN calls into the world contracts (e.g., to issue a JumpPermit or withdraw items from an SSU), it passes this witness as proof of authorization. The world contracts verify the witness type matches what was registered on the assembly.

**Dynamic Field Configuration**

All configuration (toll amounts, depot ratios, pool reserves) is stored as dynamic fields on the Corridor shared object, keyed by gate/depot ID. This means a single on-chain object represents the entire trade pipeline — queryable with standard Sui RPC calls, no indexer required.

**Constant-Product AMM**

```
output = (input_after_fee × reserve_out) / (reserve_in + input_after_fee)
```

The pool maintains `reserve_sui × reserve_items = k`. Every swap moves along this curve. Fees are deducted before the swap, increasing pool value over time. Price impact is calculated in basis points for UI display.

---

## 3. The Dashboard

### Stack

- **Next.js 15** with React 19 and App Router
- **@mysten/dapp-kit** for Sui wallet integration
- **Tailwind CSS** with custom glassmorphism design system
- **Recharts** for volume/activity charts
- **DM Sans** (body) + **JetBrains Mono** (code/numbers)
- True black background (`#000000`), backdrop-blur panels, `bg-white/[0.03]` surfaces

### Eight Routes

| Route | What It Does |
|-------|-------------|
| `/` | Dashboard home — stats grid, 24h volume chart, recent activity, top corridors |
| `/corridors` | Browse all registered corridors with status, revenue, activity counts |
| `/corridors/[id]` | Corridor detail — gate/depot visualization, pool configs, activity timeline |
| `/trade` | Trade route discovery — sortable table, exchange calculator, single-PTB execution |
| `/swap` | AMM DEX — buy/sell toggle, live price impact, slippage settings |
| `/operate` | Operator panel — register corridors, configure tolls/depots, emergency controls |
| `/activity` | Event explorer — filterable by type (jump, trade, config, emergency) |
| `/rankings` | Leaderboards — top corridors by revenue, jumps, trades |

### Zero Mock Data

The dashboard contains **no mock data, no seed files, no fixtures**. Every data point comes from:

- **Sui blockchain** — corridor objects, dynamic field configs, event logs
- **EVE Frontier World API** — item names and metadata (`world-api-utopia.uat.pub.evefrontier.com`)
- **Wallet objects** — character discovery, owned items, assembly caps

### 25+ Transaction Builders

Every on-chain operation has a corresponding Programmable Transaction Block (PTB) builder in `transactions.ts`. Key composite transactions chain multiple operations atomically — e.g., a trade executes `pay_toll_and_jump` + `execute_trade` in a single transaction, so the trader never ends up in a half-completed state.

### Gas Sponsorship

The `/api/sponsor` endpoint provides server-side transaction sponsorship. When enabled, the dashboard wraps user transactions with a gas payment from a server-side keypair, removing the SUI gas barrier for new traders. The sponsor validates that all MoveCall targets are the FEN package (preventing abuse) and enforces rate limiting.

---

## 4. Deploying to Sui Testnet

### Version History

FEN went through four deployment iterations:

| Version | Date | Package ID | Notes |
|---------|------|-----------|-------|
| v1 | March 15 | (discarded) | Initial prototype, missing modules |
| v2 | March 18 | (discarded) | Added liquidity_pool, but world dep wrong |
| v3 | March 23 | `0xff7534...620a` | Full 6 modules, 117 tests — but linked to wrong world package (`0x920e...`) |
| **v4** | **March 29** | **`0x4c2f4a...441a`** | **Correct Utopia world linkage (`0xd12a70c7...`), working swaps** |

### The Deployment Process

```bash
# Build with the correct environment
sui move build --build-env testnet_utopia

# Publish (creates Package + CorridorRegistry + BalanceManagerRegistry)
sui client publish --build-env testnet_utopia --gas-budget 500000000
```

The `--build-env testnet_utopia` flag is critical — it tells the Move compiler to resolve the `world` dependency using the Utopia-specific published address from `world-contracts/contracts/world/Published.toml`. Without this, the default `testnet` environment resolves to a different world package (`0x920e...`), creating a type mismatch that prevents any interaction with real EVE Frontier objects.

---

## 5. EVE Frontier Utopia — Setting Up In-Game

### Getting Started

EVE Frontier's **Utopia** is the official sandbox environment for smart assembly development. We launched the game client with the Utopia force-start command and connected as **SeventhOdyssey71** (Tribe: Clonebank 86).

### Obtaining Building Materials

Building assemblies requires specific in-game items. We used `/giveitem` commands:

```
/giveitem 84210 10    # Carbon Weave
/giveitem 88561 10    # Thermal Composites
/giveitem 84180 10    # Printed Circuits
/giveitem 84182 10    # Reinforced Alloys
/giveitem 77800 750   # Feldspar Crystals
/giveitem 77811 20    # Hydrated Sulfide Matrix
/giveitem 89089 10    # Building Foam
```

**Mistake #1 — Wrong Item IDs.** Our first attempt used IDs 77518–77521, which turned out to be "Charge" category items. The game rejected them with "CAN'T CREATE TYPE — You are not permitted to create items from the category Charge." We had to look up the correct building material IDs from EVE Frontier's documentation.

### Finding an L-Point

Assemblies can only be built at **L-Points** — specific anchor locations in solar systems.

**Mistake #2 — Building in open space.** Our first attempt to build a Network Node failed with "You must be located at an Anchor within an L-Point to build this Assembly." We had to navigate to the SYS map view and find an L-Point.

**Mistake #3 — Unsafe system.** The first system we tried (ABJ-G43) was marked unsafe. We redirected to **U45-74L** which had available L-Points.

### Cargo Management

**Mistake #4 — Cargo overload.** Excessive `/giveitem` commands filled our cargo to 19,497/520 units. The game locked us out: "You cannot do that because you have somehow overloaded your cargo hold." We had to jettison excess items (right-click → Jettison) to get back below 520 units.

### Building the Network Node

Once at an L-Point in U45-74L with the correct materials and manageable cargo, we built the **Network Node** — the base power structure that supplies energy to all other assemblies within its range.

- **Max Capacity:** 1,000 GJ
- **Energy Production:** 1,000 GJ (when fueled)
- **Fuel:** D1 Fuel, burn rate 10/hour

### Deploying Assemblies

After the Network Node was built, we deployed:

1. **Smart Gate (Heavy)** — 950 GJ energy usage
2. **Mini Gate** — 0 GJ energy usage
3. **SSU #1 (Mini Storage)** — 50 GJ energy usage
4. **SSU #2 (Storage)** — 100 GJ energy usage

**Total energy needed: 1,100 GJ** vs **1,000 GJ capacity**. We couldn't power everything simultaneously — the Heavy Gate alone uses 950 GJ. We prioritized the Mini Gate + both SSUs (150 GJ total) for the demo.

### Fueling & Onlining

1. Opened the Network Node → clicked **"FUEL ASSEMBLY"**
2. Transferred D1 Fuel from cargo into the fuel slot
3. Network Node came online: "ONLINE AND GENERATING ENERGY", burn rate 10/H, 11+ hours runtime
4. Clicked **"ONLINE UNIT"** on each connected assembly to bring them online

Each assembly had to transition from **Anchored** → **Online** individually after the Network Node was powered.

---

## 6. Wiring Real Assemblies to FEN

### The Problem with Helios Express

Our first corridor ("Helios Express") was registered with placeholder gate/depot IDs (`0x000...001`, `0x000...002`, etc.) because the real assemblies didn't exist yet. The dashboard displayed the corridor correctly, but the IDs didn't point to real EVE Frontier objects.

### Registering Odyssey Express

After deploying the real assemblies, we registered a new corridor with their actual Object IDs:

```bash
sui client call --package $PKG --module corridor --function register_corridor \
  --args $REGISTRY \
    0xddca...c4    # Source Gate (Heavy)
    0x5721...dc    # Dest Gate (Mini)
    0x6ec2...1d    # Depot A (Mini Storage SSU)
    0x0d98...c9    # Depot B (Storage SSU)
    $FEE_ADDR \
    '[79,100,121,115,115,101,121,32,69,120,112,114,101,115,115]' \  # "Odyssey Express" as bytes
    0x6  # Clock
```

### 10-Step Configuration Sequence

After registration, the corridor needed full configuration before activation:

1. `set_toll_config` — Source gate toll: 0.0005 SUI (500,000 MIST)
2. `set_toll_config` — Dest gate toll: 0.0003 SUI (300,000 MIST)
3. `set_depot_config` — Depot A: Feldspar Crystals (77800) → Hydrated Sulfide Matrix (77811), 2:1 ratio, 2.5% fee
4. `set_depot_config` — Depot B: Printed Circuits (84180) → Reinforced Alloys (84182), 3:2 ratio, 2% fee
5. `create_pool` — AMM pool on Depot A: Feldspar Crystals, 0.01 SUI initial liquidity, 1,000 virtual items, 1% fee
6. `activate_depot` — Depot A
7. `activate_depot` — Depot B
8. `activate_pool` — AMM pool
9. `activate_corridor` — Set status to Active

The AMM pool creation used a PTB to split the gas coin for initial liquidity:

```bash
sui client ptb \
  --split-coins gas "[10000000]" \
  --assign pool_coin \
  --move-call "${PKG}::liquidity_pool::create_pool" \
    @${CORRIDOR} @${CAP} @${DEPOT_A} 77800 100 pool_coin.0 1000
```

All 9 steps returned `success`. The dashboard immediately showed the corridor with real activity events.

---

## 7. The World Package Mismatch

### The Bug

When we first tried to execute a swap, it failed with:

```
Transaction resolution failed: CommandArgumentError { arg_idx: 1, kind: TypeMismatch }
```

The second argument (`StorageUnit`) had the wrong type.

### Root Cause

FEN v3 was compiled against the `testnet` environment, which resolved the `world` dependency to package `0x920e577e...`. But the actual EVE Frontier objects on Utopia use world package `0xd12a70c74c1e...`. These are entirely different package deployments — the types are incompatible even though the code is identical.

We discovered this by querying the on-chain function signature:

```bash
sui_getNormalizedMoveModule → buy_items arg 1:
  address: "0x920e577e..."  # WRONG — should be 0xd12a70c7...
```

### The Fix

The `world-contracts/contracts/world/Published.toml` file contains environment-specific deployments:

```toml
[published.testnet]
original-id = "0x920e577e..."  # ← What v3 used (WRONG)

[published.testnet_utopia]
original-id = "0xd12a70c74c1e..."  # ← What real EVE objects use (CORRECT)
```

We added `testnet_utopia` to FEN's `Move.toml`:

```toml
[environments]
testnet_utopia = "4c78adac"
```

Then rebuilt and republished:

```bash
sui move build --build-env testnet_utopia
sui client publish --build-env testnet_utopia --gas-budget 500000000
```

This created FEN v4 (`0x4c2f4a...`) linked to the correct Utopia world package. All types now matched.

### The Faucet Problem

The redeployment almost stalled because the deployer wallet was low on SUI (0.14 SUI, but publishing needed ~0.3 SUI). The CLI faucet was rate-limited. We had to use the web faucet at `https://faucet.sui.io` to get testnet SUI before the publish could succeed.

---

## 8. Character Discovery — Three Addresses, One Player

### The Bug

After fixing the type mismatch, the swap page still showed `character: required (EVE Frontier Character NFT)` — the dashboard couldn't find the user's character.

### Root Cause

The `useCharacter()` hook was searching for `smart_character::PlayerProfile` — but the actual on-chain type is `character::PlayerProfile` (different module name). The PlayerProfile existed but was invisible to the search.

### EVE Frontier's Three-Address Model

By examining the character creation transaction, we discovered that each EVE Frontier player has **three distinct addresses**:

| Address | What It Is | What It Owns |
|---------|-----------|-------------|
| `0x62c8...` | Admin wallet (tx sender) | AdminCap, SUI coins |
| `0x9d8b...` | Character address (game identity) | PlayerProfile (with `character_id` field) |
| `0x5362...` | Character object ID (shared) | OwnerCap<Character>, OwnerCap<Gate> ×2, OwnerCap<StorageUnit> ×2 |

The user connects to the dashboard with `0x9d8b...` (their game wallet), which owns the PlayerProfile. But the old code searched for the wrong type name.

### The Fix

We rewrote `useCharacter()` with a multi-strategy discovery approach:

1. **Primary:** Search for `character::PlayerProfile` (correct module name) — extracts `character_id` field
2. **Fallback:** Search for `OwnerCap<Character>` — extracts `authorized_object_id` field
3. **Legacy:** Search for `smart_character::PlayerProfile` (old module name)
4. **Last resort:** Check if wallet address itself is a Character object

This fixed the character discovery — the hook now finds the PlayerProfile at `0xd970...` owned by `0x9d8b...` and extracts `character_id: 0x5362...`.

---

## 9. Extension Authorization — The Borrow Pattern

### The Bug

With character discovery fixed, the next swap attempt failed with:

```
EExtensionNotAuthorized: Access only authorized for the custom contract
of the registered type, in 'storage_unit::withdraw_item'
```

### Root Cause

EVE Frontier's world contracts require each assembly to explicitly authorize which extension contracts can interact with it. FEN's `FenAuth` witness type was not registered on the StorageUnits or Gates.

### The Authorization Chain

The OwnerCap for each assembly is owned by the Character object (`0x5362...`), not by the user's wallet. To use it, you must go through a **3-step borrow pattern**:

```
Step 1: character::borrow_owner_cap<StorageUnit>(character, owner_cap_receiving)
        → Returns (borrowed_cap, receipt)

Step 2: storage_unit::authorize_extension<FenAuth>(storage_unit, borrowed_cap)
        → Registers FenAuth as the authorized extension

Step 3: character::return_owner_cap<StorageUnit>(character, borrowed_cap, receipt)
        → Returns the cap to the Character
```

This must be done as a single Programmable Transaction Block — you can't borrow in one tx and return in another.

### The Fix

We built two new PTB builders in `transactions.ts`:

- `buildAuthorizeStorageUnitExtension()` — 3-step PTB for SSUs
- `buildAuthorizeGateExtension()` — 3-step PTB for Gates

And created a dedicated `/authorize` page in the dashboard where the user clicks "Authorize FEN" for each assembly. The page renders all 4 assemblies (2 SSUs + 2 Gates) with their Object IDs and one-click authorization buttons.

### OwnerCap Mapping

Each assembly has a corresponding OwnerCap owned by the Character:

| Assembly | Object ID | OwnerCap ID |
|----------|-----------|------------|
| SSU #1 (Mini Storage) | `0x6ec2c3...20af1d` | `0x438b49...c60791` |
| SSU #2 (Storage) | `0x0d98be...3e0bc9` | `0xd7acd1...20c8fe` |
| Smart Gate (Heavy) | `0xddca10...1cb0c4` | `0xb41e52...1044d7` |
| Mini Gate | `0x5721cd...3d82dc` | `0x716850...ff624c` |

After clicking "Authorize FEN" on the SSU and signing with the EVE wallet, the `EExtensionNotAuthorized` error was resolved.

---

## 10. The Final Swap — End-to-End Proof

### The Last Bug

After authorization, the swap hit one more error:

```
EItemDoesNotExist: Item not found, in 'inventory::withdraw_item'
```

The AMM pool tracked 1,000 virtual item reserves, but the actual StorageUnit was empty — no real items to withdraw.

### The Fix

In the EVE Frontier game client:

1. Ran `/giveitem 77800 100` to get Feldspar Crystals
2. Flew to SSU #1 (Mini Storage)
3. Transferred Feldspar Crystals from cargo into the SSU's inventory

### The Working Swap

With items stocked, the **Buy swap (SUI → Feldspar Crystals) executed successfully**. The full on-chain flow:

1. User connects EVE wallet (`0x9d8b...`) to dashboard
2. Dashboard discovers Character via `character::PlayerProfile`
3. User enters swap amount on `/swap` page
4. Dashboard builds PTB: `liquidity_pool::buy_items(corridor, storage_unit, character, payment, min_items_out, clock)`
5. User signs with wallet
6. On-chain: FEN verifies corridor is active, calculates output via constant-product formula, deducts 1% fee, calls `storage_unit::withdraw_item<FenAuth>` (authorized!), transfers items to trader, updates pool reserves
7. Transaction succeeds — items in wallet, SUI in pool

### Revenue Flow

- **Toll fees** → Transferred directly to `fee_recipient` address in SUI
- **AMM swap fees** → Retained in pool reserves (operator withdraws via `remove_liquidity`)
- **Depot trade fees** → Deducted from output items, tracked in `total_fees_collected`

---

## 11. Deployment IDs & Object Reference

### FEN Package (v4 — Production)

| Object | ID |
|--------|-----|
| Package | `0x4c2f4a85fdf9667aca3c877b71b112dd017dab2824c251b9291f407b033a441a` |
| CorridorRegistry | `0x6cb994308037d32961623b5a198365155108b6c1dc2a36df4680bd4be2dea6d3` |
| BalanceManagerRegistry | `0x50495a9ed1e8205ecb5d9c05730ac3a398d1a2099f546445de14f232321f0df4` |
| Deployer | `0x33a514d95ba2f0a4cd334d00a7d82120af22ce51cf53f4b3d41026733fb48eeb` |

### Odyssey Express Corridor

| Property | Value |
|----------|-------|
| Corridor ID | `0x6f5c71b7714bf2ef663685e6fa08aaa011885fa793062203bb65e177e74d8eb1` |
| CorridorOwnerCap | `0x30305fc9622007ee9996752d34b670b9815c7fd343b5a5ef4ed900a60f447009` |
| Status | Active |
| Source Gate Toll | 0.0005 SUI |
| Dest Gate Toll | 0.0003 SUI |
| Depot A | Feldspar Crystals → Hydrated Sulfide, 2:1, 2.5% fee |
| Depot B | Printed Circuits → Reinforced Alloys, 3:2, 2% fee |
| AMM Pool | Feldspar Crystals, 0.01 SUI liquidity, 1% fee |

### EVE Frontier Assemblies (Utopia, System U45-74L)

| Assembly | Type | Object ID |
|----------|------|-----------|
| Network Node | NetworkNode | `0x9bb4b743e5289f57ecee511920c8d3570df5f6bbd1963ab83638a27f56926ce5` |
| Heavy Gate | SmartGate | `0xddca10d9fa4358261b3b41ca634e1ea79cf08414a5f22293e13db0e7521cb0c4` |
| Mini Gate | SmartGate | `0x5721cd58478525521eca980f861174d97a169c285cb23758306439afa93d82dc` |
| Mini Storage | SmartStorageUnit | `0x6ec2c373149a906c1edb55842ab7b50f3521dea6a35d36474d7eefa53020af1d` |
| Storage | SmartStorageUnit | `0x0d98beb332114779cf8f61566c67aa6736911e2b786fdd82d9e28d16f23e0bc9` |

### Character

| Property | Value |
|----------|-------|
| Name | SeventhOdyssey71 |
| Character ID | `0x5362c8c1181a6d1e24cf0ae2dcc75fc61235ee87053d6a5fdf39a4983c5b1ca7` |
| Character Address | `0x9d8b157e6ee8bfdba4069713c6af6121d5d262846ad4f2e93ccc08451c9cdae6` |
| Tribe | Clonebank 86 |
| System | U45-74L |

### World Contracts

| Environment | Original ID | Published-At (v2) |
|-------------|-----------|-------------------|
| testnet_utopia | `0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75` | `0x07e6b810c2dff6df56ea7fbad9ff32f4d84cbee53e496267515887b712924bd1` |
| testnet_stillness | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | same |

---

## 12. Lessons Learned

### 1. Environment Matters More Than Code

The single most time-consuming bug was the world package mismatch. The code was identical — the types were identical — but because FEN was compiled against `testnet` instead of `testnet_utopia`, every function call failed with a type error. **Always verify your dependency resolution matches the target environment.**

### 2. EVE Frontier Has a Deep Ownership Model

A single player involves three addresses, nested OwnerCaps, and a borrow-return pattern for authorization. Understanding this model was essential for building the extension authorization flow. The game client abstracts this away, but building raw transactions requires understanding every layer.

### 3. Virtual Reserves Need Real Inventory

The AMM pool tracks virtual reserves, but the underlying StorageUnit must actually contain the items. This is by design — it prevents the pool from selling items that don't exist — but it means operators must stock their SSUs in-game before trading can begin.

### 4. Build in Layers, Test Each One

Every layer required independent verification:
- Smart contracts: 117 unit tests
- On-chain deployment: CLI queries to verify function signatures
- Dashboard queries: API route testing with curl
- Character discovery: RPC queries to find the right object types
- Extension auth: Dedicated page to authorize one assembly at a time
- Item stocking: In-game inventory management

### 5. The Faucet Will Fail at the Worst Time

Always maintain a buffer of testnet SUI. Rate limits on the faucet API caused a 30-minute delay during a critical redeployment. Use the web UI faucet as a backup.

### 6. Read the World Contracts Source

The EVE Frontier world contracts are the ground truth. The `Published.toml` file reveals environment-specific deployments. The `authorize_extension` function signature reveals the borrow pattern. The `extension_examples/` directory shows exactly how to register extensions. When in doubt, read the source — don't guess.

---

*Built during the EVE Frontier x Sui 2026 Hackathon, March 2026.*
*6 Move modules. 117 tests. 8 dashboard routes. 5 in-game assemblies. 1 working swap.*
