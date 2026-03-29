"use client";

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useState } from "react";
import { useNetworkVariable } from "@/lib/sui-config";
import {
  buildAuthorizeStorageUnitExtension,
  buildAuthorizeGateExtension,
} from "@/lib/transactions";

// Your real EVE Frontier assembly mappings
const ASSEMBLIES = {
  CHARACTER_ID: "0x5362c8c1181a6d1e24cf0ae2dcc75fc61235ee87053d6a5fdf39a4983c5b1ca7",
  storageUnits: [
    {
      name: "SSU #1 (Mini Storage)",
      id: "0x6ec2c373149a906c1edb55842ab7b50f3521dea6a35d36474d7eefa53020af1d",
      ownerCapId: "0x438b493c1e2e27e491143dd9439f3bf72eb170b50031be3227e7024abac60791",
    },
    {
      name: "SSU #2 (Storage)",
      id: "0x0d98beb332114779cf8f61566c67aa6736911e2b786fdd82d9e28d16f23e0bc9",
      ownerCapId: "0xd7acd14c4b01f5ce39c354f5503c6302db6710090bd116449622fbd5a120c8fe",
    },
  ],
  gates: [
    {
      name: "Smart Gate (Heavy)",
      id: "0xddca10d9fa4358261b3b41ca634e1ea79cf08414a5f22293e13db0e7521cb0c4",
      ownerCapId: "0xb41e52635ada3604e72fd8a8dff35a2fe0bfcf34b33371c679611089bc1044d7",
    },
    {
      name: "Mini Gate",
      id: "0x5721cd58478525521eca980f861174d97a169c285cb23758306439afa93d82dc",
      ownerCapId: "0x71685d0971da10c662c65dcc5a4a831efb479563656abf6cd6ac163a5dff624c",
    },
  ],
};

export default function AuthorizePage() {
  const packageId = useNetworkVariable("fenPackageId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [status, setStatus] = useState<Record<string, string>>({});

  function authorize(type: "ssu" | "gate", index: number) {
    const assembly = type === "ssu" ? ASSEMBLIES.storageUnits[index] : ASSEMBLIES.gates[index];
    const key = `${type}-${index}`;
    setStatus((s) => ({ ...s, [key]: "signing..." }));

    const tx =
      type === "ssu"
        ? buildAuthorizeStorageUnitExtension({
            fenPackageId: packageId,
            characterId: ASSEMBLIES.CHARACTER_ID,
            storageUnitId: assembly.id,
            ownerCapId: assembly.ownerCapId,
          })
        : buildAuthorizeGateExtension({
            fenPackageId: packageId,
            characterId: ASSEMBLIES.CHARACTER_ID,
            gateId: assembly.id,
            ownerCapId: assembly.ownerCapId,
          });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          setStatus((s) => ({ ...s, [key]: `done! ${result.digest.slice(0, 12)}...` }));
        },
        onError: (error) => {
          setStatus((s) => ({ ...s, [key]: `error: ${error.message.slice(0, 60)}` }));
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-2">Authorize FEN Extension</h1>
      <p className="text-white/50 mb-8 text-sm">
        Each assembly must authorize FEN before swaps can execute. Click each button below.
        You must be connected with your EVE Frontier wallet.
      </p>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3 text-white/70">Storage Units (for swaps &amp; trades)</h2>
          <div className="space-y-3">
            {ASSEMBLIES.storageUnits.map((su, i) => (
              <div key={su.id} className="flex items-center gap-4 p-4 border border-white/10 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{su.name}</div>
                  <div className="text-xs text-white/30 font-mono">{su.id.slice(0, 20)}...</div>
                </div>
                <button
                  onClick={() => authorize("ssu", i)}
                  disabled={status[`ssu-${i}`]?.startsWith("signing")}
                  className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-white/90 disabled:opacity-50 text-sm"
                >
                  Authorize FEN
                </button>
                {status[`ssu-${i}`] && (
                  <span className={`text-xs ${status[`ssu-${i}`].startsWith("error") ? "text-red-400" : "text-green-400"}`}>
                    {status[`ssu-${i}`]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-white/70">Gates (for toll jumps)</h2>
          <div className="space-y-3">
            {ASSEMBLIES.gates.map((gate, i) => (
              <div key={gate.id} className="flex items-center gap-4 p-4 border border-white/10 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{gate.name}</div>
                  <div className="text-xs text-white/30 font-mono">{gate.id.slice(0, 20)}...</div>
                </div>
                <button
                  onClick={() => authorize("gate", i)}
                  disabled={status[`gate-${i}`]?.startsWith("signing")}
                  className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-white/90 disabled:opacity-50 text-sm"
                >
                  Authorize FEN
                </button>
                {status[`gate-${i}`] && (
                  <span className={`text-xs ${status[`gate-${i}`].startsWith("error") ? "text-red-400" : "text-green-400"}`}>
                    {status[`gate-${i}`]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 border border-white/10 rounded-lg bg-white/[0.02]">
        <p className="text-xs text-white/40">
          This page calls <code className="text-white/60">character::borrow_owner_cap</code> →{" "}
          <code className="text-white/60">storage_unit::authorize_extension&lt;FenAuth&gt;</code> →{" "}
          <code className="text-white/60">character::return_owner_cap</code> in a single PTB.
          After authorization, FEN can deposit/withdraw items from your assemblies for trading.
        </p>
      </div>
    </div>
  );
}
