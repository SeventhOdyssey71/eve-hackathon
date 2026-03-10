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
import { Plus, Settings, Shield, AlertTriangle, DollarSign, Power, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

function TxStatusBadge({ status, error, digest }: { status: string; error: string | null; digest: string | null }) {
  if (status === "idle") return null;
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
      <Loader2 className="w-3 h-3 animate-spin" /> Signing...
    </span>
  );
  if (status === "success") return (
    <span className="inline-flex items-center gap-1 text-xs text-eve-green">
      <CheckCircle className="w-3 h-3" /> Confirmed
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1 text-xs text-eve-red" title={error || ""}>
      <XCircle className="w-3 h-3" /> {error?.slice(0, 40)}
    </span>
  );
  return null;
}

export default function OperatePage() {
  const [tab, setTab] = useState<"manage" | "create">("manage");
  const { corridors } = useCorridors();
  const [selectedCorridor, setSelectedCorridor] = useState(corridors[0]?.id);
  const account = useCurrentAccount();

  const corridor = corridors.find((c) => c.id === selectedCorridor) || corridors[0];
  const totalRevenue = corridor ? corridor.totalTollRevenue + corridor.totalTradeRevenue : 0;

  // Transaction hooks
  const { registerCorridor, status: regStatus, error: regError, digest: regDigest } = useRegisterCorridor();
  const { setTollConfig, status: tollStatus, error: tollError, digest: tollDigest } = useSetTollConfig();
  const { emergencyLock, emergencyUnlock, status: emStatus, error: emError, digest: emDigest } = useEmergencyControl();
  const { activateCorridor, deactivateCorridor, status: csStatus, error: csError, digest: csDigest } = useCorridorStatus();
  const { withdrawAll, status: wdStatus, error: wdError, digest: wdDigest } = useWithdrawRevenue();

  // Form state for create
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Operator Panel</h1>
        <p className="text-sm text-eve-text-dim mt-1">
          {account ? "Manage your trade corridors" : "Connect wallet to manage corridors"}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("manage")}
          className={`px-4 py-2 rounded text-sm transition-colors ${
            tab === "manage" ? "bg-eve-orange/10 text-eve-orange border border-eve-orange/20" : "text-eve-text-dim hover:text-eve-text"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" /> Manage
        </button>
        <button
          onClick={() => setTab("create")}
          className={`px-4 py-2 rounded text-sm transition-colors ${
            tab === "create" ? "bg-eve-orange/10 text-eve-orange border border-eve-orange/20" : "text-eve-text-dim hover:text-eve-text"
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" /> Create New
        </button>
      </div>

      {tab === "manage" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Corridor selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-eve-text-dim">Your Corridors</h3>
            {corridors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCorridor(c.id)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedCorridor === c.id
                    ? "border-eve-orange bg-eve-orange/5"
                    : "border-eve-border hover:border-eve-border bg-eve-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-xs text-eve-text-dim mt-1">
                  {c.sourceGate.solarSystem} → {c.destGate.solarSystem}
                </div>
              </button>
            ))}
          </div>

          {/* Config panels */}
          {corridor && (
            <div className="lg:col-span-2 space-y-4">
              {/* Revenue card */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-eve-orange" /> Revenue
                  </h3>
                  <div className="flex items-center gap-2">
                    <TxStatusBadge status={wdStatus} error={wdError} digest={wdDigest} />
                    <button
                      className="btn-primary text-xs py-1"
                      disabled={!account || wdStatus === "pending"}
                      onClick={() => withdrawAll(corridor.id)}
                    >
                      {wdStatus === "pending" ? "Withdrawing..." : "Withdraw All"}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-eve-text-dim">Total Revenue</div>
                    <div className="text-lg font-bold text-eve-orange">{formatSui(totalRevenue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-eve-text-dim">Toll Revenue</div>
                    <div className="text-sm font-medium">{formatSui(corridor.totalTollRevenue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-eve-text-dim">Trade Revenue</div>
                    <div className="text-sm font-medium">{formatSui(corridor.totalTradeRevenue)}</div>
                  </div>
                </div>
              </div>

              {/* Toll config */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-eve-orange" /> Toll Configuration
                  </h3>
                  <TxStatusBadge status={tollStatus} error={tollError} digest={tollDigest} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Gate A Toll</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        defaultValue={corridor.sourceGate.tollAmount / 1_000_000_000}
                        className="input-field text-sm flex-1"
                      />
                      <span className="text-xs text-eve-text-dim self-center">SUI</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Gate B Toll</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        defaultValue={corridor.destGate.tollAmount / 1_000_000_000}
                        className="input-field text-sm flex-1"
                      />
                      <span className="text-xs text-eve-text-dim self-center">SUI</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Surge Pricing</label>
                    <div className="flex items-center gap-3">
                      <button className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                        corridor.sourceGate.surgeActive
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-eve-elevated text-eve-muted border-eve-border"
                      }`}>
                        {corridor.sourceGate.surgeActive ? "Active" : "Inactive"}
                      </button>
                      <input
                        type="number"
                        defaultValue={corridor.sourceGate.surgeMultiplier / 100}
                        className="input-field text-sm w-20"
                        step={5}
                      />
                      <span className="text-xs text-eve-text-dim">%</span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      className="btn-primary text-sm w-full"
                      disabled={!account || tollStatus === "pending"}
                      onClick={() => {
                        // AdminCap ID would come from wallet owned objects in production
                        setTollConfig("0x0", corridor.sourceGate.id, corridor.sourceGate.tollAmount, corridor.feeRecipient);
                      }}
                    >
                      {tollStatus === "pending" ? "Updating..." : "Update Tolls"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Depot config */}
              <div className="card p-5">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-eve-orange" /> Depot Configuration
                </h3>
                {[corridor.depotA, corridor.depotB].map((depot, i) => (
                  <div key={depot.id} className="mb-4 last:mb-0 p-3 bg-eve-bg rounded">
                    <div className="text-xs font-bold text-eve-text-dim mb-2">
                      Depot {i === 0 ? "A" : "B"}: {depot.name}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="label">Input</label>
                        <div className="text-sm">{depot.inputItem.name}</div>
                      </div>
                      <div>
                        <label className="label">Output</label>
                        <div className="text-sm">{depot.outputItem.name}</div>
                      </div>
                      <div>
                        <label className="label">Ratio</label>
                        <div className="flex gap-1 items-center">
                          <input type="number" defaultValue={depot.ratioIn} className="input-field text-sm w-14" />
                          <span className="text-eve-muted">:</span>
                          <input type="number" defaultValue={depot.ratioOut} className="input-field text-sm w-14" />
                        </div>
                      </div>
                      <div>
                        <label className="label">Fee</label>
                        <div className="flex gap-1 items-center">
                          <input type="number" defaultValue={depot.feeBps / 100} step={0.1} className="input-field text-sm w-16" />
                          <span className="text-xs text-eve-muted">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn-primary text-sm mt-2" disabled={!account}>
                  Update Depots
                </button>
              </div>

              {/* Emergency controls */}
              <div className="card p-5 border-eve-red/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-eve-red">
                    <AlertTriangle className="w-4 h-4" /> Emergency Controls
                  </h3>
                  <TxStatusBadge status={emStatus || csStatus} error={emError || csError} digest={emDigest || csDigest} />
                </div>
                <div className="flex gap-3">
                  <button
                    className="btn-danger text-sm flex items-center gap-2"
                    disabled={!account || emStatus === "pending"}
                    onClick={() => {
                      if (corridor.status === "emergency") {
                        emergencyUnlock("0x0", corridor.sourceGate.id);
                      } else {
                        emergencyLock("0x0", corridor.sourceGate.id);
                      }
                    }}
                  >
                    <Power className="w-4 h-4" />
                    {corridor.status === "emergency" ? "Lift Lockdown" : "Emergency Lockdown"}
                  </button>
                  <button
                    className="btn-secondary text-sm"
                    disabled={!account || csStatus === "pending"}
                    onClick={() => {
                      if (corridor.status === "inactive") {
                        activateCorridor(corridor.id);
                      } else {
                        deactivateCorridor(corridor.id);
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
      ) : (
        /* Create new corridor form */
        <div className="card p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold">Register New Corridor</h3>
            <TxStatusBadge status={regStatus} error={regError} digest={regDigest} />
          </div>
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Source Gate ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field"
                  value={createForm.sourceGateId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, sourceGateId: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Destination Gate ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field"
                  value={createForm.destGateId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, destGateId: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Depot A (SSU) ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field"
                  value={createForm.depotAId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, depotAId: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Depot B (SSU) ID</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-field"
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
                className="input-field"
                value={createForm.feeRecipient}
                onChange={(e) => setCreateForm((f) => ({ ...f, feeRecipient: e.target.value }))}
              />
            </div>
            <button
              className="btn-primary"
              disabled={!account || regStatus === "pending" || !createForm.name}
              onClick={handleCreate}
            >
              {!account
                ? "Connect Wallet to Register"
                : regStatus === "pending"
                ? "Registering..."
                : "Register Corridor"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
