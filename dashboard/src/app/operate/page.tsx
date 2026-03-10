"use client";

import { useState } from "react";
import { useCorridors } from "@/hooks/use-corridors";
import {
  useRegisterCorridor,
  useSetTollConfig,
  useEmergencyControl,
  useCorridorStatus,
  useWithdrawRevenue,
} from "@/hooks/use-fen-transactions";
import { formatSui, statusBg } from "@/lib/utils";
import { Plus, Settings, Shield, AlertTriangle, DollarSign, Power, Loader2, CheckCircle, XCircle, Wallet } from "lucide-react";
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
      <XCircle className="w-3 h-3" /> {error?.slice(0, 40) || "Failed"}
    </span>
  );
  return null;
}

export default function OperatePage() {
  const [tab, setTab] = useState<"manage" | "create">("manage");
  const { corridors } = useCorridors();
  const [selectedCorridor, setSelectedCorridor] = useState(corridors[0]?.id || "");
  const account = useCurrentAccount();

  const corridor = corridors.find((c) => c.id === selectedCorridor) || corridors[0];
  const totalRevenue = corridor ? corridor.totalTollRevenue + corridor.totalTradeRevenue : 0;

  const { registerCorridor, status: regStatus, error: regError } = useRegisterCorridor();
  const { setTollConfig, status: tollStatus, error: tollError } = useSetTollConfig();
  const { emergencyLock, emergencyUnlock, status: emStatus, error: emError } = useEmergencyControl();
  const { activateCorridor, deactivateCorridor, status: csStatus, error: csError } = useCorridorStatus();
  const { withdrawAll, status: wdStatus, error: wdError } = useWithdrawRevenue();

  const [createForm, setCreateForm] = useState({
    name: "",
    sourceGateId: "",
    destGateId: "",
    depotAId: "",
    depotBId: "",
    feeRecipient: "",
  });

  const handleCreate = () => {
    if (!account) return;
    registerCorridor(createForm);
  };

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
          onClick={() => setTab("manage")}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            tab === "manage" ? "bg-eve-elevated text-eve-text shadow-sm" : "text-eve-text-dim hover:text-eve-text"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" /> Manage
        </button>
        <button
          onClick={() => setTab("create")}
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
              {corridors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCorridor(c.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                    selectedCorridor === c.id
                      ? "border-eve-orange/40 bg-eve-orange/5"
                      : "border-eve-border hover:border-eve-border/80 bg-eve-surface hover:bg-eve-elevated/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold">{c.name}</span>
                    <span className={`badge ${statusBg(c.status)}`}>{c.status}</span>
                  </div>
                  <div className="text-xs text-eve-text-dim mt-1.5">
                    {c.sourceGate.solarSystem || "Source"} → {c.destGate.solarSystem || "Dest"}
                  </div>
                </button>
              ))}
            </div>

            {/* Config panels */}
            {corridor && (
              <div className="lg:col-span-2 space-y-5">
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
                        disabled={wdStatus === "pending"}
                        onClick={() => withdrawAll(corridor.id, "0x0")}
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
                      <label className="label">Gate A Toll</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          defaultValue={corridor.sourceGate.tollAmount / 1_000_000_000}
                          className="input-field text-[13px] flex-1"
                        />
                        <span className="text-xs text-eve-muted self-center">SUI</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Gate B Toll</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          defaultValue={corridor.destGate.tollAmount / 1_000_000_000}
                          className="input-field text-[13px] flex-1"
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
                        <input
                          type="number"
                          defaultValue={corridor.sourceGate.surgeMultiplier / 100}
                          className="input-field text-[13px] w-20"
                          step={5}
                        />
                        <span className="text-xs text-eve-muted">%</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        className="btn-primary w-full"
                        disabled={tollStatus === "pending"}
                        onClick={() => {
                          setTollConfig(corridor.id, "0x0", corridor.sourceGate.id, corridor.sourceGate.tollAmount);
                        }}
                      >
                        {tollStatus === "pending" ? "Updating..." : "Update Tolls"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Depot config */}
                <div className="card p-6">
                  <h3 className="flex items-center gap-2 text-[13px] font-semibold mb-5">
                    <Settings className="w-4 h-4 text-eve-orange" /> Depot Configuration
                  </h3>
                  {[corridor.depotA, corridor.depotB].map((depot, i) => (
                    <div key={depot.id || i} className="mb-4 last:mb-0 p-4 bg-eve-bg rounded-xl">
                      <div className="text-xs font-semibold text-eve-text-dim mb-3">
                        Depot {i === 0 ? "A" : "B"}{depot.name ? `: ${depot.name}` : ""}
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="label">Input</label>
                          <div className="text-[13px] font-medium">{depot.inputItem.name || "—"}</div>
                        </div>
                        <div>
                          <label className="label">Output</label>
                          <div className="text-[13px] font-medium">{depot.outputItem.name || "—"}</div>
                        </div>
                        <div>
                          <label className="label">Ratio</label>
                          <div className="flex gap-1 items-center">
                            <input type="number" defaultValue={depot.ratioIn} className="input-field text-[13px] w-14" />
                            <span className="text-eve-muted">:</span>
                            <input type="number" defaultValue={depot.ratioOut} className="input-field text-[13px] w-14" />
                          </div>
                        </div>
                        <div>
                          <label className="label">Fee</label>
                          <div className="flex gap-1 items-center">
                            <input type="number" defaultValue={depot.feeBps / 100} step={0.1} className="input-field text-[13px] w-16" />
                            <span className="text-xs text-eve-muted">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn-primary text-[13px] mt-3">Update Depots</button>
                </div>

                {/* Emergency */}
                <div className="card p-6 border-eve-red/15">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-[13px] font-semibold text-eve-red">
                      <AlertTriangle className="w-4 h-4" /> Emergency Controls
                    </h3>
                    <TxStatusBadge status={emStatus || csStatus} error={emError || csError} />
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="btn-danger flex items-center gap-2"
                      disabled={emStatus === "pending"}
                      onClick={() => {
                        if (corridor.status === "emergency") {
                          emergencyUnlock(corridor.id, "0x0");
                        } else {
                          emergencyLock(corridor.id, "0x0");
                        }
                      }}
                    >
                      <Power className="w-4 h-4" />
                      {corridor.status === "emergency" ? "Lift Lockdown" : "Emergency Lockdown"}
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={csStatus === "pending"}
                      onClick={() => {
                        if (corridor.status === "inactive") {
                          activateCorridor(corridor.id, "0x0");
                        } else {
                          deactivateCorridor(corridor.id, "0x0");
                        }
                      }}
                    >
                      {corridor.status === "inactive" ? "Activate Corridor" : "Deactivate Corridor"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="card p-8 max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold">Register New Corridor</h3>
              <p className="text-sm text-eve-text-dim mt-0.5">Link gates and depots into a trade route</p>
            </div>
            <TxStatusBadge status={regStatus} error={regError} />
          </div>
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
              <div>
                <label className="label">Source Gate ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field font-mono text-xs"
                  value={createForm.sourceGateId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, sourceGateId: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Destination Gate ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field font-mono text-xs"
                  value={createForm.destGateId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, destGateId: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="label">Depot A (SSU) ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field font-mono text-xs"
                  value={createForm.depotAId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, depotAId: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Depot B (SSU) ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field font-mono text-xs"
                  value={createForm.depotBId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, depotBId: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Fee Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                className="input-field font-mono text-xs"
                value={createForm.feeRecipient}
                onChange={(e) => setCreateForm((f) => ({ ...f, feeRecipient: e.target.value }))}
              />
            </div>
            <button
              className="btn-primary w-full"
              disabled={regStatus === "pending" || !createForm.name}
              onClick={handleCreate}
            >
              {regStatus === "pending" ? "Registering..." : "Register Corridor"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
