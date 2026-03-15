#!/usr/bin/env python3
"""Generate the FEN Implementation Plan PDF."""

import os
import sys

# Add docs dir for imports if needed
DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DOCS_DIR)

from fpdf import FPDF
import textwrap


class PlanPDF(FPDF):
    """Custom PDF for the implementation plan."""

    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "FEN Implementation Plan - EVE Frontier x Sui 2026 Hackathon", align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def title_page(self, title, subtitle=""):
        self.add_page()
        self.ln(50)
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(20, 20, 80)
        self.multi_cell(0, 14, title, align="C")
        self.ln(8)
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
        self.cell(0, 8, "March 11-31, 2026 | 20 Days Remaining", align="C")

    def section_title(self, title, level=1):
        self.check_page_break(20)
        if level == 1:
            self.set_font("Helvetica", "B", 18)
            self.set_text_color(20, 20, 80)
            self.ln(8)
            self.cell(0, 12, title)
            self.ln(4)
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

    def bold_text(self, text):
        self.set_font("Helvetica", "B", 10)
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

    def numbered_item(self, number, text, indent=10):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 100)
        x = self.get_x()
        self.set_x(x + indent)
        self.cell(8, 5.5, f"{number}.")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def code_block(self, text):
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(240, 240, 245)
        self.set_text_color(30, 30, 30)
        self.ln(2)
        for line in text.strip().split("\n"):
            if len(line) > 95:
                line = line[:92] + "..."
            self.cell(0, 4.5, "  " + line, fill=True)
            self.ln()
        self.ln(3)

    def key_value(self, key, value):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 100)
        kw = 55
        self.cell(kw, 6, key + ":")
        self.set_font("Courier", "", 9)
        self.set_text_color(30, 30, 30)
        self.cell(0, 6, str(value))
        self.ln(6)

    def status_row(self, area, status, done=True):
        self.set_font("Helvetica", "", 10)
        if done:
            self.set_text_color(0, 120, 0)
            mark = "[DONE]"
        else:
            self.set_text_color(180, 0, 0)
            mark = "[TODO]"
        self.cell(8, 5.5, mark)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 30, 30)
        self.cell(60, 5.5, area)
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 5.5, status)
        self.ln(1)

    def info_box(self, title, text):
        self.ln(3)
        self.set_fill_color(230, 240, 255)
        self.set_draw_color(100, 130, 200)
        self.set_line_width(0.3)
        x = self.get_x()
        y = self.get_y()
        self.set_font("Helvetica", "", 9)
        lines = len(textwrap.wrap(text, width=85)) + 2
        h = max(lines * 5 + 10, 20)
        if y + h > self.h - 30:
            self.add_page()
            y = self.get_y()
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

    def warning_box(self, title, text):
        self.ln(3)
        self.set_fill_color(255, 245, 230)
        self.set_draw_color(200, 150, 50)
        self.set_line_width(0.3)
        x = self.get_x()
        y = self.get_y()
        self.set_font("Helvetica", "", 9)
        lines = len(textwrap.wrap(text, width=85)) + 2
        h = max(lines * 5 + 10, 20)
        if y + h > self.h - 30:
            self.add_page()
            y = self.get_y()
        self.rect(x, y, self.w - self.l_margin - self.r_margin, h, "DF")
        self.set_xy(x + 5, y + 3)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(180, 100, 0)
        self.cell(0, 5, title)
        self.ln(6)
        self.set_x(x + 5)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(60, 40, 0)
        self.multi_cell(self.w - self.l_margin - self.r_margin - 10, 5, text)
        self.set_y(y + h + 3)

    def table_header(self, cols, widths):
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(40, 40, 100)
        self.set_text_color(255, 255, 255)
        for i, col in enumerate(cols):
            self.cell(widths[i], 7, col, border=1, fill=True, align="C")
        self.ln()

    def table_row(self, cols, widths, highlight=False):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 30, 30)
        if highlight:
            self.set_fill_color(245, 245, 255)
        else:
            self.set_fill_color(255, 255, 255)
        max_h = 7
        for i, col in enumerate(cols):
            self.cell(widths[i], max_h, col, border=1, fill=True)
        self.ln()

    def check_page_break(self, h=40):
        if self.get_y() + h > self.h - 30:
            self.add_page()


def generate():
    pdf = PlanPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=25)

    # ================================================================
    # TITLE PAGE
    # ================================================================
    pdf.title_page(
        "FEN Implementation Plan",
        "All Remaining Steps to Ship & Win"
    )

    # ================================================================
    # PAGE: CURRENT STATE AUDIT
    # ================================================================
    pdf.add_page()
    pdf.section_title("Current State Audit")

    pdf.body_text(
        "Before planning next steps, here is an honest assessment of what exists today "
        "and what remains. The project has strong foundations but has never been tested "
        "end-to-end with real on-chain data."
    )

    pdf.section_title("What's DONE", level=2)

    pdf.check_page_break(60)
    w = [60, 120]
    pdf.table_header(["Area", "Status"], w)
    rows = [
        ("Move Contracts", "6 modules deployed to Sui testnet"),
        ("Move Tests", "116 passing (corridor 15, toll_gate 13, depot 17, pool 45, treasury 8, deepbook 10)"),
        ("Dashboard Pages", "6 routes: /, /corridors, /corridors/[id], /trade, /swap, /operate"),
        ("Wallet Integration", "ConnectButton, useCurrentAccount, useSignAndExecuteTransaction"),
        ("PTB Builders", "30+ functions in transactions.ts covering all 6 modules"),
        ("Hooks (Data)", "useCorridors, useCorridor, usePoolConfigs, useDashboardStats, useActivity, etc."),
        ("Hooks (Tx)", "useRegisterCorridor, useSetTollConfig, useSurgeControl, useDepotConfig, etc."),
        ("Dynamic Fields", "TollConfig, DepotConfig, PoolConfig read from chain"),
        ("OwnerCap Discovery", "Wallet-aware, auto-maps caps to corridors"),
        ("Assembly Picker", "Dropdown for owned Gates/SSUs with manual fallback"),
        ("API Routes", "/api/stats and /api/activity server-side event aggregation"),
        ("PDF Docs", "6 comprehensive guides covering all project aspects"),
        ("UI Polish", "Skeleton loaders, toasts, mobile sidebar, explorer links"),
    ]
    for i, (area, status) in enumerate(rows):
        pdf.table_row([area, status], w, highlight=(i % 2 == 0))

    pdf.section_title("What's NOT Done", level=2)

    pdf.check_page_break(50)
    w2 = [60, 80, 40]
    pdf.table_header(["Item", "Description", "Priority"], w2)
    todo_rows = [
        ("Test Corridor", "No corridor registered on-chain", "P0"),
        ("End-to-End Proof", "System never tested with real data", "P0"),
        ("Vercel Deployment", "Dashboard not deployed publicly", "P0"),
        ("Trade Execution", "Composite PTB for toll+trade flow", "P1"),
        ("AMM Swap UX", "Connect swap page to real pool data", "P1"),
        ("Demo Video", "2-3 minute walkthrough for submission", "P1"),
        ("Operator Wizard", "Guided post-registration setup flow", "P2"),
        ("Event Indexer", "gRPC/polling indexer for time-series", "P2"),
        ("Price Charts", "AMM price history from swap events", "P3"),
        ("World-Contracts PR", "Contribution to ecosystem repo", "P3"),
        ("Stillness Demo", "Real assemblies in game client", "P4"),
    ]
    for i, (item, desc, pri) in enumerate(todo_rows):
        pdf.table_row([item, desc, pri], w2, highlight=(i % 2 == 0))

    # ================================================================
    # PHASE 1: PROVE IT WORKS
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 1: Prove It Works (Days 1-2)")

    pdf.warning_box(
        "CRITICAL - Nothing else matters until this is done",
        "No corridor exists on-chain. The system has never been tested end-to-end. "
        "Judges will ask 'does it work?' before looking at anything else. One working "
        "corridor with real transactions beats 10 unfinished features."
    )

    pdf.section_title("1.1 Register a Test Corridor on Sui Testnet", level=2)
    pdf.body_text(
        "Use the Sui CLI with the deployer wallet to call corridor::register_corridor. "
        "Use placeholder gate/depot IDs (or real Stillness IDs if accessible)."
    )
    pdf.code_block(
        "sui client call --package $PKG --module corridor \\\n"
        "  --function register_corridor \\\n"
        "  --args $REGISTRY $SOURCE_GATE $DEST_GATE $DEPOT_A $DEPOT_B \\\n"
        "         $FEE_ADDR \"[72,101,108,105,111,115]\" $CLOCK"
    )
    pdf.body_text("Save the resulting Corridor object ID and CorridorOwnerCap ID.")

    pdf.section_title("1.2 Configure the Test Corridor", level=2)
    pdf.body_text("Run these transactions sequentially using the CorridorOwnerCap:")
    pdf.numbered_item(1, "toll_gate::set_toll_config on Gate A (e.g. 100,000,000 MIST = 0.1 SUI per jump)")
    pdf.numbered_item(2, "toll_gate::set_toll_config on Gate B")
    pdf.numbered_item(3, "depot::set_depot_config on Depot A (pick item type IDs, ratio 1:1, fee 300 bps)")
    pdf.numbered_item(4, "depot::set_depot_config on Depot B")
    pdf.numbered_item(5, "liquidity_pool::create_pool on Depot A (AMM with 1 SUI initial liquidity)")
    pdf.numbered_item(6, "depot::activate_depot on both depots")
    pdf.numbered_item(7, "liquidity_pool::activate_pool")
    pdf.numbered_item(8, "corridor::activate_corridor")

    pdf.section_title("1.3 Execute Test Transactions", level=2)
    pdf.body_text("From a second wallet (or the same wallet), execute real transactions:")
    pdf.bullet("Pay a toll via toll_gate::pay_toll_and_jump")
    pdf.bullet("Deposit SUI into treasury via treasury::deposit")
    pdf.bullet("Verify dashboard shows: active corridor, toll revenue, trade stats")
    pdf.bullet("Take screenshots of the dashboard and Sui explorer as proof")

    pdf.section_title("1.4 Deliverables", level=2)
    pdf.bullet("At least 1 active corridor on testnet with configured tolls and depots")
    pdf.bullet("At least 1 toll payment transaction on-chain")
    pdf.bullet("Dashboard showing real, live corridor data")
    pdf.bullet("Screenshots for demo material")

    # ================================================================
    # PHASE 2: DEPLOY DASHBOARD
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 2: Deploy Dashboard to Vercel (Day 3)")

    pdf.info_box(
        "Prize Target: Live Frontier Integration ($5,000)",
        "This prize category requires a deployed, functioning app connected to the "
        "Sui blockchain. Deploy early and iterate -- a live URL is worth more than "
        "a local-only demo."
    )

    pdf.section_title("2.1 Vercel Deployment", level=2)
    pdf.body_text(
        "The vercel.json configuration already exists in the dashboard/ directory. "
        "Deploy with the Vercel CLI or connect the GitHub repo."
    )
    pdf.body_text("Required environment variables:")
    pdf.code_block(
        "NEXT_PUBLIC_SUI_NETWORK=testnet\n"
        "NEXT_PUBLIC_FEN_PACKAGE_ID=0xb05f71...efdc20f09\n"
        "NEXT_PUBLIC_CORRIDOR_REGISTRY_ID=0xe01806...ce1b2d"
    )
    pdf.bullet("Verify all 6 pages load with live testnet data")
    pdf.bullet("Test wallet connection flow on the deployed URL")
    pdf.bullet("Confirm the registered corridor from Phase 1 appears")

    pdf.section_title("2.2 Meta Tags and OG Image", level=2)
    pdf.bullet("Title: 'FEN - Frontier Exchange Network'")
    pdf.bullet("Description for social link previews")
    pdf.bullet("OG image: simple branded card with FEN logo and tagline")
    pdf.bullet("Favicon")

    # ================================================================
    # PHASE 3: OPERATOR WIZARD
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 3: Guided Operator Wizard (Days 4-5)")

    pdf.body_text(
        "The Operate page has all the forms but no guided flow. After registration, "
        "operators must know what to do next. A wizard turns a confusing admin panel "
        "into a product experience judges will remember."
    )

    pdf.section_title("3.1 Post-Registration Setup Wizard", level=2)
    pdf.body_text("After a corridor is registered, show a step-by-step flow:")

    steps = [
        ("Step 1: Set Toll on Gate A", "How much SUI per jump? Slider or input with suggested defaults."),
        ("Step 2: Set Toll on Gate B", "Same flow for the second gate."),
        ("Step 3: Configure Depot A", "Select item types from a dropdown, set exchange ratio and fee (bps)."),
        ("Step 4: Configure Depot B", "Same flow for the second depot."),
        ("Step 5: Create AMM Pool (Optional)", "Initialize a liquidity pool on a depot with SUI + items."),
        ("Step 6: Activate Depots", "Enable trading at both depots. Show a toggle."),
        ("Step 7: Activate Corridor", "Final step: 'Your corridor is LIVE!' with confetti or success state."),
    ]
    for i, (step, desc) in enumerate(steps):
        pdf.check_page_break(15)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(40, 40, 100)
        pdf.cell(0, 6, step)
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(0, 5.5, "  " + desc)
        pdf.ln(7)

    pdf.body_text(
        "Each step builds and signs a PTB, confirms on-chain, then advances. "
        "A progress indicator shows which steps are complete vs remaining."
    )

    pdf.section_title("3.2 Corridor Health Dashboard", level=2)
    pdf.bullet("Alert banners: 'Corridor inactive', 'Depot not configured', 'No toll set'")
    pdf.bullet("Status checklist on the Manage tab showing what's configured vs missing")
    pdf.bullet("One-click 'Go Live' button that activates everything in a single PTB")
    pdf.bullet("Revenue summary: daily toll income, trade fees collected, treasury balance")

    # ================================================================
    # PHASE 4: TRADE EXECUTION
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 4: Composite Trade Execution (Days 6-7)")

    pdf.body_text(
        "The Trade and Swap pages show data but traders can't execute yet. "
        "Individual PTB builders exist but need to be wired into the UI with "
        "confirmation modals and real execution."
    )

    pdf.section_title("4.1 One-Click 'Pay Toll + Trade' PTB", level=2)
    pdf.body_text(
        "Build a single Programmable Transaction Block that combines multiple "
        "operations into one atomic transaction:"
    )
    pdf.numbered_item(1, "toll_gate::pay_toll_and_jump - Pay the gate toll, receive JumpPermit")
    pdf.numbered_item(2, "depot::execute_trade - Deposit input items, receive output items")
    pdf.ln(2)
    pdf.body_text("Show a confirmation modal before execution:")
    pdf.bullet("Toll cost (in SUI)")
    pdf.bullet("Exchange rate and expected output (item type + quantity)")
    pdf.bullet("Fee deducted (basis points)")
    pdf.bullet("Total cost breakdown")

    pdf.section_title("4.2 AMM Swap Execution", level=2)
    pdf.body_text("On the /swap page, connect to real pool reserves from chain:")
    pdf.bullet("Live price quote using compute_output math (client-side mirror of Move logic)")
    pdf.bullet("Price impact warning: yellow at >1%, red at >5%")
    pdf.bullet("Slippage tolerance selector: 0.5%, 1%, 3%, custom")
    pdf.bullet("Execute liquidity_pool::sell_items or buy_items with calculated min_out")
    pdf.bullet("Post-swap confirmation with actual amounts and explorer link")

    pdf.section_title("4.3 Trade History", level=2)
    pdf.bullet("Query SwapEvent and TradeExecutedEvent filtered by connected wallet address")
    pdf.bullet("Show past trades: amounts, prices, timestamps, profit/loss")
    pdf.bullet("Link each transaction to Sui explorer")
    pdf.bullet("Export to CSV (optional)")

    # ================================================================
    # PHASE 5: EVENT INDEXER
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 5: Event Indexer (Days 8-12)")

    pdf.body_text(
        "The dashboard currently uses on-chain event polling for data. This works but "
        "is slow and can't produce rich time-series charts. An event indexer captures all "
        "FEN events in real-time and stores them in a database for fast querying."
    )

    pdf.section_title("5.1 Architecture", level=2)
    pdf.code_block(
        "indexer/\n"
        "  src/\n"
        "    stream.ts        -- gRPC checkpoint listener (or polling fallback)\n"
        "    processor.ts     -- Filter for FEN package events\n"
        "    handlers/\n"
        "      corridor.ts    -- CorridorCreated, StatusChanged\n"
        "      toll.ts        -- TollPaid, ConfigUpdated, Surge events\n"
        "      depot.ts       -- TradeExecuted, ConfigUpdated, Activated\n"
        "      pool.ts        -- PoolCreated, Swap, LiquidityChanged\n"
        "      treasury.ts    -- Deposit, Withdraw\n"
        "      deepbook.ts    -- ManagerLinked, OrderPlaced\n"
        "    db/\n"
        "      schema.ts      -- Drizzle ORM table definitions\n"
        "      index.ts       -- Turso (cloud SQLite) connection\n"
        "  package.json"
    )

    pdf.section_title("5.2 Database Tables", level=2)
    pdf.check_page_break(50)
    w = [50, 130]
    pdf.table_header(["Table", "Purpose"], w)
    tables = [
        ("corridors", "Latest state per corridor (denormalized from events)"),
        ("toll_events", "All toll payments -- powers revenue charts"),
        ("trade_events", "All depot trades -- powers volume charts"),
        ("swap_events", "AMM swaps -- powers price charts"),
        ("pool_snapshots", "Periodic reserve snapshots for TVL tracking"),
        ("indexer_cursor", "Checkpoint tracking for resumable indexing"),
    ]
    for i, (t, p) in enumerate(tables):
        pdf.table_row([t, p], w, highlight=(i % 2 == 0))

    pdf.section_title("5.3 API Endpoints", level=2)
    pdf.code_block(
        "GET /api/corridors              -- All corridors with aggregated stats\n"
        "GET /api/corridors/:id/activity  -- Time-series events for one corridor\n"
        "GET /api/stats                   -- Aggregate dashboard numbers\n"
        "GET /api/pools/:id/price-history -- AMM price over time\n"
        "GET /api/wallet/:addr/history    -- Trade history per wallet"
    )

    pdf.section_title("5.4 Connect Dashboard to Indexed Data", level=2)
    pdf.bullet("Replace useChartData polling with indexed time-series API")
    pdf.bullet("VolumeChart shows real 24h hourly data from toll_events + trade_events")
    pdf.bullet("RecentActivity becomes a live feed with <1s latency")
    pdf.bullet("TopCorridors ranked by actual indexed volume/revenue")
    pdf.bullet("StatsGrid shows real aggregate numbers")

    pdf.info_box(
        "Fallback Strategy",
        "If the full gRPC indexer is too complex, start with a polling approach: "
        "a cron job that calls queryEvents every 30 seconds and writes to Turso. "
        "The dashboard works without an indexer (just with less rich data), so this "
        "is additive, not blocking."
    )

    # ================================================================
    # PHASE 6: AMM ANALYTICS
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 6: AMM Price Charts & Analytics (Days 13-14)")

    pdf.section_title("6.1 Pool Price Chart", level=2)
    pdf.bullet("Line chart of SUI/item price over time (from indexed swap_events)")
    pdf.bullet("Candlestick or area chart option using Recharts (already a dependency)")
    pdf.bullet("Time range selector: 1h, 24h, 7d, 30d")
    pdf.bullet("Overlay with volume bars")

    pdf.section_title("6.2 Liquidity Depth Visualization", level=2)
    pdf.bullet("Show current reserves: SUI side + item side")
    pdf.bullet("Bar chart showing available liquidity at various price points")
    pdf.bullet("Pool TVL (Total Value Locked) in SUI equivalent")
    pdf.bullet("LP share calculator for potential liquidity providers")

    pdf.section_title("6.3 Best Route Optimizer", level=2)
    pdf.body_text(
        "When a trader wants to exchange items, compare all available paths:"
    )
    pdf.bullet("Fixed-ratio depot trade (simple, predictable output)")
    pdf.bullet("AMM swap (dynamic price, may be better or worse depending on pool depth)")
    pdf.bullet("Factor in: toll cost + trade fee + price impact + slippage")
    pdf.bullet("Recommend the cheapest path with a clear comparison table")

    # ================================================================
    # PHASE 7: WORLD-CONTRACTS PR
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 7: World-Contracts Contribution (Days 15-16)")

    pdf.body_text(
        "Contributing back to the EVE Frontier ecosystem shows you're not just "
        "building for the hackathon -- you're building for the community. Even an "
        "open PR with good discussion adds credibility to the submission."
    )

    pdf.section_title("Option A: Issue #44 - Extension-Managed Inventory", level=2)
    pdf.body_text(
        "FEN depots are a direct implementation of this pattern. The typed-witness "
        "(FenAuth) approach for SSU deposits/withdrawals could be extracted into a "
        "reusable module that other extensions can use. High visibility -- authored "
        "by blurpesec, the most prolific contributor."
    )

    pdf.section_title("Option B: Issue #45 - Deposit Receipts", level=2)
    pdf.body_text(
        "Formalize FEN treasury deposits into owned receipt objects. When a player "
        "deposits SUI, they receive a Receipt NFT that can be burned to withdraw. "
        "Adds composability (receipts could be traded or used as collateral)."
    )

    pdf.section_title("Option C: PR #125 - Deployment Script Fix", level=2)
    pdf.body_text(
        "Quick win with lower impact. Fix known issues in the deployment scripts. "
        "Less impressive but easy to merge."
    )

    pdf.warning_box(
        "Strategy",
        "Pick ONE and do it well. A merged PR is gold. An open PR with good "
        "discussion is silver. Both beat not contributing at all. Budget 2 days "
        "max -- don't let this derail the main project."
    )

    # ================================================================
    # PHASE 8: STILLNESS INTEGRATION
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 8: Stillness Integration (Days 17-18)")

    pdf.info_box(
        "Prize Target: Live Frontier Integration ($5,000)",
        "If the EVE Frontier game client on Stillness testnet is accessible, a real "
        "in-game demo is the single most impressive thing you can show. Real player "
        "interaction puts you in a completely different tier from testnet-only projects."
    )

    pdf.section_title("8.1 Deploy Real Assemblies", level=2)
    pdf.bullet("Anchor 2 Gate assemblies in different solar systems")
    pdf.bullet("Deploy 2 StorageUnit assemblies near each gate")
    pdf.bullet("Stock SSUs with tradeable items")
    pdf.bullet("Note: requires access to the Stillness game client")

    pdf.section_title("8.2 Register Real Corridor", level=2)
    pdf.bullet("Use real Gate/SSU object IDs from Stillness (not placeholder IDs)")
    pdf.bullet("Configure tolls and depots with real item type IDs from the game")
    pdf.bullet("Activate and go live")

    pdf.section_title("8.3 Record Gameplay Demo", level=2)
    pdf.bullet("Show in-game assemblies alongside the FEN dashboard (split screen)")
    pdf.bullet("Player pays toll at a gate, jumps to destination system")
    pdf.bullet("Player trades items at a depot, sees output in inventory")
    pdf.bullet("Operator's dashboard shows revenue update in real-time")
    pdf.bullet("This becomes the centerpiece of the demo video")

    pdf.body_text(
        "If Stillness access is not available, focus on the Sui testnet demo. "
        "The dashboard with testnet corridors is still strong for the Live Integration "
        "prize -- it just won't have the in-game visuals."
    )

    # ================================================================
    # PHASE 9: FINAL POLISH
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 9: Final Polish (Days 19-20)")

    pdf.section_title("9.1 UI Refinements", level=2)
    pdf.bullet("Empty state illustrations: 'No corridors yet' with a Register CTA")
    pdf.bullet("Animated transitions between tabs (Operate page)")
    pdf.bullet("Responsive layout testing on mobile and tablet")
    pdf.bullet("Error boundary with user-friendly recovery suggestions")
    pdf.bullet("Loading states for all transaction flows (pending, confirmed, error)")

    pdf.section_title("9.2 README Final Pass", level=2)
    pdf.bullet("Update test count to 116")
    pdf.bullet("Add live dashboard URL from Vercel deployment")
    pdf.bullet("Add architecture diagram showing contract-to-dashboard data flow")
    pdf.bullet("Clear 'Getting Started' section for operators and traders")
    pdf.bullet("Screenshots of the working dashboard with real data")

    pdf.section_title("9.3 Update PDF Documentation", level=2)
    pdf.bullet("Regenerate all 6 PDFs with final numbers and live URLs")
    pdf.bullet("Add AMM pricing deep-dive (constant-product formula explained)")
    pdf.bullet("Add indexer architecture documentation")
    pdf.bullet("Include deployment and operations guide")

    # ================================================================
    # PHASE 10: DEMO VIDEO & SUBMISSION
    # ================================================================
    pdf.add_page()
    pdf.section_title("Phase 10: Demo Video & Submission (Day 21)")

    pdf.section_title("10.1 Demo Video Script (2-3 Minutes)", level=2)
    pdf.code_block(
        '0:00 - "FEN turns isolated assemblies into a connected trade economy"\n'
        "0:15 - Problem: no trade infrastructure in EVE Frontier\n"
        "0:30 - Operator connects wallet, registers corridor\n"
        "0:50 - Configures tolls, depots, AMM pool via wizard\n"
        "1:10 - Trader discovers routes, sees live prices\n"
        "1:25 - One-click trade execution, on-chain confirmation\n"
        "1:45 - Dashboard shows live volume, revenue, activity feed\n"
        "2:00 - AMM swap with price impact and slippage protection\n"
        "2:20 - Architecture: 6 Move modules, 116 tests, event indexer\n"
        '2:40 - "The economic infrastructure layer for EVE Frontier"'
    )

    pdf.section_title("10.2 Recording Tips", level=2)
    pdf.bullet("Clean browser: no bookmarks bar, no other tabs, no extensions visible")
    pdf.bullet("High-resolution display (1080p minimum, 4K preferred)")
    pdf.bullet("Voiceover: clear, concise, enthusiastic but professional")
    pdf.bullet("Show real transactions on Sui explorer for credibility")
    pdf.bullet("End with the live URL so judges can try it themselves")

    pdf.section_title("10.3 Final Submission Checklist", level=2)
    checklist = [
        "All code committed and pushed to GitHub",
        "README accurate, compelling, with screenshots",
        "Dashboard deployed to Vercel (live URL working)",
        "Demo video uploaded (2-3 minutes)",
        "At least one corridor registered and active on testnet",
        "Real transactions visible on Sui explorer",
        "116 Move tests passing (sui move test)",
        "world-contracts PR submitted (if completed)",
        "PDF documentation included in docs/ directory",
        "Submission form completed on deepsurge.xyz",
    ]
    for item in checklist:
        pdf.check_page_break(10)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(10, 5.5, "[ ]")
        pdf.cell(0, 5.5, item)
        pdf.ln(6)

    # ================================================================
    # PRIORITY MATRIX
    # ================================================================
    pdf.add_page()
    pdf.section_title("Priority Matrix")

    pdf.body_text(
        "If time runs short, cut from the bottom. The P0 items alone make a "
        "competitive submission. Everything after P1 is increasingly optional."
    )

    pdf.check_page_break(80)
    w = [20, 60, 70, 30]
    pdf.table_header(["Priority", "Phase", "Deliverable", "Days"], w)
    priorities = [
        ("P0", "Phase 1", "Register corridor, prove end-to-end", "1-2"),
        ("P0", "Phase 2", "Deploy dashboard to Vercel", "3"),
        ("P1", "Phase 4", "Trade execution flow (toll + trade)", "6-7"),
        ("P1", "Phase 10", "Demo video + final submission", "21"),
        ("P2", "Phase 3", "Guided operator wizard", "4-5"),
        ("P2", "Phase 5", "Event indexer for time-series", "8-12"),
        ("P3", "Phase 6", "AMM price charts + analytics", "13-14"),
        ("P3", "Phase 7", "world-contracts PR", "15-16"),
        ("P4", "Phase 8", "Stillness in-game integration", "17-18"),
        ("P4", "Phase 9", "Final UI polish + docs update", "19-20"),
    ]
    for i, (pri, phase, deliverable, days) in enumerate(priorities):
        pdf.table_row([pri, phase, deliverable, days], w, highlight=(i % 2 == 0))

    # ================================================================
    # PRIZE STRATEGY
    # ================================================================
    pdf.ln(10)
    pdf.section_title("Prize Category Strategy")

    pdf.check_page_break(60)
    w = [40, 20, 60, 60]
    pdf.table_header(["Category", "Prize", "FEN's Angle", "What's Needed"], w)
    prizes = [
        ("Overall 1st", "$15k", "Full-stack: contracts+dash+demo", "All phases"),
        ("Utility", "$5k", "Trade infra all players need", "E2E demo"),
        ("Technical", "$5k", "6 modules, 116 tests, AMM", "Already strong"),
        ("Live Integration", "$5k", "Deployed dashboard + testnet", "Phase 1+2"),
        ("Creative", "$5k", "First DEX for EVE items", "Better storytelling"),
    ]
    for i, (cat, prize, angle, needed) in enumerate(prizes):
        pdf.table_row([cat, prize, angle, needed], w, highlight=(i % 2 == 0))

    pdf.ln(5)
    pdf.body_text(
        "The strongest path is Technical Implementation + Live Frontier Integration. "
        "These reward working code over aspirational features. FEN is already strong "
        "on the technical side (6 modules, 116 tests, AMM, typed-witness pattern). "
        "The gap is proving it works live."
    )

    # ================================================================
    # DAILY SCHEDULE
    # ================================================================
    pdf.add_page()
    pdf.section_title("21-Day Schedule")

    pdf.check_page_break(30)
    pdf.section_title("Week 1: Make It Real (March 11-17)", level=2)
    w = [15, 25, 55, 85]
    pdf.table_header(["Day", "Date", "Phase", "Deliverable"], w)
    week1 = [
        ("1", "Mar 11", "Phase 1", "Register corridor on testnet via CLI"),
        ("2", "Mar 12", "Phase 1", "Configure tolls/depots, activate, test transactions"),
        ("3", "Mar 13", "Phase 2", "Deploy dashboard to Vercel, verify live"),
        ("4", "Mar 14", "Phase 3", "Operator wizard: steps 1-4 (toll + depot config)"),
        ("5", "Mar 15", "Phase 3", "Operator wizard: steps 5-7 (pool + activate)"),
        ("6", "Mar 16", "Phase 4", "Composite toll+trade PTB, confirmation modal"),
        ("7", "Mar 17", "Phase 4", "AMM swap execution, trade history"),
    ]
    for i, row in enumerate(week1):
        pdf.table_row(list(row), w, highlight=(i % 2 == 0))

    pdf.check_page_break(30)
    pdf.section_title("Week 2: Make It Deep (March 18-24)", level=2)
    pdf.table_header(["Day", "Date", "Phase", "Deliverable"], w)
    week2 = [
        ("8", "Mar 18", "Phase 5", "Indexer setup: stream, processor, schema"),
        ("9", "Mar 19", "Phase 5", "Indexer handlers for all FEN events"),
        ("10", "Mar 20", "Phase 5", "Connect dashboard to indexed data"),
        ("11", "Mar 21", "Phase 5", "Polish indexer, backfill historical events"),
        ("12", "Mar 22", "Phase 6", "AMM price charts, liquidity depth viz"),
        ("13", "Mar 23", "Phase 6", "Route optimizer, best-path comparison"),
        ("14", "Mar 24", "Phase 7", "world-contracts PR (Issue #44 or #45)"),
    ]
    for i, row in enumerate(week2):
        pdf.table_row(list(row), w, highlight=(i % 2 == 0))

    pdf.check_page_break(30)
    pdf.section_title("Week 3: Make It Shine (March 25-31)", level=2)
    pdf.table_header(["Day", "Date", "Phase", "Deliverable"], w)
    week3 = [
        ("15", "Mar 25", "Phase 7", "world-contracts PR review + iterate"),
        ("16", "Mar 26", "Phase 8", "Stillness integration (if accessible)"),
        ("17", "Mar 27", "Phase 8", "Record in-game demo footage"),
        ("18", "Mar 28", "Phase 9", "UI polish: empty states, animations, mobile"),
        ("19", "Mar 29", "Phase 9", "README final pass, regenerate PDFs"),
        ("20", "Mar 30", "Phase 10", "Record demo video (2-3 minutes)"),
        ("21", "Mar 31", "Phase 10", "Final submission on deepsurge.xyz"),
    ]
    for i, row in enumerate(week3):
        pdf.table_row(list(row), w, highlight=(i % 2 == 0))

    # ================================================================
    # RISK MITIGATION
    # ================================================================
    pdf.add_page()
    pdf.section_title("Risk Mitigation")

    pdf.check_page_break(60)
    w = [50, 130]
    pdf.table_header(["Risk", "Mitigation"], w)
    risks = [
        ("Indexer too complex", "Start with polling (queryEvents every 30s). Upgrade to gRPC if time."),
        ("Can't access Stillness", "Focus on Sui testnet demo. Dashboard + testnet corridors still strong."),
        ("world-contracts PR stalls", "An open PR with good discussion still shows engagement."),
        ("Time crunch", "Phase 1+2 alone make a top-3 project. Everything after is additive."),
        ("Build/deploy issues", "vercel.json exists. Env vars are documented. Dashboard builds cleanly."),
        ("No real items to trade", "Use placeholder type IDs. The contracts work regardless."),
    ]
    for i, (risk, mit) in enumerate(risks):
        pdf.table_row([risk, mit], w, highlight=(i % 2 == 0))

    # ================================================================
    # THE ONE THING
    # ================================================================
    pdf.ln(10)
    pdf.section_title("The One Thing That Matters Most")

    pdf.warning_box(
        "If you do nothing else, do this:",
        "Register one corridor on testnet, configure it, activate it, and execute "
        "a real transaction by Day 2. Then deploy the dashboard to Vercel by Day 3. "
        "That single working demo with a live URL is worth more than any amount of "
        "unfinished code. Everything else builds on that foundation."
    )

    # ================================================================
    # TECHNICAL REFERENCE
    # ================================================================
    pdf.add_page()
    pdf.section_title("Technical Reference")

    pdf.section_title("Deployed Contract Addresses", level=2)
    pdf.key_value("Package ID", "0xb05f71...efdc20f09")
    pdf.key_value("CorridorRegistry", "0xe01806...ce1b2d")
    pdf.key_value("BalanceManagerRegistry", "0x27d558...852920")
    pdf.key_value("Deployer", "0x33a514...fb48eeb")
    pdf.key_value("Network", "Sui Testnet")

    pdf.section_title("Move Modules (6 total, 32 entry functions)", level=2)
    pdf.check_page_break(50)
    w = [45, 20, 30, 85]
    pdf.table_header(["Module", "Lines", "Entry Fns", "Purpose"], w)
    modules = [
        ("corridor.move", "314", "6", "Registry, lifecycle, ownership"),
        ("toll_gate.move", "239", "4", "Gate tolls, surge pricing, JumpPermit"),
        ("depot.move", "289", "4", "Item exchange, ratios, fees"),
        ("liquidity_pool.move", "656", "7", "AMM (x*y=k), slippage, pool mgmt"),
        ("treasury.move", "156", "5", "Revenue pool, deposits, withdrawals"),
        ("deepbook_adapter.move", "187", "4", "DeepBook v3 balance manager bridge"),
    ]
    for i, row in enumerate(modules):
        pdf.table_row(list(row), w, highlight=(i % 2 == 0))

    pdf.section_title("Dashboard Pages (6 routes)", level=2)
    pdf.check_page_break(50)
    w = [40, 140]
    pdf.table_header(["Route", "Purpose"], w)
    pages = [
        ("/", "Dashboard: stats grid, volume chart, activity feed, top corridors"),
        ("/corridors", "Browse all corridors with status, revenue, jump/trade counts"),
        ("/corridors/[id]", "Corridor detail: gates, depots, pools, activity timeline"),
        ("/trade", "Trade route discovery: sortable, profit calculator, real rates"),
        ("/swap", "AMM swap interface: price quotes, impact warnings, slippage"),
        ("/operate", "Operator panel: register, configure, manage, emergency controls"),
    ]
    for i, (route, purpose) in enumerate(pages):
        pdf.table_row([route, purpose], w, highlight=(i % 2 == 0))

    pdf.section_title("Key Files", level=2)
    files = [
        ("contracts/fen/sources/*.move", "6 Move contract modules"),
        ("contracts/fen/tests/*.move", "6 test files, 116 tests total"),
        ("dashboard/src/hooks/use-corridors.ts", "On-chain data fetching (741 lines)"),
        ("dashboard/src/hooks/use-fen-transactions.ts", "Transaction signing hooks"),
        ("dashboard/src/hooks/use-owner-caps.ts", "OwnerCap wallet discovery"),
        ("dashboard/src/hooks/use-owned-assemblies.ts", "Gate/SSU wallet discovery"),
        ("dashboard/src/lib/transactions.ts", "30+ PTB builders"),
        ("dashboard/src/lib/sui-config.ts", "Network config, deployed addresses"),
        ("dashboard/src/app/operate/page.tsx", "Operator panel (~52KB)"),
        ("docs/generate_docs.py", "PDF documentation generator"),
    ]
    for path, desc in files:
        pdf.check_page_break(10)
        pdf.set_font("Courier", "", 8)
        pdf.set_text_color(40, 40, 100)
        pdf.cell(80, 5, path)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(0, 5, desc)
        pdf.ln(5.5)

    # Save
    output_path = os.path.join(DOCS_DIR, "07_Implementation_Plan.pdf")
    pdf.output(output_path)
    print(f"Generated: {output_path}")
    return output_path


if __name__ == "__main__":
    generate()
