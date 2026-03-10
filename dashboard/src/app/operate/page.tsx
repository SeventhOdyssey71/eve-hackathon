"use client";

import { useState, useEffect, useRef } from "react";
import { useCorridors } from "@/hooks/use-corridors";
import { useOwnerCaps } from "@/hooks/use-owner-caps";
import { useOwnedAssemblies } from "@/hooks/use-owned-assemblies";
import {
  useRegisterCorridor,
  useSetTollConfig,
  useEmergencyControl,
  useCorridorStatus,
  useWithdrawRevenue,
  useDepotConfig,
  usePoolManagement,
} from "@/hooks/use-fen-transactions";
import { usePoolConfigs } from "@/hooks/use-corridors";
import { formatSui, formatPercent, statusBg, abbreviateAddress } from "@/lib/utils";
import { AssemblyPicker } from "@/components/AssemblyPicker";
import {
  Plus, Settings, Shield, AlertTriangle, DollarSign, Power,
  Loader2, CheckCircle, XCircle, Wallet, ArrowRight, Package,
  Zap, ChevronRight, Droplets,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

function TxStatusBadge({ status, error }: { status: string; error: string | null }) {
  if (status === "idle") return null;
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-eve-yellow">
      <Loader2 className="w-3 h-3 animate-spin" /> Signing...
    </span>
  );
  if (status === "success") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-eve-green">
      <CheckCircle className="w-3 h-3" /> Confirmed
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-eve-red" title={error || ""}>
      <XCircle className="w-3 h-3" /> {error?.slice(0, 60) || "Failed"}
    </span>
  );
  return null;
}

type Tab = "manage" | "create";
type SetupStep = "tolls" | "depots" | "activate" | null;

export default function OperatePage() {
  const [tab, setTab] = useState<Tab>("manage");
  const { corridors, refetch: refetchCorridors } = useCorridors();
  const { caps, refetch: refetchCaps } = useOwnerCaps();
  const { gates, storageUnits, isLoading: assembliesLoading } = useOwnedAssemblies();
  const [selectedCorridor, setSelectedCorridor] = useState("");
  const account = useCurrentAccount();

  // Post-registration guided setup
  const [setupStep, setSetupStep] = useState<SetupStep>(null);
  const [setupCorridorId, setSetupCorridorId] = useState("");

  // Select first corridor user owns by default
  useEffect(() => {
    if (!selectedCorridor && corridors.length > 0) {
      // Prefer corridors the user owns
      const owned = corridors.find((c) => caps.has(c.id));
      setSelectedCorridor(owned?.id || corridors[0].id);
    }
  }, [corridors, caps, selectedCorridor]);

  const corridor = corridors.find((c) => c.id === selectedCorridor) || corridors[0];
  const ownerCapId = corridor ? caps.get(corridor.id) : undefined;
  const isOwner = !!ownerCapId;
  const totalRevenue = corridor ? corridor.totalTollRevenue + corridor.totalTradeRevenue : 0;

  // Transaction hooks
  const { registerCorridor, status: regStatus, error: regError } = useRegisterCorridor();
  const { setTollConfig, status: tollStatus, error: tollError } = useSetTollConfig();
  const { emergencyLock, emergencyUnlock, status: emStatus, error: emError } = useEmergencyControl();
  const { activateCorridor, deactivateCorridor, status: csStatus, error: csError } = useCorridorStatus();
  const { withdrawAll, status: wdStatus, error: wdError } = useWithdrawRevenue();
  const { setDepotConfig, activateDepot, deactivateDepot: deactivateDepotFn, status: depotStatus, error: depotError } = useDepotConfig();
  const { createPool, activatePool, deactivatePool, addLiquidity, removeLiquidity, status: poolStatus, error: poolError } = usePoolManagement();

  // Pool config from on-chain
  const { poolA, poolB, isLoading: poolsLoading } = usePoolConfigs(
    corridor?.id || "",
    corridor?.depotA.id || "",
    corridor?.depotB.id || "",
  );

  // Pool create form state
  const [poolFormA, setPoolFormA] = useState({ itemTypeId: "", feeBps: "30", initialSui: "", initialItems: "" });
  const [poolFormB, setPoolFormB] = useState({ itemTypeId: "", feeBps: "30", initialSui: "", initialItems: "" });

  // Pool add liquidity state
  const [liqFormA, setLiqFormA] = useState({ suiAmount: "", items: "" });
  const [liqFormB, setLiqFormB] = useState({ suiAmount: "", items: "" });

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    sourceGateId: "",
    destGateId: "",
    depotAId: "",
    depotBId: "",
    feeRecipient: "",
  });

  // Auto-fill fee recipient with connected wallet address
  useEffect(() => {
    if (account?.address && !createForm.feeRecipient) {
      setCreateForm((f) => ({ ...f, feeRecipient: account.address }));
    }
  }, [account?.address]);

  // Toll config form state for manage tab
  const [tollFormA, setTollFormA] = useState({ amount: "" });
  const [tollFormB, setTollFormB] = useState({ amount: "" });

  // Sync toll form values when corridor changes
  useEffect(() => {
    if (corridor) {
      setTollFormA({ amount: String(corridor.sourceGate.tollAmount / 1_000_000_000 || "") });
      setTollFormB({ amount: String(corridor.destGate.tollAmount / 1_000_000_000 || "") });
    }
  }, [corridor?.id, corridor?.sourceGate.tollAmount, corridor?.destGate.tollAmount]);

  // Depot config form state
  const [depotFormA, setDepotFormA] = useState({ inputTypeId: "", outputTypeId: "", ratioIn: "", ratioOut: "", feeBps: "" });
  const [depotFormB, setDepotFormB] = useState({ inputTypeId: "", outputTypeId: "", ratioIn: "", ratioOut: "", feeBps: "" });

  useEffect(() => {
    if (corridor) {
      setDepotFormA({
        inputTypeId: String(corridor.depotA.inputItem.typeId || ""),
        outputTypeId: String(corridor.depotA.outputItem.typeId || ""),
        ratioIn: String(corridor.depotA.ratioIn || ""),
        ratioOut: String(corridor.depotA.ratioOut || ""),
        feeBps: String(corridor.depotA.feeBps || ""),
      });
      setDepotFormB({
        inputTypeId: String(corridor.depotB.inputItem.typeId || ""),
        outputTypeId: String(corridor.depotB.outputItem.typeId || ""),
        ratioIn: String(corridor.depotB.ratioIn || ""),
        ratioOut: String(corridor.depotB.ratioOut || ""),
        feeBps: String(corridor.depotB.feeBps || ""),
      });
    }
  }, [corridor?.id]);

  const handleCreate = async () => {
    if (!account) return;
    const result = await registerCorridor(createForm);
    if (result) {
      // Refresh data and switch to setup flow
      setTimeout(() => {
        refetchCorridors();
        refetchCaps();
        setTab("manage");
        setSetupStep("tolls");
      }, 2000);
    }
  };

  // Form validation
  const isFormValid = createForm.name.trim().length > 0
    && createForm.sourceGateId.startsWith("0x")
    && createForm.destGateId.startsWith("0x")
    && createForm.depotAId.startsWith("0x")
    && createForm.depotBId.startsWith("0x")
    && createForm.feeRecipient.startsWith("0x");

  if (!account) {
    return (
      <div className="space-y-8 max-w-[1400px]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operator Panel</h1>
          <p className="text-sm text-eve-text-dim mt-1">Manage and create trade corridors</p>
        </div>
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-eve-elevated flex items-center justify-center mb-4">
            <Wallet className="w-7 h-7 text-eve-muted" />
          </div>
          <h3 className="text-lg font-semibold text-eve-text mb-1">Connect your wallet</h3>
          <p className="text-sm text-eve-text-dim max-w-sm">
            Connect a Sui wallet to manage your corridors, configure tolls, and withdraw revenue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operator Panel</h1>
        <p className="text-sm text-eve-text-dim mt-1">Manage your trade corridors</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-eve-surface border border-eve-border rounded-xl w-fit">
        <button
          onClick={() => { setTab("manage"); setSetupStep(null); }}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            tab === "manage" ? "bg-eve-elevated text-eve-text shadow-sm" : "text-eve-text-dim hover:text-eve-text"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" /> Manage
        </button>
        <button
          onClick={() => { setTab("create"); setSetupStep(null); }}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            tab === "create" ? "bg-eve-elevated text-eve-text shadow-sm" : "text-eve-text-dim hover:text-eve-text"
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" /> Create New
        </button>
      </div>

      {tab === "manage" ? (
        corridors.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-eve-elevated flex items-center justify-center mb-3">
              <Settings className="w-6 h-6 text-eve-muted" />
            </div>
            <p className="text-sm text-eve-text-dim mb-1">No corridors to manage</p>
            <p className="text-xs text-eve-muted mb-4">Create your first corridor to get started</p>
            <button onClick={() => setTab("create")} className="btn-primary text-xs">Create Corridor</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Corridor selector */}
            <div className="space-y-2">
              <h3 className="section-title mb-3">Your Corridors</h3>
              {corridors.map((c) => {
                const owned = caps.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCorridor(c.id); setSetupStep(null); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                      selectedCorridor === c.id
                        ? "border-eve-orange/40 bg-eve-orange/5"
                        : "border-eve-border hover:border-eve-border/80 bg-eve-surface hover:bg-eve-elevated/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{c.name}</span>
                      <div className="flex items-center gap-2">
                        {owned && (
                          <span className="text-[10px] text-eve-orange font-medium px-1.5 py-0.5 bg-eve-orange/10 rounded">
                            OWNER
                          </span>
                        )}
                        <span className={`badge ${statusBg(c.status)}`}>{c.status}</span>
                      </div>
                    </div>
                    <div className="text-xs text-eve-text-dim mt-1.5 flex items-center gap-1">
                      {abbreviateAddress(c.sourceGate.id)} <ArrowRight className="w-3 h-3 text-eve-muted" /> {abbreviateAddress(c.destGate.id)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Config panels */}
            {corridor && (
              <div className="lg:col-span-2 space-y-5">
                {/* Owner warning */}
                {!isOwner && (
                  <div className="p-4 bg-eve-yellow/5 border border-eve-yellow/20 rounded-xl">
                    <p className="text-xs text-eve-yellow font-medium">
                      You don't own this corridor. Only the owner ({abbreviateAddress(corridor.owner)}) can modify its configuration.
                    </p>
                  </div>
                )}

                {/* Setup wizard banner */}
                {setupStep && isOwner && (
                  <div className="p-4 bg-eve-orange/5 border border-eve-orange/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ChevronRight className="w-4 h-4 text-eve-orange" />
                      <span className="text-sm font-semibold text-eve-orange">Setup Guide</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      {(["tolls", "depots", "activate"] as const).map((step, i) => (
                        <button
                          key={step}
                          onClick={() => setSetupStep(step)}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                            setupStep === step
                              ? "bg-eve-orange text-eve-bg"
                              : "bg-eve-elevated text-eve-text-dim hover:text-eve-text"
                          }`}
                        >
                          {i + 1}. {step === "tolls" ? "Set Tolls" : step === "depots" ? "Configure Depots" : "Activate"}
                        </button>
                      ))}
                      <button
                        onClick={() => setSetupStep(null)}
                        className="text-eve-muted hover:text-eve-text ml-auto"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Revenue */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                      <DollarSign className="w-4 h-4 text-eve-orange" /> Revenue
                    </h3>
                    <div className="flex items-center gap-3">
                      <TxStatusBadge status={wdStatus} error={wdError} />
                      <button
                        className="btn-primary text-xs py-2"
                        disabled={wdStatus === "pending" || !isOwner}
                        onClick={() => ownerCapId && withdrawAll(corridor.id, ownerCapId)}
                        title={!isOwner ? "Only the corridor owner can withdraw" : ""}
                      >
                        {wdStatus === "pending" ? "Withdrawing..." : "Withdraw All"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="stat-label">Total Revenue</div>
                      <div className="text-xl font-semibold text-eve-orange mt-1">{formatSui(totalRevenue)}</div>
                    </div>
                    <div>
                      <div className="stat-label">Toll Revenue</div>
                      <div className="text-base font-medium mt-1">{formatSui(corridor.totalTollRevenue)}</div>
                    </div>
                    <div>
                      <div className="stat-label">Trade Revenue</div>
                      <div className="text-base font-medium mt-1">{formatSui(corridor.totalTradeRevenue)}</div>
                    </div>
                  </div>
                </div>

                {/* Toll config */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                      <Shield className="w-4 h-4 text-eve-orange" /> Toll Configuration
                    </h3>
                    <TxStatusBadge status={tollStatus} error={tollError} />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="label">Gate A Toll ({abbreviateAddress(corridor.sourceGate.id)})</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={tollFormA.amount}
                          onChange={(e) => setTollFormA({ amount: e.target.value })}
                          className="input-field text-[13px] flex-1"
                          placeholder="0.1"
                          step="0.01"
                          disabled={!isOwner}
                        />
                        <span className="text-xs text-eve-muted self-center">SUI</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Gate B Toll ({abbreviateAddress(corridor.destGate.id)})</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={tollFormB.amount}
                          onChange={(e) => setTollFormB({ amount: e.target.value })}
                          className="input-field text-[13px] flex-1"
                          placeholder="0.1"
                          step="0.01"
                          disabled={!isOwner}
                        />
                        <span className="text-xs text-eve-muted self-center">SUI</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Surge Pricing</label>
                      <div className="flex items-center gap-3">
                        <span className={`badge ${corridor.sourceGate.surgeActive ? "badge-surge" : "badge-inactive"}`}>
                          {corridor.sourceGate.surgeActive ? "Active" : "Inactive"}
                        </span>
                        {corridor.sourceGate.surgeActive && (
                          <span className="text-xs text-eve-orange font-medium">
                            <Zap className="w-3 h-3 inline" /> {corridor.sourceGate.surgeMultiplier / 100}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        className="btn-primary flex-1"
                        disabled={tollStatus === "pending" || !isOwner}
                        onClick={() => {
                          if (!ownerCapId) return;
                          const amountA = Math.floor(Number(tollFormA.amount) * 1_000_000_000);
                          setTollConfig(corridor.id, ownerCapId, corridor.sourceGate.id, amountA);
                        }}
                      >
                        {tollStatus === "pending" ? "Updating..." : "Update Gate A"}
                      </button>
                      <button
                        className="btn-primary flex-1"
                        disabled={tollStatus === "pending" || !isOwner}
                        onClick={() => {
                          if (!ownerCapId) return;
                          const amountB = Math.floor(Number(tollFormB.amount) * 1_000_000_000);
                          setTollConfig(corridor.id, ownerCapId, corridor.destGate.id, amountB);
                        }}
                      >
                        {tollStatus === "pending" ? "Updating..." : "Update Gate B"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Depot config */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                      <Package className="w-4 h-4 text-eve-orange" /> Depot Configuration
                    </h3>
                    <TxStatusBadge status={depotStatus} error={depotError} />
                  </div>
                  {[
                    { depot: corridor.depotA, label: "A", form: depotFormA, setForm: setDepotFormA },
                    { depot: corridor.depotB, label: "B", form: depotFormB, setForm: setDepotFormB },
                  ].map(({ depot, label, form, setForm }) => (
                    <div key={depot.id || label} className="mb-4 last:mb-0 p-4 bg-eve-bg rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-eve-text-dim">
                          Depot {label} ({abbreviateAddress(depot.id)})
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${depot.isActive ? "badge-active" : "badge-inactive"}`}>
                            {depot.isActive ? "Active" : "Inactive"}
                          </span>
                          {isOwner && (
                            <button
                              className={`text-[10px] font-medium px-2 py-1 rounded ${
                                depot.isActive
                                  ? "text-eve-red hover:bg-eve-red/10"
                                  : "text-eve-green hover:bg-eve-green/10"
                              }`}
                              onClick={() => {
                                if (!ownerCapId) return;
                                if (depot.isActive) {
                                  deactivateDepotFn(corridor.id, ownerCapId, depot.id);
                                } else {
                                  activateDepot(corridor.id, ownerCapId, depot.id);
                                }
                              }}
                            >
                              {depot.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        <div>
                          <label className="label">Input Type ID</label>
                          <input
                            type="number"
                            value={form.inputTypeId}
                            onChange={(e) => setForm({ ...form, inputTypeId: e.target.value })}
                            className="input-field text-[13px]"
                            disabled={!isOwner}
                          />
                        </div>
                        <div>
                          <label className="label">Output Type ID</label>
                          <input
                            type="number"
                            value={form.outputTypeId}
                            onChange={(e) => setForm({ ...form, outputTypeId: e.target.value })}
                            className="input-field text-[13px]"
                            disabled={!isOwner}
                          />
                        </div>
                        <div>
                          <label className="label">Ratio In</label>
                          <input
                            type="number"
                            value={form.ratioIn}
                            onChange={(e) => setForm({ ...form, ratioIn: e.target.value })}
                            className="input-field text-[13px]"
                            disabled={!isOwner}
                          />
                        </div>
                        <div>
                          <label className="label">Ratio Out</label>
                          <input
                            type="number"
                            value={form.ratioOut}
                            onChange={(e) => setForm({ ...form, ratioOut: e.target.value })}
                            className="input-field text-[13px]"
                            disabled={!isOwner}
                          />
                        </div>
                        <div>
                          <label className="label">Fee (bps)</label>
                          <input
                            type="number"
                            value={form.feeBps}
                            onChange={(e) => setForm({ ...form, feeBps: e.target.value })}
                            className="input-field text-[13px]"
                            disabled={!isOwner}
                          />
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          className="btn-primary text-xs mt-3"
                          disabled={depotStatus === "pending"}
                          onClick={() => {
                            if (!ownerCapId) return;
                            setDepotConfig({
                              corridorId: corridor.id,
                              ownerCapId,
                              storageUnitId: depot.id,
                              inputTypeId: Number(form.inputTypeId),
                              outputTypeId: Number(form.outputTypeId),
                              ratioIn: Number(form.ratioIn),
                              ratioOut: Number(form.ratioOut),
                              feeBps: Number(form.feeBps),
                            });
                          }}
                        >
                          {depotStatus === "pending" ? "Saving..." : `Update Depot ${label}`}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* AMM Liquidity Pools */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                      <Droplets className="w-4 h-4 text-eve-orange" /> AMM Liquidity Pools
                    </h3>
                    <TxStatusBadge status={poolStatus} error={poolError} />
                  </div>
                  {[
                    { depot: corridor.depotA, label: "A", pool: poolA, form: poolFormA, setForm: setPoolFormA, liq: liqFormA, setLiq: setLiqFormA },
                    { depot: corridor.depotB, label: "B", pool: poolB, form: poolFormB, setForm: setPoolFormB, liq: liqFormB, setLiq: setLiqFormB },
                  ].map(({ depot, label, pool, form, setForm, liq, setLiq }) => (
                    <div key={depot.id || label} className="mb-4 last:mb-0 p-4 bg-eve-bg rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-eve-text-dim">
                          Pool {label} ({abbreviateAddress(depot.id)})
                        </div>
                        {pool ? (
                          <div className="flex items-center gap-2">
                            <span className={`badge ${pool.isActive ? "badge-active" : "badge-inactive"}`}>
                              {pool.isActive ? "Active" : "Inactive"}
                            </span>
                            {isOwner && (
                              <button
                                className={`text-[10px] font-medium px-2 py-1 rounded ${
                                  pool.isActive
                                    ? "text-eve-red hover:bg-eve-red/10"
                                    : "text-eve-green hover:bg-eve-green/10"
                                }`}
                                disabled={poolStatus === "pending"}
                                onClick={() => {
                                  if (!ownerCapId) return;
                                  if (pool.isActive) {
                                    deactivatePool(corridor.id, ownerCapId, depot.id);
                                  } else {
                                    activatePool(corridor.id, ownerCapId, depot.id);
                                  }
                                }}
                              >
                                {pool.isActive ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-inactive">No Pool</span>
                        )}
                      </div>

                      {pool ? (
                        <>
                          {/* Pool stats */}
                          <div className="grid grid-cols-4 gap-3 mb-3">
                            <div className="text-center">
                              <div className="text-[10px] text-eve-muted">SUI Reserve</div>
                              <div className="text-xs font-semibold text-eve-text">{formatSui(pool.reserveSui)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-eve-muted">Item Reserve</div>
                              <div className="text-xs font-semibold text-eve-text">{pool.reserveItems}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-eve-muted">Fee</div>
                              <div className="text-xs font-semibold text-eve-text">{formatPercent(pool.feeBps)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-eve-muted">Swaps</div>
                              <div className="text-xs font-semibold text-eve-text">{pool.totalSwaps}</div>
                            </div>
                          </div>
                          <div className="text-[10px] text-eve-muted mb-3">
                            Item #{pool.itemTypeId} | Spot: {pool.reserveItems > 0
                              ? (pool.reserveSui / pool.reserveItems / 1_000_000_000).toFixed(4)
                              : "0"} SUI/item | Fees: {formatSui(pool.totalFeesCollected)}
                          </div>
                          {/* Add liquidity */}
                          {isOwner && (
                            <div className="border-t border-eve-border/40 pt-3">
                              <div className="text-[10px] font-semibold text-eve-text-dim mb-2">Add Liquidity</div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <input
                                    type="number"
                                    value={liq.suiAmount}
                                    onChange={(e) => setLiq({ ...liq, suiAmount: e.target.value })}
                                    className="input-field text-[12px]"
                                    placeholder="SUI amount"
                                    step="0.1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    value={liq.items}
                                    onChange={(e) => setLiq({ ...liq, items: e.target.value })}
                                    className="input-field text-[12px]"
                                    placeholder="Items"
                                  />
                                </div>
                                <button
                                  className="btn-primary text-[11px] py-2"
                                  disabled={poolStatus === "pending"}
                                  onClick={() => {
                                    if (!ownerCapId) return;
                                    addLiquidity({
                                      corridorId: corridor.id,
                                      ownerCapId,
                                      storageUnitId: depot.id,
                                      suiAmount: Math.floor(Number(liq.suiAmount) * 1_000_000_000),
                                      additionalItems: Number(liq.items) || 0,
                                    });
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : isOwner ? (
                        /* Create pool form */
                        <div>
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            <div>
                              <label className="text-[10px] text-eve-muted block mb-1">Item Type ID</label>
                              <input
                                type="number"
                                value={form.itemTypeId}
                                onChange={(e) => setForm({ ...form, itemTypeId: e.target.value })}
                                className="input-field text-[12px]"
                                placeholder="e.g. 1001"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-eve-muted block mb-1">Fee (bps)</label>
                              <input
                                type="number"
                                value={form.feeBps}
                                onChange={(e) => setForm({ ...form, feeBps: e.target.value })}
                                className="input-field text-[12px]"
                                placeholder="30"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-eve-muted block mb-1">Initial SUI</label>
                              <input
                                type="number"
                                value={form.initialSui}
                                onChange={(e) => setForm({ ...form, initialSui: e.target.value })}
                                className="input-field text-[12px]"
                                placeholder="1.0"
                                step="0.1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-eve-muted block mb-1">Initial Items</label>
                              <input
                                type="number"
                                value={form.initialItems}
                                onChange={(e) => setForm({ ...form, initialItems: e.target.value })}
                                className="input-field text-[12px]"
                                placeholder="100"
                              />
                            </div>
                          </div>
                          <button
                            className="btn-primary text-xs w-full"
                            disabled={poolStatus === "pending" || !form.itemTypeId || !form.initialSui || !form.initialItems}
                            onClick={() => {
                              if (!ownerCapId) return;
                              createPool({
                                corridorId: corridor.id,
                                ownerCapId,
                                storageUnitId: depot.id,
                                itemTypeId: Number(form.itemTypeId),
                                feeBps: Number(form.feeBps),
                                initialSuiAmount: Math.floor(Number(form.initialSui) * 1_000_000_000),
                                initialItems: Number(form.initialItems),
                              });
                            }}
                          >
                            {poolStatus === "pending" ? "Creating..." : `Create Pool ${label}`}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-eve-muted">No pool configured. Owner can create one.</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status + Emergency */}
                <div className="card p-6 border-eve-red/15">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-[13px] font-semibold text-eve-red">
                      <AlertTriangle className="w-4 h-4" /> Status & Emergency Controls
                    </h3>
                    <TxStatusBadge status={emStatus || csStatus} error={emError || csError} />
                  </div>
                  <div className="flex items-center gap-2 mb-4 text-xs text-eve-text-dim">
                    <span>Current status:</span>
                    <span className={`badge ${statusBg(corridor.status)}`}>{corridor.status}</span>
                    <span className="text-eve-muted">|</span>
                    <span>Owner: {abbreviateAddress(corridor.owner)}</span>
                    <span className="text-eve-muted">|</span>
                    <span>Fee recipient: {abbreviateAddress(corridor.feeRecipient)}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="btn-danger flex items-center gap-2"
                      disabled={emStatus === "pending" || !isOwner}
                      onClick={() => {
                        if (!ownerCapId) return;
                        if (corridor.status === "emergency") {
                          emergencyUnlock(corridor.id, ownerCapId);
                        } else {
                          emergencyLock(corridor.id, ownerCapId);
                        }
                      }}
                    >
                      <Power className="w-4 h-4" />
                      {corridor.status === "emergency" ? "Lift Lockdown" : "Emergency Lockdown"}
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={csStatus === "pending" || !isOwner}
                      onClick={() => {
                        if (!ownerCapId) return;
                        if (corridor.status === "inactive") {
                          activateCorridor(corridor.id, ownerCapId);
                        } else if (corridor.status === "active") {
                          deactivateCorridor(corridor.id, ownerCapId);
                        }
                      }}
                    >
                      {corridor.status === "inactive" ? "Activate Corridor" : "Deactivate Corridor"}
                    </button>
                  </div>
                  {!isOwner && (
                    <p className="text-[10px] text-eve-muted mt-3">
                      Only the corridor owner can perform these actions.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* ========== CREATE TAB ========== */
        <div className="card p-8 max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold">Register New Corridor</h3>
              <p className="text-sm text-eve-text-dim mt-0.5">Link gates and depots into a trade route</p>
            </div>
            <TxStatusBadge status={regStatus} error={regError} />
          </div>

          {regStatus === "success" ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-eve-green mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-eve-green mb-2">Corridor Registered!</h3>
              <p className="text-sm text-eve-text-dim mb-6 max-w-sm mx-auto">
                Your corridor has been created. A CorridorOwnerCap has been sent to your wallet.
                Now configure your tolls and depots to make it live.
              </p>
              <button
                onClick={() => {
                  setTab("manage");
                  setSetupStep("tolls");
                  refetchCorridors();
                  refetchCaps();
                }}
                className="btn-primary"
              >
                Configure Corridor <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="label">Corridor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Helios Express"
                  className="input-field"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <AssemblyPicker
                  label="Source Gate"
                  assemblies={gates}
                  isLoading={assembliesLoading}
                  value={createForm.sourceGateId}
                  onChange={(id) => setCreateForm((f) => ({ ...f, sourceGateId: id }))}
                  type="gate"
                />
                <AssemblyPicker
                  label="Destination Gate"
                  assemblies={gates.filter((g) => g.id !== createForm.sourceGateId)}
                  isLoading={assembliesLoading}
                  value={createForm.destGateId}
                  onChange={(id) => setCreateForm((f) => ({ ...f, destGateId: id }))}
                  type="gate"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <AssemblyPicker
                  label="Depot A (Storage Unit)"
                  assemblies={storageUnits}
                  isLoading={assembliesLoading}
                  value={createForm.depotAId}
                  onChange={(id) => setCreateForm((f) => ({ ...f, depotAId: id }))}
                  type="storage_unit"
                />
                <AssemblyPicker
                  label="Depot B (Storage Unit)"
                  assemblies={storageUnits.filter((s) => s.id !== createForm.depotAId)}
                  isLoading={assembliesLoading}
                  value={createForm.depotBId}
                  onChange={(id) => setCreateForm((f) => ({ ...f, depotBId: id }))}
                  type="storage_unit"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Fee Recipient Address</label>
                  {account && createForm.feeRecipient !== account.address && (
                    <button
                      type="button"
                      onClick={() => setCreateForm((f) => ({ ...f, feeRecipient: account.address }))}
                      className="text-[10px] text-eve-orange hover:text-eve-orange-light transition-colors"
                    >
                      Use my wallet
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field font-mono text-xs"
                  value={createForm.feeRecipient}
                  onChange={(e) => setCreateForm((f) => ({ ...f, feeRecipient: e.target.value }))}
                />
                {account && createForm.feeRecipient === account.address && (
                  <p className="text-[10px] text-eve-text-dim mt-1">Using your connected wallet address</p>
                )}
              </div>

              <button
                className="btn-primary w-full"
                disabled={regStatus === "pending" || !isFormValid}
                onClick={handleCreate}
              >
                {regStatus === "pending" ? (
                  <><Loader2 className="w-4 h-4 inline animate-spin mr-2" /> Registering...</>
                ) : (
                  "Register Corridor"
                )}
              </button>

              {!isFormValid && createForm.name && (
                <p className="text-[10px] text-eve-muted text-center">
                  All fields must be valid Sui addresses (starting with 0x)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
