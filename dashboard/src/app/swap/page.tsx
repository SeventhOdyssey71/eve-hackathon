"use client";

import { useState, useMemo, useCallback } from "react";
import { useCorridors, usePoolConfigs } from "@/hooks/use-corridors";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/sui-config";
import { formatSui, formatNumber, formatPercent } from "@/lib/utils";
import { getItemName } from "@/lib/items";
import { useCharacter, useOwnedItems } from "@/hooks/use-character";
import { buildSellItems, buildBuyItems } from "@/lib/transactions";
import {
  Repeat,
  ArrowDown,
  Droplets,
  Info,
  AlertTriangle,
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { PoolConfig } from "@/lib/types";

interface PoolOption {
  corridorId: string;
  corridorName: string;
  storageUnitId: string;
  pool: PoolConfig;
}

function computeOutput(reserveIn: number, reserveOut: number, amountIn: number, feeBps: number) {
  if (reserveIn <= 0 || reserveOut <= 0 || amountIn <= 0) return { output: 0, fee: 0 };
  const feeFactor = 10000 - feeBps;
  const amountAfterFee = Math.floor((amountIn * feeFactor) / 10000);
  const numerator = amountAfterFee * reserveOut;
  const denominator = reserveIn + amountAfterFee;
  const output = Math.floor(numerator / denominator);
  const fee = Math.floor((amountIn * feeBps) / 10000);
  return { output, fee };
}

function computePriceImpact(reserveIn: number, reserveOut: number, amountIn: number, feeBps: number) {
  if (reserveIn <= 0 || reserveOut <= 0 || amountIn <= 0) return 0;
  const spot = reserveOut / reserveIn;
  const { output } = computeOutput(reserveIn, reserveOut, amountIn, feeBps);
  if (output <= 0) return 10000;
  const exec = output / amountIn;
  if (exec >= spot) return 0;
  return Math.round(((spot - exec) / spot) * 10000);
}

export default function SwapPage() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("fenPackageId");
  const { corridors, isLoading } = useCorridors();
  const [direction, setDirection] = useState<"buy" | "sell">("sell");
  const [selectedPoolIdx, setSelectedPoolIdx] = useState(0);
  const [inputAmount, setInputAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(100); // 1% default

  // Find the first active corridor for pool queries
  const firstActive = corridors.find((c) => c.status === "active");
  const { poolA, poolB, isLoading: poolsLoading } = usePoolConfigs(
    firstActive?.id || "",
    firstActive?.depotA.id || "",
    firstActive?.depotB.id || "",
  );

  // Build real pool options
  const realPools: PoolOption[] = useMemo(() => {
    const pools: PoolOption[] = [];
    for (const c of corridors) {
      if (c.status !== "active") continue;
      // For the first active corridor, use fetched pool configs
      if (c.id === firstActive?.id) {
        if (poolA?.isActive) {
          pools.push({
            corridorId: c.id,
            corridorName: c.name,
            storageUnitId: c.depotA.id,
            pool: poolA,
          });
        }
        if (poolB?.isActive) {
          pools.push({
            corridorId: c.id,
            corridorName: c.name,
            storageUnitId: c.depotB.id,
            pool: poolB,
          });
        }
      }
    }
    return pools;
  }, [corridors, firstActive, poolA, poolB]);

  const selected = realPools[selectedPoolIdx] || null;
  const pool = selected?.pool;

  const parsedInput = Number(inputAmount) || 0;

  // Calculate swap output
  const estimate = useMemo(() => {
    if (!pool || parsedInput <= 0) return { output: 0, fee: 0, impact: 0 };

    if (direction === "sell") {
      // Selling items for SUI: reserve_in = items, reserve_out = sui
      const { output, fee } = computeOutput(pool.reserveItems, pool.reserveSui, parsedInput, pool.feeBps);
      const impact = computePriceImpact(pool.reserveItems, pool.reserveSui, parsedInput, pool.feeBps);
      return { output, fee, impact };
    } else {
      // Buying items with SUI: reserve_in = sui, reserve_out = items
      const suiMist = Math.floor(parsedInput * 1_000_000_000);
      const { output, fee } = computeOutput(pool.reserveSui, pool.reserveItems, suiMist, pool.feeBps);
      const impact = computePriceImpact(pool.reserveSui, pool.reserveItems, suiMist, pool.feeBps);
      return { output, fee, impact };
    }
  }, [pool, parsedInput, direction]);

  const minOutput = Math.floor(estimate.output * (1 - slippageBps / 10000));

  const spotPrice = pool
    ? pool.reserveItems > 0
      ? pool.reserveSui / pool.reserveItems / 1_000_000_000
      : 0
    : 0;

  const [showRequirements, setShowRequirements] = useState(false);
  const { characterId } = useCharacter();
  const { items: ownedItems } = useOwnedItems();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const matchingItem = pool ? ownedItems.find((item) => item.typeId === pool.itemTypeId) : null;
  const canExecute = !!account && !!characterId && (direction === "buy" || !!matchingItem);

  const handleSwap = useCallback(async () => {
    if (!account || !selected || !pool || parsedInput <= 0) return;

    if (characterId && (direction === "buy" || matchingItem)) {
      setTxStatus("pending");
      setTxError(null);
      try {
        const tx = direction === "sell"
          ? buildSellItems({
              packageId,
              corridorId: selected.corridorId,
              storageUnitId: selected.storageUnitId,
              characterId,
              inputItemId: matchingItem!.objectId,
              minSuiOut: minOutput,
            })
          : buildBuyItems({
              packageId,
              corridorId: selected.corridorId,
              storageUnitId: selected.storageUnitId,
              characterId,
              suiAmount: Math.floor(parsedInput * 1_000_000_000),
              minItemsOut: minOutput,
            });
        const result = await signAndExecute({ transaction: tx });
        setTxDigest(result.digest);
        setTxStatus("success");
      } catch (err) {
        setTxError(err instanceof Error ? err.message : "Swap failed");
        setTxStatus("error");
      }
      return;
    }

    setShowRequirements(true);
  }, [account, selected, pool, parsedInput, characterId, matchingItem, direction, minOutput, packageId, signAndExecute]);

  return (
    <div className="space-y-8 max-w-[1440px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AMM Swap</h1>
          <p className="text-sm text-eve-text-dim mt-1">
            Trade items for SUI using constant-product AMM pools
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-eve-text-dim">
            {realPools.length} active pool{realPools.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {isLoading || poolsLoading ? (
        <div className="card flex items-center justify-center py-20">
          <div className="animate-pulse text-eve-text-dim text-sm">Loading pools...</div>
        </div>
      ) : realPools.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <Repeat className="w-7 h-7 text-eve-muted" />
          </div>
          <h3 className="text-lg font-semibold text-eve-text mb-1">No AMM Pools Available</h3>
          <p className="text-sm text-eve-text-dim max-w-sm mb-6">
            AMM pools appear when corridor operators create and activate liquidity pools on their depots.
          </p>
          <div className="flex gap-3">
            <Link href="/corridors" className="btn-secondary">View Corridors</Link>
            <Link href="/operate" className="btn-primary">Create Pool</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Swap Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="section-title flex items-center gap-2">
                  <Repeat className="w-4 h-4" /> Swap
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-eve-text-dim">Slippage:</span>
                  {[50, 100, 300].map((bps) => (
                    <button
                      key={bps}
                      onClick={() => setSlippageBps(bps)}
                      className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                        slippageBps === bps
                          ? "bg-eve-orange/10 text-eve-orange"
                          : "text-eve-text-dim hover:text-eve-text hover:bg-white/[0.04]"
                      }`}
                    >
                      {formatPercent(bps)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pool selector */}
              <div className="mb-5">
                <label className="label">Pool</label>
                <select
                  className="input-field text-[13px]"
                  value={selectedPoolIdx}
                  onChange={(e) => setSelectedPoolIdx(Number(e.target.value))}
                >
                  {realPools.map((p, i) => (
                    <option key={`${p.corridorId}-${p.storageUnitId}`} value={i}>
                      {p.corridorName} -- {getItemName(p.pool.itemTypeId)} (
                      {formatSui(p.pool.reserveSui)} / {formatNumber(p.pool.reserveItems)} items)
                    </option>
                  ))}
                </select>
              </div>

              {/* Input */}
              <div className="space-y-3">
                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-eve-text-dim font-medium">
                      {direction === "sell" ? "You Send (Items)" : "You Send (SUI)"}
                    </span>
                    <button
                      onClick={() => setDirection(direction === "sell" ? "buy" : "sell")}
                      className="text-[10px] text-eve-orange hover:text-eve-orange-light transition-colors"
                    >
                      Switch direction
                    </button>
                  </div>
                  <input
                    type="number"
                    className="w-full bg-transparent text-2xl font-semibold text-eve-text placeholder-eve-muted/40 focus:outline-none"
                    placeholder="0"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    min={0}
                  />
                  <div className="text-xs text-eve-muted mt-1">
                    {direction === "sell"
                      ? getItemName(pool?.itemTypeId || 0)
                      : "SUI"}
                  </div>
                </div>

                {/* Direction arrow */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setDirection(direction === "sell" ? "buy" : "sell")}
                    className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-eve-border transition-colors"
                  >
                    <ArrowDown className="w-4 h-4 text-eve-orange" />
                  </button>
                </div>

                {/* Output */}
                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-eve-text-dim font-medium">
                      {direction === "sell" ? "You Receive (SUI)" : "You Receive (Items)"}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-eve-orange">
                    {direction === "sell"
                      ? estimate.output > 0
                        ? (estimate.output / 1_000_000_000).toFixed(4)
                        : "0"
                      : estimate.output > 0
                        ? formatNumber(estimate.output)
                        : "0"}
                  </div>
                  <div className="text-xs text-eve-muted mt-1">
                    {direction === "sell"
                      ? "SUI"
                      : getItemName(pool?.itemTypeId || 0)}
                    {minOutput > 0 && (
                      <span className="ml-2 text-eve-text-dim">
                        (min: {direction === "sell"
                          ? (minOutput / 1_000_000_000).toFixed(4)
                          : formatNumber(minOutput)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Impact Warning */}
              {estimate.impact > 500 && (
                <div className={`mt-4 flex items-center gap-2 text-xs p-3 rounded-lg ${
                  estimate.impact > 1500
                    ? "bg-eve-red/10 text-eve-red"
                    : "bg-eve-yellow/10 text-eve-yellow"
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Price impact: {formatPercent(estimate.impact)}
                  {estimate.impact > 1500 && " -- Consider reducing trade size"}
                </div>
              )}

              {/* Swap details */}
              {pool && parsedInput > 0 && (
                <div className="mt-4 bg-white/[0.02] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-eve-text-dim mb-3 flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Swap Details
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Spot Price</span>
                    <span className="text-eve-text">{spotPrice.toFixed(6)} SUI per item</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Pool Fee</span>
                    <span className="text-eve-text">{formatPercent(pool.feeBps)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Price Impact</span>
                    <span className={estimate.impact > 500 ? "text-eve-yellow" : "text-eve-text"}>
                      {formatPercent(estimate.impact)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Slippage Tolerance</span>
                    <span className="text-eve-text">{formatPercent(slippageBps)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Min. Received</span>
                    <span className="text-eve-orange font-medium">
                      {direction === "sell"
                        ? `${(minOutput / 1_000_000_000).toFixed(4)} SUI`
                        : `${formatNumber(minOutput)} items`}
                    </span>
                  </div>
                </div>
              )}

              {/* Readiness + status */}
              {account && parsedInput > 0 && (
                <div className="mt-4 bg-white/[0.02] rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    {characterId ? <CheckCircle className="w-3 h-3 text-eve-green" /> : <XCircle className="w-3 h-3 text-eve-muted" />}
                    <span className="text-eve-text-dim">{characterId ? "Character found" : "No character found"}</span>
                  </div>
                  {direction === "sell" && (
                    <div className="flex items-center gap-2">
                      {matchingItem ? <CheckCircle className="w-3 h-3 text-eve-green" /> : <XCircle className="w-3 h-3 text-eve-muted" />}
                      <span className="text-eve-text-dim">{matchingItem ? `${getItemName(pool?.itemTypeId || 0)} available` : "Input items not in wallet"}</span>
                    </div>
                  )}
                </div>
              )}

              {txStatus === "success" && txDigest && (
                <div className="mt-3 bg-eve-green/5 border border-eve-green/20 rounded-xl p-3 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-eve-green" />
                  <span className="text-eve-green font-medium">Swap executed!</span>
                  <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" rel="noopener noreferrer" className="text-eve-orange ml-auto hover:underline">View tx</a>
                </div>
              )}
              {txStatus === "error" && txError && (
                <div className="mt-3 bg-eve-red/5 border border-eve-red/20 rounded-xl p-3 text-xs text-eve-red">{txError}</div>
              )}

              {/* Swap button */}
              <button
                className="btn-primary w-full mt-4"
                disabled={!account || parsedInput <= 0 || estimate.output <= 0 || txStatus === "pending"}
                onClick={handleSwap}
              >
                {txStatus === "pending" ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Executing...</span>
                ) : !account
                  ? "Connect Wallet to Swap"
                  : parsedInput <= 0
                    ? "Enter Amount"
                    : estimate.output <= 0
                      ? "Insufficient Liquidity"
                      : canExecute
                        ? direction === "sell"
                          ? `Execute: Sell ${parsedInput} Items for ${(estimate.output / 1_000_000_000).toFixed(4)} SUI`
                          : `Execute: Buy ${formatNumber(estimate.output)} Items for ${parsedInput} SUI`
                        : direction === "sell"
                          ? `Sell ${parsedInput} Items for ${(estimate.output / 1_000_000_000).toFixed(4)} SUI`
                          : `Buy ${formatNumber(estimate.output)} Items for ${parsedInput} SUI`}
              </button>
            </div>
          </div>

          {/* Pool Info Sidebar */}
          <div className="space-y-5">
            {/* Pool Stats */}
            {pool && (
              <div className="card p-5">
                <h4 className="section-title mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Pool Info
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-eve-muted">Item Type</div>
                    <div className="text-sm font-medium text-eve-text mt-0.5">
                      {getItemName(pool.itemTypeId)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-eve-muted">Spot Price</div>
                    <div className="text-sm font-medium text-eve-orange mt-0.5">
                      {spotPrice.toFixed(6)} SUI / item
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-eve-muted">Pool Fee</div>
                    <div className="text-sm font-medium text-eve-text mt-0.5">
                      {formatPercent(pool.feeBps)}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/[0.06]">
                    <div className="text-xs text-eve-muted mb-2">Reserves</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="card-elevated p-3 text-center">
                        <div className="text-xs text-eve-muted">SUI</div>
                        <div className="text-sm font-semibold text-eve-text mt-1">
                          {formatSui(pool.reserveSui)}
                        </div>
                      </div>
                      <div className="card-elevated p-3 text-center">
                        <div className="text-xs text-eve-muted">Items</div>
                        <div className="text-sm font-semibold text-eve-text mt-1">
                          {formatNumber(pool.reserveItems)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pool Activity */}
            {pool && (
              <div className="card p-5">
                <h4 className="section-title mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Pool Stats
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Total Swaps</span>
                    <span className="text-eve-text font-medium">{formatNumber(pool.totalSwaps)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">SUI Volume</span>
                    <span className="text-eve-text font-medium">{formatSui(pool.totalSuiVolume)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Item Volume</span>
                    <span className="text-eve-text font-medium">{formatNumber(pool.totalItemVolume)} items</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-eve-muted">Fees Collected</span>
                    <span className="text-eve-orange font-medium">{formatSui(pool.totalFeesCollected)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="card p-5">
              <h4 className="section-title mb-3 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> How AMM Works
              </h4>
              <div className="space-y-2 text-xs text-eve-text-dim leading-relaxed">
                <p>
                  Each pool uses the <span className="text-eve-text">constant-product formula</span> (x * y = k) to price items against SUI.
                </p>
                <p>
                  <span className="text-eve-text">Sell items:</span> Deposit items into the pool's SSU and receive SUI from the pool balance.
                </p>
                <p>
                  <span className="text-eve-text">Buy items:</span> Pay SUI into the pool and withdraw items from the SSU.
                </p>
                <p>
                  Larger trades have more <span className="text-eve-yellow">price impact</span>. Split large trades for better rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirements dialog */}
      {showRequirements && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRequirements(false)}>
          <div className="card p-6 max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-eve-text">Swap Transaction Preview</h3>
            <p className="text-sm text-eve-text-dim">
              This swap calls <code className="text-eve-orange text-xs">{direction === "sell" ? "liquidity_pool::sell_items" : "liquidity_pool::buy_items"}</code> on-chain and requires the following EVE Frontier objects:
            </p>
            <div className="bg-white/[0.02] rounded-xl p-4 space-y-2 text-xs font-mono">
              <div><span className="text-eve-muted">package:</span> <span className="text-eve-text">{packageId.slice(0, 16)}...</span></div>
              <div><span className="text-eve-muted">corridor:</span> <span className="text-eve-text">{selected.corridorId.slice(0, 16)}...</span></div>
              <div><span className="text-eve-muted">storage_unit:</span> <span className="text-eve-text">{selected.storageUnitId.slice(0, 16)}...</span></div>
              <div><span className="text-eve-muted">character:</span> <span className="text-eve-yellow">required (EVE Frontier Character NFT)</span></div>
              {direction === "sell" ? (
                <>
                  <div><span className="text-eve-muted">input_item:</span> <span className="text-eve-yellow">required (in-game Item object)</span></div>
                  <div><span className="text-eve-muted">min_sui_out:</span> <span className="text-eve-text">{minOutput} MIST</span></div>
                </>
              ) : (
                <>
                  <div><span className="text-eve-muted">sui_amount:</span> <span className="text-eve-text">{Math.floor(parsedInput * 1_000_000_000)} MIST</span></div>
                  <div><span className="text-eve-muted">min_items_out:</span> <span className="text-eve-text">{minOutput}</span></div>
                </>
              )}
            </div>
            <p className="text-xs text-eve-muted">
              Character and Item objects are created within the EVE Frontier game world. Connect with an EVE Frontier wallet that holds these objects to execute swaps.
            </p>
            <button className="btn-secondary w-full" onClick={() => setShowRequirements(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
