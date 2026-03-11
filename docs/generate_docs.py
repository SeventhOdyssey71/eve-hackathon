#!/usr/bin/env python3
"""Generate PDF documentation for the FEN (Frontier Exchange Network) hackathon project."""

from fpdf import FPDF
import os
import textwrap

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))


class FenPDF(FPDF):
    """Custom PDF class with FEN branding."""

    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "Frontier Exchange Network (FEN) - EVE Frontier x Sui 2026 Hackathon", align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def title_page(self, title, subtitle=""):
        self.add_page()
        self.ln(60)
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(20, 20, 80)
        self.multi_cell(0, 14, title, align="C")
        self.ln(10)
        if subtitle:
            self.set_font("Helvetica", "", 14)
            self.set_text_color(80, 80, 80)
            self.multi_cell(0, 8, subtitle, align="C")
        self.ln(20)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(60, 60, 60)
        self.cell(0, 8, "EVE Frontier x Sui 2026 Hackathon", align="C")
        self.ln(6)
        self.cell(0, 8, "Prize Pool: $80,000 USD | Theme: A Toolkit for Civilization", align="C")
        self.ln(6)
        self.cell(0, 8, "March 11-31, 2026", align="C")

    def section_title(self, title, level=1):
        if level == 1:
            self.set_font("Helvetica", "B", 18)
            self.set_text_color(20, 20, 80)
            self.ln(8)
            self.cell(0, 12, title)
            self.ln(4)
            # Underline
            self.set_draw_color(20, 20, 80)
            self.set_line_width(0.5)
            self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
            self.ln(6)
        elif level == 2:
            self.set_font("Helvetica", "B", 14)
            self.set_text_color(40, 40, 100)
            self.ln(6)
            self.cell(0, 10, title)
            self.ln(4)
        elif level == 3:
            self.set_font("Helvetica", "B", 12)
            self.set_text_color(60, 60, 60)
            self.ln(4)
            self.cell(0, 8, title)
            self.ln(3)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text, indent=10):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        self.set_x(x + indent)
        self.cell(5, 5.5, "-")
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def code_block(self, text, language=""):
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(240, 240, 245)
        self.set_text_color(30, 30, 30)
        self.ln(2)
        for line in text.strip().split("\n"):
            # Truncate long lines
            if len(line) > 95:
                line = line[:92] + "..."
            self.cell(0, 4.5, "  " + line, fill=True)
            self.ln()
        self.ln(3)

    def key_value(self, key, value):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 100)
        self.cell(55, 6, key + ":")
        self.set_font("Courier", "", 9)
        self.set_text_color(30, 30, 30)
        self.cell(0, 6, str(value))
        self.ln(6)

    def info_box(self, title, text):
        self.ln(3)
        self.set_fill_color(230, 240, 255)
        self.set_draw_color(100, 130, 200)
        self.set_line_width(0.3)
        x = self.get_x()
        y = self.get_y()
        # Calculate height
        self.set_font("Helvetica", "", 9)
        lines = len(textwrap.wrap(text, width=85)) + 2
        h = max(lines * 5 + 10, 20)
        self.rect(x, y, self.w - self.l_margin - self.r_margin, h, "DF")
        self.set_xy(x + 5, y + 3)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 100)
        self.cell(0, 5, title)
        self.ln(6)
        self.set_x(x + 5)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 30, 30)
        self.multi_cell(self.w - self.l_margin - self.r_margin - 10, 5, text)
        self.set_y(y + h + 3)

    def check_page_break(self, h=40):
        if self.get_y() + h > self.h - 30:
            self.add_page()


# ─────────────────────────────────────────────────────────
# DOCUMENT 1: Understanding EVE Frontier & FEN
# ─────────────────────────────────────────────────────────
def generate_doc_1():
    pdf = FenPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=25)

    # Title page
    pdf.title_page(
        "Understanding EVE Frontier\n& The Frontier Exchange Network",
        "A Complete Guide to the Game, the Blockchain, and the Project"
    )

    # --- PAGE: What is EVE Frontier? ---
    pdf.add_page()
    pdf.section_title("What is EVE Frontier?")
    pdf.body_text(
        "EVE Frontier is a blockchain-powered sandbox game built on the Sui blockchain. "
        "It is a spin-off of the legendary EVE Online MMO, reimagined with decentralized "
        "ownership and programmable game mechanics. In EVE Frontier, players exist in a "
        "persistent universe of solar systems, where everything - from space stations to "
        "trade routes - can be owned, built, and operated by players."
    )
    pdf.body_text(
        "Unlike traditional games where the developer controls the economy, EVE Frontier "
        "puts economic infrastructure in the hands of players. The game provides primitive "
        "building blocks called 'assemblies' (gates, storage units, etc.), and players "
        "write smart contracts to compose them into complex systems."
    )

    pdf.section_title("Key Concepts in EVE Frontier", 2)

    pdf.section_title("Solar Systems", 3)
    pdf.body_text(
        "The game universe is divided into solar systems. Each solar system is a distinct "
        "location where players can deploy structures. Moving between solar systems requires "
        "using gates - there is no instant teleportation."
    )

    pdf.section_title("Assemblies (Game Objects)", 3)
    pdf.body_text(
        "Assemblies are the fundamental building blocks of EVE Frontier. They are on-chain "
        "Sui objects that represent physical structures in the game world. The core assembly "
        "types are:"
    )
    pdf.bullet("Gate - A jump point that teleports characters between solar systems")
    pdf.bullet("Storage Unit (SSU) - A container that holds items, like a warehouse or shop")
    pdf.bullet("Character - A player's in-game avatar, represented as a Sui object")
    pdf.bullet("Item - A game item (resources, materials, equipment) with a type ID and quantity")

    pdf.section_title("Smart Structure Units (SSUs)", 3)
    pdf.body_text(
        "SSUs are the most versatile assembly. They are storage containers that can be "
        "programmed via smart contracts to become shops, depots, vending machines, or "
        "anything that involves item exchange. An SSU holds items and exposes deposit/withdraw "
        "functions that authorized contracts can call."
    )

    pdf.section_title("Gates and Jump Permits", 3)
    pdf.body_text(
        "Gates are the transportation infrastructure of EVE Frontier. To travel between "
        "solar systems, a character needs a 'Jump Permit' - a time-limited authorization "
        "object. Smart contracts can issue jump permits by providing a typed witness, "
        "which proves that the contract is authorized to grant passage through a specific gate."
    )
    pdf.body_text(
        "This is where FEN comes in: it creates a system where gate operators can charge "
        "tolls (in SUI cryptocurrency) for issuing jump permits."
    )

    pdf.check_page_break(60)
    pdf.section_title("The world-contracts Framework", 2)
    pdf.body_text(
        "EVE Frontier's game mechanics are implemented in a set of open-source Sui Move "
        "smart contracts called 'world-contracts'. These define the rules for how assemblies "
        "work: how items are stored, how gates issue permits, how characters interact with "
        "objects, etc."
    )
    pdf.body_text(
        "Third-party developers (like us) build 'extension packages' that add new game "
        "mechanics on top of world-contracts. FEN is one such extension - it composes gates "
        "and SSUs into trade corridors with economic functionality."
    )

    pdf.info_box(
        "Extension Package Pattern",
        "FEN depends on world-contracts the same way a web app depends on a framework. "
        "It imports Gate, StorageUnit, Character, and Item types from world-contracts "
        "and adds toll payment, item exchange, and AMM trading logic on top."
    )

    # --- PAGE: What is the Sui Blockchain? ---
    pdf.add_page()
    pdf.section_title("The Sui Blockchain")
    pdf.body_text(
        "Sui is a Layer 1 blockchain designed for high performance and object-centric "
        "programming. Unlike Ethereum (which uses accounts and global state), Sui treats "
        "everything as objects with clear ownership."
    )

    pdf.section_title("Key Sui Concepts for FEN", 2)

    pdf.section_title("Move Language", 3)
    pdf.body_text(
        "Sui smart contracts are written in Move, a language designed for safe asset "
        "programming. Move enforces resource safety at the type level - you cannot "
        "accidentally duplicate, destroy, or lose assets. This makes it ideal for "
        "game items and financial logic."
    )

    pdf.section_title("Object Ownership Model", 3)
    pdf.body_text("Sui has three types of object ownership:")
    pdf.bullet("Owned objects - belong to a specific address (e.g., CorridorOwnerCap)")
    pdf.bullet("Shared objects - accessible by anyone (e.g., Corridor, CorridorRegistry)")
    pdf.bullet("Immutable objects - cannot be changed (e.g., published package code)")
    pdf.body_text(
        "This is critical for FEN: Corridors are shared (so any player can interact), "
        "but the CorridorOwnerCap is owned (so only the operator can configure them)."
    )

    pdf.section_title("Dynamic Fields", 3)
    pdf.body_text(
        "Dynamic fields allow attaching key-value data to any object at runtime. FEN uses "
        "this extensively: TollConfig, DepotConfig, and PoolConfig are all stored as dynamic "
        "fields on Corridor objects. This means a corridor starts simple and gains "
        "functionality as the operator configures it."
    )

    pdf.section_title("Programmable Transaction Blocks (PTBs)", 3)
    pdf.body_text(
        "Sui allows composing multiple operations into a single atomic transaction. "
        "FEN's frontend builds PTBs to register corridors, set configs, and execute "
        "trades - all in one transaction that either fully succeeds or fully fails."
    )

    pdf.section_title("SUI Currency", 3)
    pdf.body_text(
        "SUI is the native cryptocurrency of the Sui blockchain. 1 SUI = 1,000,000,000 MIST "
        "(the smallest unit). FEN toll payments and AMM trades are denominated in MIST internally "
        "but displayed as SUI to users."
    )

    # --- PAGE: What is FEN? ---
    pdf.add_page()
    pdf.section_title("What is the Frontier Exchange Network (FEN)?")
    pdf.body_text(
        "FEN is a player-owned trade corridor system for EVE Frontier. It lets players "
        "become economic operators by creating and managing trade routes between solar systems. "
        "Think of it as building and operating a highway system with toll booths and "
        "trading posts."
    )

    pdf.section_title("The Big Picture", 2)
    pdf.body_text(
        "In EVE Frontier, resources are scattered across solar systems. Players need to "
        "move between systems to trade, gather resources, and interact. FEN creates the "
        "infrastructure for this movement and trade:"
    )
    pdf.ln(2)
    pdf.bullet("Operators register trade corridors connecting two solar systems")
    pdf.bullet("Each corridor has 2 gates (entry/exit points) and 2 depots (trading posts)")
    pdf.bullet("Operators set toll prices for gate jumps and exchange rates at depots")
    pdf.bullet("Players pay tolls to travel and trade items at depots")
    pdf.bullet("Operators earn revenue from tolls, trade fees, and AMM swap fees")

    pdf.section_title("A Real-World Analogy", 2)
    pdf.body_text(
        "Imagine you build a bridge between two cities (solar systems). You put a toll booth "
        "at each end (gates with tolls). Next to each toll booth, you open a trading post "
        "(depot) where travelers can exchange goods. You also set up a currency exchange "
        "(AMM pool) for more complex trades. You earn money from bridge tolls, trading fees, "
        "and exchange spreads. That's FEN."
    )

    pdf.check_page_break(50)
    pdf.section_title("What a Corridor Looks Like", 2)
    pdf.code_block("""
    Solar System A                              Solar System B
    +------------------+                        +------------------+
    |   SOURCE GATE    | ---- jump permit ---> |    DEST GATE     |
    |   (toll: 0.1 SUI)|                        |   (toll: 0.05 SUI)
    +------------------+                        +------------------+
    |    DEPOT A       |                        |    DEPOT B       |
    |  Iron -> Steel   |                        |  Steel -> Iron   |
    |  (3:1 ratio,     |                        |  (1:2 ratio,     |
    |   2.5% fee)      |                        |   1% fee)        |
    +------------------+                        +------------------+
    |  AMM POOL (opt)  |                        |  AMM POOL (opt)  |
    |  SUI <-> Items   |                        |  SUI <-> Items   |
    +------------------+                        +------------------+
              \\                                       /
               -----> TREASURY (accumulated SUI) <----
    """)

    pdf.section_title("Two Types of Users", 2)
    pdf.section_title("1. Operators (Corridor Owners)", 3)
    pdf.body_text("Operators are entrepreneurs. They:")
    pdf.bullet("Register corridors by linking their gates and SSUs")
    pdf.bullet("Configure toll amounts and exchange rates")
    pdf.bullet("Activate/deactivate corridors and depots")
    pdf.bullet("Enable surge pricing during high demand")
    pdf.bullet("Manage AMM liquidity pools")
    pdf.bullet("Withdraw accumulated revenue")
    pdf.bullet("Emergency-lock corridors if needed")

    pdf.section_title("2. Traders (Players)", 3)
    pdf.body_text("Traders are customers. They:")
    pdf.bullet("Browse available corridors and compare rates")
    pdf.bullet("Pay tolls to jump between solar systems")
    pdf.bullet("Exchange items at depot trading posts")
    pdf.bullet("Swap items for SUI (or vice versa) via AMM pools")
    pdf.bullet("Find arbitrage opportunities across corridors")

    # --- Revenue model ---
    pdf.add_page()
    pdf.section_title("Revenue Streams")
    pdf.body_text("FEN operators earn revenue from three sources:")

    pdf.section_title("1. Toll Revenue", 3)
    pdf.body_text(
        "Every time a player jumps through a gate, they pay a toll in SUI. The toll amount "
        "is set by the operator. During high-demand periods, operators can activate surge "
        "pricing which multiplies the base toll by a configurable factor (e.g., 1.5x, 2x). "
        "Toll revenue goes directly to the corridor's fee_recipient address."
    )

    pdf.section_title("2. Depot Trade Fees", 3)
    pdf.body_text(
        "When players exchange items at a depot (e.g., 3 Iron for 1 Steel), the operator "
        "takes a fee in basis points (1 basis point = 0.01%). A 250 bps fee means 2.5% "
        "of the output is kept as the operator's cut. Trade fees are tracked on-chain."
    )

    pdf.section_title("3. AMM Swap Fees", 3)
    pdf.body_text(
        "AMM (Automated Market Maker) pools allow players to swap items for SUI and vice "
        "versa using a constant-product formula (x * y = k). Each swap charges a fee that "
        "stays in the pool, growing the operator's reserves over time."
    )

    pdf.info_box(
        "Surge Pricing Example",
        "Base toll: 0.1 SUI. Surge multiplier: 15000 (= 150%). "
        "Effective toll: 0.1 * 15000 / 10000 = 0.15 SUI. "
        "The base unit for surge is 10000 = 100%. So 20000 = 200% (double price)."
    )

    # --- Authorization model ---
    pdf.section_title("Authorization & Security", 2)
    pdf.body_text(
        "FEN uses a capability-based security model. When an operator registers a corridor, "
        "they receive a CorridorOwnerCap - a unique Sui object that proves ownership. "
        "Every admin function (set toll, configure depot, activate, emergency lock, withdraw) "
        "requires presenting this capability."
    )
    pdf.body_text("Key security properties:")
    pdf.bullet("Only the cap holder can modify a corridor - no admin keys or multisigs needed")
    pdf.bullet("Caps are transferable - operators can delegate control by sending the cap")
    pdf.bullet("Each cap is tied to one specific corridor - no global admin power")
    pdf.bullet("Corridors are shared objects - anyone can read state and call player functions")
    pdf.bullet("Emergency lock prevents all activity until the operator unlocks")

    pdf.output(os.path.join(DOCS_DIR, "01_Understanding_EVE_Frontier_and_FEN.pdf"))
    print("Generated: 01_Understanding_EVE_Frontier_and_FEN.pdf")


# ─────────────────────────────────────────────────────────
# DOCUMENT 2: Smart Contract Deep Dive
# ─────────────────────────────────────────────────────────
def generate_doc_2():
    pdf = FenPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=25)

    pdf.title_page(
        "Smart Contract\nDeep Dive",
        "Complete Reference for All 6 FEN Modules"
    )

    # --- Module overview ---
    pdf.add_page()
    pdf.section_title("Architecture Overview")
    pdf.body_text(
        "FEN consists of 6 Sui Move modules deployed as a single package. The modules "
        "work together through Sui's friend visibility and dynamic fields. Here's how "
        "they relate:"
    )
    pdf.code_block("""
    corridor (core)
      |-- Stores TollConfig (dynamic field) <-- toll_gate module
      |-- Stores DepotConfig (dynamic field) <-- depot module
      |-- Stores PoolConfig (dynamic field) <-- liquidity_pool module
      |-- record_jump() called by toll_gate
      |-- record_trade() called by depot, liquidity_pool

    treasury (standalone)
      |-- Linked to a corridor_id
      |-- Holds SUI balance for operator withdrawals

    deepbook_adapter (standalone)
      |-- Links DeepBook v3 balance managers to corridors
      |-- Records order events for dashboard display
    """)

    pdf.section_title("Deployment Details", 2)
    pdf.key_value("Network", "Sui Testnet")
    pdf.key_value("Package ID", "0xb05f...0f09")
    pdf.key_value("CorridorRegistry", "0xe018...1b2d")
    pdf.key_value("BalanceManagerRegistry", "0x27d5...2920")

    # --- Module 1: corridor ---
    pdf.add_page()
    pdf.section_title("Module 1: corridor")
    pdf.body_text(
        "The core module. Manages the lifecycle of trade corridors and provides the shared "
        "object that all other modules attach their configuration to."
    )

    pdf.section_title("Structs", 2)
    pdf.section_title("CorridorRegistry (shared)", 3)
    pdf.body_text("Created once at package init. Tracks all registered corridors.")
    pdf.code_block("""
    struct CorridorRegistry has key {
        id: UID,
        corridors: Table<ID, CorridorInfo>,
        corridor_count: u64,
    }
    """)

    pdf.section_title("Corridor (shared)", 3)
    pdf.body_text("The main object representing a trade route. Created per registration.")
    pdf.code_block("""
    struct Corridor has key {
        id: UID,
        name: vector<u8>,           // Human-readable name
        owner: address,             // Operator's address
        fee_recipient: address,     // Where revenue goes
        source_gate_id: ID,         // Gate A
        dest_gate_id: ID,           // Gate B
        depot_a_id: ID,             // SSU A
        depot_b_id: ID,             // SSU B
        status: u8,                 // 0=inactive, 1=active, 2=emergency
        total_jumps: u64,           // Lifetime jump count
        total_trades: u64,          // Lifetime trade count
        total_toll_revenue: u64,    // Lifetime toll revenue (MIST)
        total_trade_revenue: u64,   // Lifetime trade revenue (MIST)
        created_at: u64,            // Timestamp (ms)
        last_activity_at: u64,      // Timestamp (ms)
    }
    """)

    pdf.section_title("CorridorOwnerCap (owned)", 3)
    pdf.body_text("Proof of ownership. Minted to registrant, required for all admin operations.")
    pdf.code_block("""
    struct CorridorOwnerCap has key, store {
        id: UID,
        corridor_id: ID,
    }
    """)

    pdf.check_page_break(60)
    pdf.section_title("Functions", 2)

    pdf.section_title("register_corridor (entry)", 3)
    pdf.body_text(
        "Creates a new corridor in INACTIVE state. Links 2 gates + 2 depots. "
        "Registers in CorridorRegistry. Mints CorridorOwnerCap to sender."
    )
    pdf.code_block("""
    public entry fun register_corridor(
        registry: &mut CorridorRegistry,
        source_gate_id: ID, dest_gate_id: ID,
        depot_a_id: ID, depot_b_id: ID,
        fee_recipient: address,
        name: vector<u8>,
        clock: &Clock, ctx: &mut TxContext,
    )
    """)

    pdf.section_title("activate_corridor / deactivate_corridor (entry)", 3)
    pdf.body_text("Toggle corridor between ACTIVE and INACTIVE. Requires OwnerCap.")

    pdf.section_title("emergency_lock / emergency_unlock (entry)", 3)
    pdf.body_text("Set corridor to EMERGENCY state (blocks all activity) or unlock it.")

    pdf.section_title("record_jump / record_trade (friend only)", 3)
    pdf.body_text(
        "Called by toll_gate and depot modules to update corridor statistics. "
        "Not callable by external packages."
    )

    pdf.section_title("Events", 2)
    pdf.bullet("CorridorCreatedEvent: corridor_id, name, owner, gate IDs, depot IDs")
    pdf.bullet("CorridorStatusChangedEvent: corridor_id, old_status, new_status, actor")

    # --- Module 2: toll_gate ---
    pdf.add_page()
    pdf.section_title("Module 2: toll_gate")
    pdf.body_text(
        "Extends gates with SUI toll payments and surge pricing. Players pay tolls to "
        "receive jump permits that let them travel between solar systems."
    )

    pdf.section_title("Dynamic Field: TollConfig", 2)
    pdf.body_text(
        "Stored on Corridor, keyed by TollConfigKey { gate_id }. Each gate in a corridor "
        "can have its own toll configuration."
    )
    pdf.code_block("""
    struct TollConfig has store {
        toll_amount: u64,        // Base toll in MIST
        surge_active: bool,      // Is surge pricing on?
        surge_numerator: u64,    // Multiplier (10000 = 100%, 15000 = 150%)
    }
    """)

    pdf.section_title("Key Functions", 2)
    pdf.section_title("set_toll_config (owner)", 3)
    pdf.body_text("Set or update the toll amount for a specific gate.")

    pdf.section_title("activate_surge / deactivate_surge (owner)", 3)
    pdf.body_text(
        "Enable/disable surge pricing. When active, effective toll = "
        "(toll_amount * surge_numerator) / 10000."
    )

    pdf.section_title("pay_toll_and_jump (player)", 3)
    pdf.body_text(
        "The main player-facing function. Player sends SUI payment, function verifies "
        "payment >= effective toll, splits overpayment back to player, transfers exact "
        "toll to fee_recipient, and issues a 5-day jump permit via the FenAuth witness."
    )
    pdf.code_block("""
    public entry fun pay_toll_and_jump(
        corridor: &mut Corridor,
        source_gate: &Gate,
        destination_gate: &Gate,
        character: &Character,
        payment: Coin<SUI>,
        clock: &Clock, ctx: &mut TxContext,
    )
    """)

    pdf.section_title("get_effective_toll (view)", 3)
    pdf.body_text("Returns the current toll considering surge pricing. Pure read-only.")

    pdf.section_title("Typed Witness: FenAuth", 2)
    pdf.body_text(
        "FEN uses the typed witness pattern from world-contracts. The FenAuth struct "
        "is a zero-size type that proves to the gate module that FEN is authorized to "
        "issue jump permits. This is the cryptographic handshake between FEN and the "
        "game's gate system."
    )

    pdf.section_title("Events", 2)
    pdf.bullet("TollPaidEvent: corridor_id, gate_id, character_id, amount_paid, payer")
    pdf.bullet("TollConfigUpdatedEvent: corridor_id, gate_id, toll_amount")
    pdf.bullet("SurgeActivatedEvent: corridor_id, gate_id, surge_numerator")
    pdf.bullet("SurgeDeactivatedEvent: corridor_id, gate_id")

    # --- Module 3: depot ---
    pdf.add_page()
    pdf.section_title("Module 3: depot")
    pdf.body_text(
        "Extends SSUs with fixed-ratio item exchange. Players deposit one type of item "
        "and receive another type at a configured exchange rate, minus a fee."
    )

    pdf.section_title("Dynamic Field: DepotConfig", 2)
    pdf.code_block("""
    struct DepotConfig has store {
        input_type_id: u64,       // Item type players bring in
        output_type_id: u64,      // Item type players receive
        ratio_in: u64,            // Input quantity required
        ratio_out: u64,           // Output quantity given
        fee_bps: u64,             // Fee in basis points (250 = 2.5%)
        is_active: bool,          // Can players trade here?
        total_trades: u64,        // Trade counter
        total_volume_in: u64,     // Total input items received
        total_fees_collected: u64, // Total fees taken
    }
    """)

    pdf.section_title("Exchange Math", 2)
    pdf.body_text("Example: ratio_in=3, ratio_out=1, fee_bps=250")
    pdf.bullet("Player deposits 30 Iron (input_type_id matches)")
    pdf.bullet("Output = (30 * 1) / 3 = 10 Steel")
    pdf.bullet("Fee = (10 * 250) / 10000 = 0.25 Steel (rounds down to 0)")
    pdf.bullet("Net output = 10 - 0 = 10 Steel transferred to player")
    pdf.body_text(
        "The depot physically moves items via the SSU: input items are deposited into "
        "the storage unit, and output items are withdrawn from it. The operator must "
        "pre-stock the SSU with output items."
    )

    pdf.section_title("Key Functions", 2)
    pdf.section_title("set_depot_config (owner)", 3)
    pdf.body_text("Configure item types, exchange ratio, and fee for a depot.")

    pdf.section_title("activate_depot / deactivate_depot (owner)", 3)
    pdf.body_text("Enable or disable trading at a specific depot.")

    pdf.section_title("execute_trade (player)", 3)
    pdf.body_text(
        "Player submits an item, receives the exchange output minus fees. Requires "
        "corridor to be ACTIVE and depot to be configured and activated."
    )

    pdf.section_title("Events", 2)
    pdf.bullet("DepotConfigUpdatedEvent: corridor_id, storage_unit_id, types, ratios, fee")
    pdf.bullet("TradeExecutedEvent: corridor_id, storage_unit_id, quantities, fee, trader")
    pdf.bullet("DepotActivatedEvent / DepotDeactivatedEvent: corridor_id, storage_unit_id")

    # --- Module 4: liquidity_pool ---
    pdf.add_page()
    pdf.section_title("Module 4: liquidity_pool (AMM)")
    pdf.body_text(
        "An Automated Market Maker (AMM) that allows players to swap items for SUI and "
        "vice versa. Uses the constant-product formula (x * y = k) - the same math that "
        "powers Uniswap on Ethereum."
    )

    pdf.section_title("How AMM Works", 2)
    pdf.body_text(
        "An AMM pool holds two reserves: SUI and items. The product of these reserves "
        "(reserve_sui * reserve_items) must remain constant after each trade. When a player "
        "buys items with SUI, they add SUI to the pool and remove items. The price is "
        "determined automatically by the ratio of reserves."
    )
    pdf.code_block("""
    Formula: output = (amount_in_after_fee * reserve_out) /
                      (reserve_in + amount_in_after_fee)

    Where: amount_in_after_fee = amount_in * (10000 - fee_bps) / 10000

    Example:
      Pool: 1000 SUI, 10000 items (spot price: 0.1 SUI/item)
      Player sells 100 items:
        after_fee = 100 * (10000 - 300) / 10000 = 97 items
        output = (97 * 1000) / (10000 + 97) = 9.6 SUI
      New reserves: 990.4 SUI, 10100 items
    """)

    pdf.section_title("Dynamic Field: PoolConfig", 2)
    pdf.code_block("""
    struct PoolConfig has store {
        item_type_id: u64,           // Which item this pool trades
        reserve_sui: Balance<SUI>,   // Actual SUI held in pool
        reserve_items: u64,          // Virtual item count (tracked)
        fee_bps: u64,                // Swap fee (max 5000 = 50%)
        is_active: bool,
        total_swaps: u64,
        total_sui_volume: u64,
        total_item_volume: u64,
        total_fees_collected: u64,
    }
    """)

    pdf.section_title("Key Functions", 2)
    pdf.bullet("create_pool (owner) - Initialize with SUI + item reserves, set fee")
    pdf.bullet("activate_pool / deactivate_pool (owner) - Toggle trading")
    pdf.bullet("add_liquidity (owner) - Increase reserves")
    pdf.bullet("remove_liquidity (owner) - Decrease reserves, withdraw SUI")
    pdf.bullet("sell_items (player) - Sell items to pool, receive SUI")
    pdf.bullet("buy_items (player) - Pay SUI, receive items from pool")

    pdf.section_title("Slippage Protection", 2)
    pdf.body_text(
        "Both sell_items and buy_items accept a minimum output parameter (min_sui_out or "
        "min_items_out). If the calculated output falls below this minimum (due to price "
        "movement between submission and execution), the transaction aborts. This protects "
        "players from unfavorable trades."
    )

    pdf.section_title("Price Impact", 2)
    pdf.body_text(
        "Large trades move the price significantly. The price_impact_bps function calculates "
        "the percentage difference between the spot price and execution price. The dashboard "
        "warns users when impact exceeds 5% (yellow) or 15% (red)."
    )

    # --- Module 5: treasury ---
    pdf.add_page()
    pdf.section_title("Module 5: treasury")
    pdf.body_text(
        "A simple SUI vault linked to a corridor. Operators can accumulate toll and trade "
        "revenue here and withdraw it to their fee_recipient address."
    )
    pdf.code_block("""
    struct Treasury has key {
        id: UID,
        corridor_id: ID,
        fee_recipient: address,
        balance: Balance<SUI>,
        total_deposited: u64,
        total_withdrawn: u64,
    }
    """)
    pdf.bullet("create_treasury (owner) - Create a new treasury for a corridor")
    pdf.bullet("deposit (anyone) - Add SUI to the treasury")
    pdf.bullet("withdraw / withdraw_all (owner) - Take SUI out to fee_recipient")
    pdf.bullet("update_fee_recipient (owner) - Change the withdrawal address")

    # --- Module 6: deepbook_adapter ---
    pdf.section_title("Module 6: deepbook_adapter")
    pdf.body_text(
        "Links FEN corridors to DeepBook v3, Sui's native central limit order book (CLOB) "
        "exchange. This enables corridor operators to place limit orders on DeepBook markets, "
        "bridging FEN's in-game economy with Sui DeFi."
    )
    pdf.body_text(
        "The adapter maintains a BalanceManagerRegistry that maps corridor IDs to DeepBook "
        "balance manager objects. Operators link their DeepBook balance managers to their "
        "corridors, then use the adapter to record order events for dashboard display."
    )
    pdf.bullet("link_balance_manager (owner) - Associate a DeepBook balance manager")
    pdf.bullet("unlink_balance_manager (owner) - Remove the association")
    pdf.bullet("record_order_placed (owner) - Log a limit order for indexing")
    pdf.bullet("record_orders_cancelled (owner) - Log order cancellations")

    # --- Error codes reference ---
    pdf.add_page()
    pdf.section_title("Error Code Reference")

    pdf.section_title("corridor errors", 3)
    pdf.bullet("0 ENotOwner - Caller is not the corridor owner")
    pdf.bullet("1 ECorridorNameEmpty - Name cannot be empty")
    pdf.bullet("2 ECorridorAlreadyActive - Already in ACTIVE state")
    pdf.bullet("3 ECorridorNotActive - Not in ACTIVE state")
    pdf.bullet("4 ECorridorEmergencyLocked - Under emergency lockdown")

    pdf.section_title("toll_gate errors", 3)
    pdf.bullet("0 EInsufficientToll - Payment too low")
    pdf.bullet("1 ECorridorNotActive - Corridor not active")
    pdf.bullet("2 EGateMismatch - Gate doesn't belong to corridor")
    pdf.bullet("3 ENotOwner - Not the owner")

    pdf.section_title("depot errors", 3)
    pdf.bullet("0 ENotOwner - Not the owner")
    pdf.bullet("1 ECorridorNotActive - Corridor not active")
    pdf.bullet("2 EDepotMismatch - SSU doesn't belong to corridor")
    pdf.bullet("3 EDepotNotConfigured - Depot config not set yet")
    pdf.bullet("4 EItemTypeMismatch - Wrong item type for this depot")
    pdf.bullet("5 ERatioZero - Exchange ratio cannot be zero")
    pdf.bullet("6 EDepotInactive - Depot is not activated")

    pdf.section_title("liquidity_pool errors", 3)
    pdf.bullet("0 ENotOwner - Not the owner")
    pdf.bullet("1 ECorridorNotActive - Corridor not active")
    pdf.bullet("2 EPoolNotActive - Pool not activated")
    pdf.bullet("3 EDepotMismatch - SSU doesn't belong to corridor")
    pdf.bullet("4 EPoolAlreadyExists - Pool already created")
    pdf.bullet("5 EPoolNotConfigured - Pool doesn't exist")
    pdf.bullet("6 EItemTypeMismatch - Wrong item type")
    pdf.bullet("7 ESlippageExceeded - Output below minimum")
    pdf.bullet("8 EZeroAmount - Amount must be > 0")
    pdf.bullet("9 EInsufficientReserves - Not enough in pool")
    pdf.bullet("11 EFeeTooHigh - Fee > 50%")

    pdf.output(os.path.join(DOCS_DIR, "02_Smart_Contract_Deep_Dive.pdf"))
    print("Generated: 02_Smart_Contract_Deep_Dive.pdf")


# ─────────────────────────────────────────────────────────
# DOCUMENT 3: Dashboard & Frontend Guide
# ─────────────────────────────────────────────────────────
def generate_doc_3():
    pdf = FenPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=25)

    pdf.title_page(
        "Dashboard &\nFrontend Guide",
        "User Interface, Data Flow, and Technical Architecture"
    )

    # --- Tech Stack ---
    pdf.add_page()
    pdf.section_title("Technology Stack")
    pdf.bullet("Framework: Next.js 15 (App Router, React 19)")
    pdf.bullet("Styling: Tailwind CSS with custom EVE Frontier theme")
    pdf.bullet("Blockchain: @mysten/dapp-kit + @mysten/sui v2")
    pdf.bullet("Charts: Recharts")
    pdf.bullet("State: React Query (TanStack) via dApp Kit")
    pdf.bullet("Package Manager: pnpm")

    pdf.section_title("Blockchain Connection", 2)
    pdf.body_text(
        "The dashboard connects to Sui testnet via @mysten/dapp-kit, which provides "
        "React hooks for querying on-chain data (useSuiClientQuery) and signing "
        "transactions (useSignAndExecuteTransaction). The wallet connection uses "
        "Sui's standard wallet adapter."
    )
    pdf.body_text(
        "Server-side API routes use SuiJsonRpcClient from @mysten/sui/jsonRpc to "
        "query events and objects directly. These power the stats dashboard and "
        "activity feeds."
    )

    # --- Pages ---
    pdf.add_page()
    pdf.section_title("Dashboard Pages")

    pdf.section_title("Home Dashboard (/)", 2)
    pdf.body_text(
        "The main overview page. Shows 4 KPI stat cards (active corridors, total jumps, "
        "total trades, total revenue), a 24-hour volume bar chart, a recent activity feed "
        "with event icons, and a top corridors table sorted by revenue."
    )
    pdf.body_text(
        "Data flows from two sources: client-side hooks (useCorridors, useActivity) that "
        "query Sui directly, and server-side API routes (/api/stats, /api/activity) that "
        "aggregate event data."
    )

    pdf.section_title("Corridor Browser (/corridors)", 2)
    pdf.body_text(
        "Lists all registered corridors as cards. Each card shows corridor name, status "
        "badge (active/inactive/emergency), the route (source -> destination), depot pair "
        "information, and lifetime statistics. Clicking a card navigates to the detail page."
    )

    pdf.section_title("Corridor Detail (/corridors/[id])", 2)
    pdf.body_text(
        "Detailed view of a single corridor. Features a 5-column route visualization "
        "(Gate A -> Depot A <-> Depot B <- Gate B), comprehensive statistics, AMM pool "
        "information (reserves, spot price, volume), and a corridor-specific activity feed."
    )
    pdf.body_text(
        "All object IDs link to Sui Explorer (suiscan.xyz) for on-chain verification."
    )

    pdf.section_title("Trade Routes (/trade)", 2)
    pdf.body_text(
        "A route discovery tool. Shows a sortable table of all active trade routes with "
        "exchange rates, toll costs, fees, and available liquidity. Includes a trade "
        "calculator that estimates output for a given input quantity, showing the complete "
        "cost breakdown (toll + exchange + fees)."
    )

    pdf.section_title("AMM Swap (/swap)", 2)
    pdf.body_text(
        "A DEX-style swap interface for AMM pools. Players select a pool, choose swap "
        "direction (buy or sell items), enter an amount, and see real-time output estimates "
        "with price impact warnings. Supports configurable slippage tolerance."
    )

    pdf.section_title("Operator Panel (/operate)", 2)
    pdf.body_text(
        "The control panel for corridor operators. Provides forms for: registering new "
        "corridors, setting toll configurations, configuring depot exchange rates, "
        "managing AMM pools, activating/deactivating corridors and depots, toggling surge "
        "pricing, and withdrawing revenue. All operations require a connected wallet "
        "with the appropriate CorridorOwnerCap."
    )

    # --- Data Flow ---
    pdf.add_page()
    pdf.section_title("Data Flow Architecture")
    pdf.code_block("""
    +------------------+     +-------------------+     +------------------+
    |   Sui Testnet    |     |  Next.js Server   |     |  React Frontend  |
    |   (blockchain)   |     |  (API routes)     |     |  (browser)       |
    +------------------+     +-------------------+     +------------------+
    | Corridor objects | <-- | /api/stats        | <-- | useDashboardStats|
    | Events (13 types)| <-- | /api/activity     | <-- | useChartData     |
    | Dynamic fields   | <---+-------------------+--> | useCorridors     |
    | CorridorOwnerCaps|                          <-- | useCorridor      |
    +------------------+                               | useActivity     |
                                                       | usePoolConfigs   |
                                                       | useTradeRoutes   |
                                                       +------------------+
    """)

    pdf.section_title("Server-Side: /api/stats", 2)
    pdf.body_text(
        "Queries CorridorCreatedEvent to discover all corridor IDs, fetches each corridor "
        "object for aggregate stats, then queries TollPaid, TradeExecuted, and Swap events "
        "for 24-hour activity counts and hourly chart data."
    )

    pdf.section_title("Server-Side: /api/activity", 2)
    pdf.body_text(
        "Queries all 13 FEN event types in parallel, maps each to a human-readable "
        "description, supports filtering by corridorId and limiting results. Returns "
        "events sorted by timestamp descending."
    )

    pdf.section_title("Client-Side Hooks", 2)
    pdf.body_text("The dashboard uses React hooks that query Sui directly via dApp Kit:")
    pdf.bullet("useCorridors() - Discovers corridors via events, fetches objects, enriches with dynamic fields")
    pdf.bullet("useCorridor(id) - Fetches a single corridor with full enrichment")
    pdf.bullet("usePoolConfigs() - Reads PoolConfig dynamic fields for AMM data")
    pdf.bullet("useActivity() - Queries events from multiple modules")
    pdf.bullet("useDashboardStats() - Aggregates KPIs from API + client data")
    pdf.bullet("useTradeRoutes() - Derives trade routes from active corridor depots")

    # --- EVE Theme ---
    pdf.section_title("Visual Design", 2)
    pdf.body_text(
        "The dashboard uses a dark theme inspired by EVE Frontier's sci-fi aesthetic. "
        "Custom Tailwind CSS variables define the color palette:"
    )
    pdf.bullet("eve-orange (#d4600a) - Primary actions, buttons, highlights")
    pdf.bullet("eve-blue (#60a5fa) - Secondary elements, links")
    pdf.bullet("eve-green (#34d399) - Success states, active badges")
    pdf.bullet("eve-red (#ff6b6b) - Danger, emergency status")
    pdf.bullet("eve-yellow (#fbbf24) - Warnings, pending states")
    pdf.bullet("Dark surfaces with subtle borders for depth")

    # --- Components ---
    pdf.add_page()
    pdf.section_title("Key Components")

    pdf.section_title("StatsGrid", 3)
    pdf.body_text("4-column grid of KPI cards showing active corridors, jumps, trades, revenue.")

    pdf.section_title("VolumeChart", 3)
    pdf.body_text("Recharts bar chart displaying 24 hours of jump and trade volume data.")

    pdf.section_title("TopCorridors", 3)
    pdf.body_text("Sortable table of corridors ranked by total revenue.")

    pdf.section_title("RecentActivity", 3)
    pdf.body_text("Event feed with typed icons (jump, trade, config change, emergency).")

    pdf.section_title("Sidebar / Header", 3)
    pdf.body_text(
        "Navigation sidebar with 5 routes (Dashboard, Corridors, Trade, Swap, Operate). "
        "Mobile-responsive with hamburger menu. Header includes wallet connect button "
        "and network indicator."
    )

    pdf.section_title("Toast System", 3)
    pdf.body_text(
        "Context-based notification system for transaction feedback. Shows success/error "
        "toasts with Sui Explorer links for transaction digests."
    )

    pdf.section_title("Skeleton Loaders", 3)
    pdf.body_text(
        "Shimmer/pulse loading states for all data-driven components. Provides visual "
        "feedback while blockchain queries are in flight."
    )

    pdf.output(os.path.join(DOCS_DIR, "03_Dashboard_and_Frontend_Guide.pdf"))
    print("Generated: 03_Dashboard_and_Frontend_Guide.pdf")


# ─────────────────────────────────────────────────────────
# DOCUMENT 4: How Everything Connects
# ─────────────────────────────────────────────────────────
def generate_doc_4():
    pdf = FenPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=25)

    pdf.title_page(
        "How Everything\nConnects",
        "End-to-End Walkthrough: From Registration to Revenue"
    )

    # --- Lifecycle ---
    pdf.add_page()
    pdf.section_title("Corridor Lifecycle")
    pdf.body_text(
        "This section walks through the complete lifecycle of a trade corridor, from "
        "creation to generating revenue."
    )

    pdf.section_title("Step 1: Operator Sets Up Game Objects", 2)
    pdf.body_text(
        "Before registering a corridor, the operator needs to have deployed game objects "
        "in EVE Frontier:"
    )
    pdf.bullet("2 Gates - deployed in different solar systems (these are the jump points)")
    pdf.bullet("2 Storage Units (SSUs) - deployed near each gate (these become depots)")
    pdf.body_text(
        "These are world-contracts assemblies. The operator gets their object IDs from "
        "the game client or Sui Explorer."
    )

    pdf.section_title("Step 2: Register the Corridor", 2)
    pdf.body_text("The operator calls register_corridor with:")
    pdf.bullet("source_gate_id and dest_gate_id (the 2 gate object IDs)")
    pdf.bullet("depot_a_id and depot_b_id (the 2 SSU object IDs)")
    pdf.bullet("fee_recipient (address where revenue should go)")
    pdf.bullet("name (human-readable corridor name, e.g., 'Helios Trade Route')")
    pdf.body_text(
        "This creates a shared Corridor object in INACTIVE state and gives the operator "
        "a CorridorOwnerCap. The corridor is registered in the global CorridorRegistry."
    )

    pdf.section_title("Step 3: Configure Tolls", 2)
    pdf.body_text("Using set_toll_config, the operator sets toll amounts for each gate:")
    pdf.bullet("Source gate: 0.1 SUI (100,000,000 MIST)")
    pdf.bullet("Dest gate: 0.05 SUI (50,000,000 MIST)")
    pdf.body_text(
        "This creates TollConfig dynamic fields on the Corridor object. Optionally, "
        "the operator can activate surge pricing for high-demand periods."
    )

    pdf.section_title("Step 4: Configure Depots", 2)
    pdf.body_text(
        "Using set_depot_config, the operator configures item exchange at each depot:"
    )
    pdf.bullet("Depot A: Iron (type 101) -> Steel (type 201), 3:1 ratio, 2.5% fee")
    pdf.bullet("Depot B: Steel (type 201) -> Iron (type 101), 1:2 ratio, 1% fee")
    pdf.body_text(
        "The operator must also stock each SSU with the output items. If Depot A gives "
        "Steel, the operator must deposit Steel into SSU A."
    )

    pdf.check_page_break(50)
    pdf.section_title("Step 5: (Optional) Create AMM Pools", 2)
    pdf.body_text(
        "For more sophisticated trading, the operator can create AMM pools on their depots. "
        "This requires depositing initial SUI and declaring initial item reserves."
    )
    pdf.bullet("create_pool: Set initial SUI, item count, and fee")
    pdf.bullet("activate_pool: Enable trading")
    pdf.body_text(
        "AMM pools provide dynamic pricing based on supply/demand, complementing "
        "the fixed-ratio depot exchange."
    )

    pdf.section_title("Step 6: Activate Everything", 2)
    pdf.bullet("activate_depot (for each depot)")
    pdf.bullet("activate_corridor (enables gate jumps and trading)")
    pdf.body_text("The corridor is now live and visible to all players.")

    pdf.section_title("Step 7: Players Use the Corridor", 2)

    pdf.section_title("Gate Jump Flow", 3)
    pdf.code_block("""
    1. Player visits /trade or /corridors to find routes
    2. Player selects a corridor and clicks "Jump"
    3. Frontend builds pay_toll_and_jump PTB:
       - Splits payment Coin (toll amount in SUI)
       - Calls toll_gate::pay_toll_and_jump
    4. On-chain:
       - Verifies payment >= effective toll
       - Returns overpayment to player
       - Transfers toll to fee_recipient
       - Issues JumpPermit (valid 5 days)
       - Updates corridor stats (total_jumps, total_toll_revenue)
       - Emits TollPaidEvent
    5. Player uses JumpPermit to travel through the gate
    """)

    pdf.section_title("Depot Trade Flow", 3)
    pdf.code_block("""
    1. Player has items to exchange (e.g., 30 Iron)
    2. Player calls depot::execute_trade
    3. On-chain:
       - Validates item type matches depot config
       - Calculates output: (30 * 1) / 3 = 10 Steel
       - Calculates fee: (10 * 250) / 10000 = 0 (rounded down)
       - Deposits 30 Iron into SSU via FenAuth
       - Withdraws 10 Steel from SSU
       - Transfers Steel to player
       - Updates depot and corridor stats
       - Emits TradeExecutedEvent
    """)

    pdf.section_title("AMM Swap Flow", 3)
    pdf.code_block("""
    1. Player visits /swap, selects pool, enters amount
    2. Frontend shows estimated output + price impact
    3. Player confirms swap with slippage tolerance
    4. On-chain (sell_items example):
       - Deposits items into SSU
       - Calculates SUI output via x*y=k formula
       - Checks slippage: output >= min_sui_out
       - Transfers SUI from pool to player
       - Updates reserves and stats
       - Emits SwapEvent
    """)

    pdf.add_page()
    pdf.section_title("Step 8: Operator Collects Revenue", 2)
    pdf.body_text(
        "Revenue accumulates in two places: tolls go directly to fee_recipient, "
        "and trade/swap fees are tracked on the corridor and pool objects. "
        "The operator can also use the Treasury module to accumulate and withdraw SUI."
    )

    # --- Event Indexing ---
    pdf.section_title("Event Indexing System")
    pdf.body_text(
        "FEN emits 13 distinct event types across its modules. The dashboard indexes "
        "these events to build activity feeds, charts, and statistics."
    )

    pdf.section_title("All Event Types", 2)
    pdf.code_block("""
    corridor::CorridorCreatedEvent
    corridor::CorridorStatusChangedEvent
    toll_gate::TollPaidEvent
    toll_gate::TollConfigUpdatedEvent
    toll_gate::SurgeActivatedEvent
    toll_gate::SurgeDeactivatedEvent
    depot::TradeExecutedEvent
    depot::DepotConfigUpdatedEvent
    depot::DepotActivatedEvent
    depot::DepotDeactivatedEvent
    liquidity_pool::PoolCreatedEvent
    liquidity_pool::SwapEvent
    liquidity_pool::LiquidityChangedEvent
    """)

    pdf.body_text(
        "The server-side API routes query these events from Sui's JSON-RPC endpoint, "
        "aggregate them into dashboard-friendly formats, and serve them to the frontend. "
        "This approach works without a separate database - the blockchain IS the database."
    )

    # --- Full architecture diagram ---
    pdf.add_page()
    pdf.section_title("Full System Architecture")
    pdf.code_block("""
    EVE FRONTIER GAME WORLD
    +------------------------------------------------------------------+
    |  Solar System A              |  Solar System B                    |
    |  [Gate A] [SSU A]           |  [Gate B] [SSU B]                 |
    |     |        |               |     |        |                    |
    +-----|--------|---------------|-----|--------|--------------------+
          |        |               |     |        |
    FEN SMART CONTRACTS (Sui Move)
    +-----|--------|---------------|-----|--------|--------------------+
    |     v        v               v     v        v                    |
    |  corridor.move  <-- Shared Corridor Object -->                   |
    |     |                                                            |
    |     +-- toll_gate.move (TollConfig DFs, pay_toll_and_jump)       |
    |     +-- depot.move (DepotConfig DFs, execute_trade)              |
    |     +-- liquidity_pool.move (PoolConfig DFs, sell/buy)           |
    |     +-- treasury.move (SUI vault)                                |
    |     +-- deepbook_adapter.move (CLOB bridge)                      |
    |                                                                  |
    |  Events --> 13 event types emitted on every action               |
    +------------------------------------------------------------------+
          |                    |
    NEXT.JS DASHBOARD
    +-----|--------------------|-----------------------------------------+
    |     v                    v                                         |
    |  /api/stats          /api/activity     (Server-side routes)       |
    |     |                    |                                         |
    |     v                    v                                         |
    |  React Hooks (useCorridors, useActivity, useDashboardStats)       |
    |     |                                                              |
    |     v                                                              |
    |  Pages: Dashboard | Corridors | Trade | Swap | Operate            |
    +--------------------------------------------------------------------+
          |
    USER'S BROWSER
    +--------------------------------------------------------------------+
    |  Wallet Connection (Sui Wallet Standard)                           |
    |  Transaction Signing (PTBs built client-side)                      |
    |  On-chain data displayed in real-time                              |
    +--------------------------------------------------------------------+
    """)

    pdf.output(os.path.join(DOCS_DIR, "04_How_Everything_Connects.pdf"))
    print("Generated: 04_How_Everything_Connects.pdf")


# ─────────────────────────────────────────────────────────
# DOCUMENT 5: Testing & Deployment
# ─────────────────────────────────────────────────────────
def generate_doc_5():
    pdf = FenPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=25)

    pdf.title_page(
        "Testing &\nDeployment",
        "Test Suite, Deployment History, and Testnet Corridors"
    )

    pdf.add_page()
    pdf.section_title("Test Suite Overview")
    pdf.body_text(
        "FEN has 78 Move tests across 5 test files. Tests cover corridor lifecycle, "
        "toll configuration, depot exchanges, AMM math, and treasury operations."
    )

    pdf.section_title("Test Files", 2)
    pdf.key_value("corridor_tests.move", "5 tests")
    pdf.key_value("toll_gate_tests.move", "15 tests")
    pdf.key_value("depot_tests.move", "19 tests")
    pdf.key_value("liquidity_pool_tests.move", "36 tests")
    pdf.key_value("treasury_tests.move", "3 tests")
    pdf.key_value("Total", "78 tests")

    pdf.section_title("What the Tests Cover", 2)

    pdf.section_title("Corridor Tests (5)", 3)
    pdf.bullet("Register a corridor and verify all fields")
    pdf.bullet("Activate/deactivate lifecycle transitions")
    pdf.bullet("Emergency lock and unlock")
    pdf.bullet("Update fee recipient")
    pdf.bullet("Registry count tracking")

    pdf.section_title("Toll Gate Tests (15)", 3)
    pdf.bullet("Set toll config for source and dest gates")
    pdf.bullet("Get effective toll with and without surge")
    pdf.bullet("Activate surge with various multipliers (1.5x, 2x, 3x)")
    pdf.bullet("Deactivate surge and verify return to base toll")
    pdf.bullet("Zero toll configuration")
    pdf.bullet("Wrong gate ID rejection")
    pdf.bullet("Wrong owner cap rejection")

    pdf.section_title("Depot Tests (19)", 3)
    pdf.bullet("Set depot config for both depots")
    pdf.bullet("Various exchange ratios (1:1, 3:1, 1:2)")
    pdf.bullet("Fee validation (0%, 2.5%, max)")
    pdf.bullet("Activate/deactivate depot")
    pdf.bullet("Update existing config")
    pdf.bullet("Status change tracking")
    pdf.bullet("Wrong depot ID rejection")
    pdf.bullet("Wrong owner cap rejection")
    pdf.bullet("Unconfigured depot rejection")

    pdf.section_title("Liquidity Pool Tests (36)", 3)
    pdf.bullet("AMM output calculation with various reserves and fees")
    pdf.bullet("Large value overflow protection (u128 intermediates)")
    pdf.bullet("Edge cases: zero fees, max fees, single item trades")
    pdf.bullet("Spot price calculation")
    pdf.bullet("Price impact calculation")
    pdf.bullet("Pool creation with initial reserves")
    pdf.bullet("Pool lifecycle (create, activate, deactivate)")
    pdf.bullet("Add/remove liquidity")
    pdf.bullet("Buy and sell items via test helpers")
    pdf.bullet("Fee collection tracking")
    pdf.bullet("Reserve updates after swaps")

    pdf.section_title("Treasury Tests (3)", 3)
    pdf.bullet("Create treasury linked to corridor")
    pdf.bullet("Deposit and withdraw SUI")
    pdf.bullet("Withdraw all balance")

    pdf.check_page_break(50)
    pdf.section_title("Running Tests", 2)
    pdf.code_block("""
    cd contracts/fen
    sui move test

    # Expected output:
    # Running Move unit tests
    # [ PASS ] ... (78 tests)
    # Test result: OK. Total tests: 78; passed: 78; failed: 0
    """)

    # --- Deployment ---
    pdf.add_page()
    pdf.section_title("Deployment")

    pdf.section_title("Testnet Deployment (March 10, 2026)", 2)
    pdf.body_text("The FEN package was deployed to Sui testnet with the following objects:")
    pdf.ln(3)
    pdf.key_value("Package ID", "0xb05f71ab...dc20f09")
    pdf.key_value("CorridorRegistry", "0xe01806aa...dc3ce1b2d")
    pdf.key_value("BalanceManagerRegistry", "0x27d5587b...29852920")
    pdf.key_value("Deployer", "0x33a514d9...fb48eeb")
    pdf.key_value("TX Digest", "HSkM4yca7quv3R9DBY7Egyk...")

    pdf.section_title("Published Modules", 2)
    pdf.bullet("corridor - Core corridor registry and lifecycle")
    pdf.bullet("toll_gate - Gate toll payments with surge pricing")
    pdf.bullet("depot - Item exchange at fixed ratios")
    pdf.bullet("treasury - SUI vault for revenue")
    pdf.bullet("liquidity_pool - AMM constant-product swap")
    pdf.bullet("deepbook_adapter - DeepBook v3 CLOB bridge")

    pdf.section_title("Registered Test Corridors", 2)
    pdf.body_text(
        "Two test corridors were registered on testnet to demonstrate end-to-end "
        "functionality:"
    )

    pdf.section_title("Helios Corridor", 3)
    pdf.key_value("Object ID", "0x60bba1b7...e51cd5b")
    pdf.key_value("OwnerCap", "0x23a2...c486")
    pdf.body_text("Fully configured: tolls set, depots configured, depots activated, corridor activated, surge active on source gate.")

    pdf.section_title("Prometheus Route", 3)
    pdf.key_value("Object ID", "0xdc7933...a497e5")
    pdf.key_value("OwnerCap", "0xd56d...87c8")
    pdf.body_text("Fully configured: tolls set, depots configured, depots activated, corridor activated.")

    pdf.output(os.path.join(DOCS_DIR, "05_Testing_and_Deployment.pdf"))
    print("Generated: 05_Testing_and_Deployment.pdf")


# ─────────────────────────────────────────────────────────
# DOCUMENT 6: Hackathon Strategy & Roadmap
# ─────────────────────────────────────────────────────────
def generate_doc_6():
    pdf = FenPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=25)

    pdf.title_page(
        "Hackathon Strategy\n& Roadmap",
        "Prize Targeting, Timeline, and Contribution Plan"
    )

    pdf.add_page()
    pdf.section_title("Hackathon: EVE Frontier x Sui 2026")

    pdf.section_title("Competition Details", 2)
    pdf.key_value("Dates", "March 11-31, 2026")
    pdf.key_value("Winners Announced", "April 24, 2026")
    pdf.key_value("Theme", "A Toolkit for Civilization")
    pdf.key_value("Total Prize Pool", "$80,000 USD")
    pdf.key_value("Registration", "deepsurge.xyz/evefrontier2026")

    pdf.section_title("Prize Categories", 2)
    pdf.bullet("1st Place: $15,000 - Must be a deployable Sui Move package")
    pdf.bullet("2nd Place: $10,000")
    pdf.bullet("3rd Place: $5,000")
    pdf.bullet("Best Contribution: $15,000 - PRs to world-contracts repo")
    pdf.bullet("Best DeFi Extension: $10,000 - Financial game mechanics")
    pdf.bullet("Best Social Extension: $10,000 - Community/governance features")
    pdf.bullet("Best Use of DeepBook: $10,000 - DeepBook v3 integration")
    pdf.bullet("Community Choice: $5,000 - Voted by community")

    pdf.section_title("FEN's Prize Targets", 2)
    pdf.body_text("FEN is positioned to compete in multiple categories:")

    pdf.section_title("Primary: 1st Place ($15,000)", 3)
    pdf.body_text(
        "FEN is a complete, deployable Sui Move package with 6 modules, 78 tests, "
        "and a working dashboard. The corridor system is novel game infrastructure "
        "that doesn't exist in EVE Frontier yet."
    )

    pdf.section_title("Secondary: Best DeFi Extension ($10,000)", 3)
    pdf.body_text(
        "FEN has three DeFi mechanisms: toll payments, depot exchanges with fees, "
        "and AMM liquidity pools with constant-product math. This is genuine financial "
        "infrastructure for the game."
    )

    pdf.section_title("Tertiary: Best Use of DeepBook ($10,000)", 3)
    pdf.body_text(
        "The deepbook_adapter module bridges corridors to DeepBook v3's CLOB, allowing "
        "operators to place limit orders on Sui's native DEX."
    )

    pdf.section_title("Bonus: Best Contribution ($15,000)", 3)
    pdf.body_text(
        "world-contracts has open issues (#44, #45, #46) that are directly relevant to "
        "FEN's depot and inventory mechanics. Contributing PRs here strengthens both "
        "FEN and the hackathon submission."
    )

    # --- Roadmap ---
    pdf.add_page()
    pdf.section_title("Development Progress")

    pdf.section_title("Completed", 2)
    pdf.bullet("6 Move modules written and deployed to Sui testnet")
    pdf.bullet("78 Move tests passing across 5 test files")
    pdf.bullet("Next.js 15 dashboard with 5 pages and wallet integration")
    pdf.bullet("Server-side event indexer (API routes for stats + activity)")
    pdf.bullet("Client-side hooks with dynamic field enrichment")
    pdf.bullet("PTB (Programmable Transaction Block) builders for all operations")
    pdf.bullet("2 test corridors registered and configured on testnet")
    pdf.bullet("Toast notification system with Sui Explorer links")
    pdf.bullet("Skeleton loading states for all data components")
    pdf.bullet("Mobile-responsive sidebar with hamburger menu")
    pdf.bullet("AMM swap interface with price impact warnings")

    pdf.section_title("Remaining Work", 2)
    pdf.bullet("Vercel deployment (dashboard to public URL)")
    pdf.bullet("Demo video recording")
    pdf.bullet("world-contracts PR contributions")
    pdf.bullet("End-to-end integration testing with real game objects")
    pdf.bullet("Polish: loading states, error handling, edge cases")

    # --- Project structure ---
    pdf.add_page()
    pdf.section_title("Repository Structure")
    pdf.code_block("""
    eve-hackathon/
    |-- contracts/fen/
    |   |-- Move.toml              # Package manifest + dependencies
    |   |-- DEPLOYMENT.md          # Testnet deployment details
    |   |-- sources/
    |   |   |-- corridor.move      # Core corridor registry
    |   |   |-- toll_gate.move     # Gate toll payments
    |   |   |-- depot.move         # Item exchange
    |   |   |-- treasury.move      # SUI vault
    |   |   |-- liquidity_pool.move # AMM swap
    |   |   |-- deepbook_adapter.move # DeepBook bridge
    |   |-- tests/
    |       |-- corridor_tests.move
    |       |-- toll_gate_tests.move
    |       |-- depot_tests.move
    |       |-- treasury_tests.move
    |       |-- liquidity_pool_tests.move
    |
    |-- dashboard/
    |   |-- src/app/               # Next.js pages
    |   |-- src/components/        # React components
    |   |-- src/hooks/             # Sui data hooks
    |   |-- src/lib/               # Types, utils, PTB builders
    |   |-- package.json
    |   |-- tailwind.config.ts
    |
    |-- docs/                      # PDF documentation
    |-- scripts/setup.sh           # Dev environment setup
    |-- README.md                  # Project overview
    """)

    pdf.section_title("Key Files Quick Reference", 2)
    pdf.bullet("Smart contracts: contracts/fen/sources/*.move")
    pdf.bullet("Types: dashboard/src/lib/types.ts")
    pdf.bullet("PTB builders: dashboard/src/lib/transactions.ts")
    pdf.bullet("Data hooks: dashboard/src/hooks/use-corridors.ts")
    pdf.bullet("Network config: dashboard/src/lib/sui-config.ts")
    pdf.bullet("API routes: dashboard/src/app/api/stats/route.ts, .../activity/route.ts")
    pdf.bullet("Deployed IDs: contracts/fen/DEPLOYMENT.md")

    pdf.output(os.path.join(DOCS_DIR, "06_Hackathon_Strategy_and_Roadmap.pdf"))
    print("Generated: 06_Hackathon_Strategy_and_Roadmap.pdf")


# ─────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating FEN documentation PDFs...")
    print()
    generate_doc_1()
    generate_doc_2()
    generate_doc_3()
    generate_doc_4()
    generate_doc_5()
    generate_doc_6()
    print()
    print("All documents generated in:", DOCS_DIR)
