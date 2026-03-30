"use client";

import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { useNetworkVariable } from "@/lib/sui-config";
import { useCharacter } from "@/hooks/use-character";
import {
  buildAuthorizeStorageUnitExtension,
  buildAuthorizeGateExtension,
} from "@/lib/transactions";
import { Shield, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { abbreviateAddress, explorerUrl } from "@/lib/utils";
import { SkeletonTable } from "@/components/ui/Skeleton";

interface DiscoveredAssembly {
  id: string;
  ownerCapId: string;
  type: "gate" | "storage_unit";
  label: string;
}

const WORLD_PKG = "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75";

export default function AuthorizePage() {
  const packageId = useNetworkVariable("fenPackageId");
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { characterId, isLoading: charLoading } = useCharacter();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [assemblies, setAssemblies] = useState<DiscoveredAssembly[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [status, setStatus] = useState<Record<string, string>>({});

  // Discover OwnerCaps owned by the character
  useEffect(() => {
    if (!characterId || !client) return;

    let cancelled = false;
    setDiscovering(true);

    async function discover() {
      const found: DiscoveredAssembly[] = [];

      try {
        // Query objects owned by the character address
        const result = await client.getOwnedObjects({
          owner: characterId!,
          options: { showType: true, showContent: true },
          limit: 50,
        });

        for (const obj of result.data) {
          if (!obj.data?.type || !obj.data?.content) continue;
          const t = obj.data.type;
          const fields = "fields" in obj.data.content ? (obj.data.content.fields as Record<string, unknown>) : null;
          if (!fields) continue;

          const authId = fields.authorized_object_id as string;
          if (!authId) continue;

          if (t.includes("OwnerCap") && t.includes("gate::Gate")) {
            found.push({
              id: authId,
              ownerCapId: obj.data.objectId,
              type: "gate",
              label: `Gate ${abbreviateAddress(authId)}`,
            });
          } else if (t.includes("OwnerCap") && t.includes("storage_unit::StorageUnit")) {
            found.push({
              id: authId,
              ownerCapId: obj.data.objectId,
              type: "storage_unit",
              label: `SSU ${abbreviateAddress(authId)}`,
            });
          }
        }
      } catch {
        // Discovery failed silently
      }

      if (!cancelled) {
        setAssemblies(found);
        setDiscovering(false);
      }
    }

    discover();
    return () => { cancelled = true; };
  }, [characterId, client]);

  function authorize(assembly: DiscoveredAssembly) {
    if (!characterId) return;
    const key = assembly.id;
    setStatus((s) => ({ ...s, [key]: "signing..." }));

    const tx =
      assembly.type === "storage_unit"
        ? buildAuthorizeStorageUnitExtension({
            fenPackageId: packageId,
            characterId,
            storageUnitId: assembly.id,
            ownerCapId: assembly.ownerCapId,
          })
        : buildAuthorizeGateExtension({
            fenPackageId: packageId,
            characterId,
            gateId: assembly.id,
            ownerCapId: assembly.ownerCapId,
          });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          setStatus((s) => ({ ...s, [key]: `success:${result.digest.slice(0, 12)}...` }));
        },
        onError: (error) => {
          const msg = error.message || "Failed";
          // Already authorized
          if (msg.includes("already") || msg.includes("swap_or_fill")) {
            setStatus((s) => ({ ...s, [key]: "already_authorized" }));
          } else {
            setStatus((s) => ({ ...s, [key]: `error:${msg.slice(0, 50)}` }));
          }
        },
      }
    );
  }

  function authorizeAll() {
    for (const a of assemblies) {
      authorize(a);
    }
  }

  const gates = assemblies.filter((a) => a.type === "gate");
  const ssus = assemblies.filter((a) => a.type === "storage_unit");

  return (
    <div className="space-y-6 max-w-[1440px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Extension Setup</h1>
          <p className="text-sm text-eve-text-dim mt-1">
            Authorize FEN on your assemblies to enable trading and gate jumps
          </p>
        </div>
        {assemblies.length > 0 && (
          <button onClick={authorizeAll} className="btn-primary text-sm">
            Authorize All
          </button>
        )}
      </div>

      {/* Connection status */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Connection Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${account ? "bg-eve-green" : "bg-eve-muted"}`} />
            <div>
              <div className="text-xs text-eve-muted">Wallet</div>
              <div className="text-sm font-medium">
                {account ? abbreviateAddress(account.address) : "Not connected"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${characterId ? "bg-eve-green" : charLoading ? "bg-eve-yellow animate-pulse" : "bg-eve-muted"}`} />
            <div>
              <div className="text-xs text-eve-muted">Character</div>
              <div className="text-sm font-medium">
                {charLoading ? "Discovering..." : characterId ? abbreviateAddress(characterId) : "Not found"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${assemblies.length > 0 ? "bg-eve-green" : discovering ? "bg-eve-yellow animate-pulse" : "bg-eve-muted"}`} />
            <div>
              <div className="text-xs text-eve-muted">Assemblies</div>
              <div className="text-sm font-medium">
                {discovering ? "Scanning..." : `${gates.length} gates, ${ssus.length} SSUs`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No wallet */}
      {!account && (
        <div className="card p-12 text-center">
          <Shield className="w-10 h-10 text-eve-muted mx-auto mb-3" />
          <p className="text-eve-text-dim">Connect your EVE Frontier wallet to discover your assemblies</p>
        </div>
      )}

      {/* No character */}
      {account && !charLoading && !characterId && (
        <div className="card p-12 text-center">
          <AlertCircle className="w-10 h-10 text-eve-yellow mx-auto mb-3" />
          <p className="text-eve-text font-medium mb-1">No EVE Frontier Character Found</p>
          <p className="text-sm text-eve-text-dim max-w-md mx-auto">
            This wallet doesn&apos;t have an EVE Frontier PlayerProfile. Connect with the wallet you use in the EVE Frontier game.
          </p>
        </div>
      )}

      {/* Loading */}
      {(charLoading || discovering) && <SkeletonTable rows={4} />}

      {/* Assembly list */}
      {!discovering && assemblies.length > 0 && (
        <>
          {/* Storage Units */}
          {ssus.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-eve-text-dim mb-3 uppercase tracking-wider">
                Storage Units ({ssus.length})
              </h2>
              <div className="space-y-3">
                {ssus.map((su) => (
                  <AssemblyRow key={su.id} assembly={su} status={status[su.id]} onAuthorize={() => authorize(su)} />
                ))}
              </div>
            </div>
          )}

          {/* Gates */}
          {gates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-eve-text-dim mb-3 uppercase tracking-wider">
                Gates ({gates.length})
              </h2>
              <div className="space-y-3">
                {gates.map((g) => (
                  <AssemblyRow key={g.id} assembly={g} status={status[g.id]} onAuthorize={() => authorize(g)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* No assemblies found */}
      {!discovering && characterId && assemblies.length === 0 && (
        <div className="card p-12 text-center">
          <Shield className="w-10 h-10 text-eve-muted mx-auto mb-3" />
          <p className="text-eve-text font-medium mb-1">No Assemblies Found</p>
          <p className="text-sm text-eve-text-dim max-w-md mx-auto">
            Your character doesn&apos;t own any gates or storage units. Deploy assemblies in EVE Frontier first.
          </p>
        </div>
      )}

      {/* Explainer */}
      <div className="card p-5 bg-white/[0.01]">
        <h3 className="text-xs font-semibold text-eve-muted uppercase tracking-wider mb-2">How it works</h3>
        <p className="text-xs text-eve-text-dim leading-relaxed">
          Each EVE Frontier assembly (gate or storage unit) must authorize FEN&apos;s extension before
          trading can occur. This is a one-time setup per assembly. The transaction borrows your
          OwnerCap from your Character, calls <code className="text-eve-text bg-white/[0.04] px-1 rounded">authorize_extension&lt;FenAuth&gt;</code>,
          then returns the cap — all in a single atomic transaction.
        </p>
      </div>
    </div>
  );
}

function AssemblyRow({
  assembly,
  status,
  onAuthorize,
}: {
  assembly: DiscoveredAssembly;
  status?: string;
  onAuthorize: () => void;
}) {
  const isSuccess = status?.startsWith("success:") || status === "already_authorized";
  const isError = status?.startsWith("error:");
  const isSigning = status === "signing...";

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        assembly.type === "gate" ? "bg-eve-orange/10" : "bg-eve-blue/10"
      }`}>
        <Shield className={`w-5 h-5 ${assembly.type === "gate" ? "text-eve-orange" : "text-eve-blue"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{assembly.label}</div>
        <div className="flex items-center gap-2 text-[11px] text-eve-muted mt-0.5">
          <span className="font-mono">{assembly.id.slice(0, 20)}...</span>
          <a
            href={explorerUrl("object", assembly.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-eve-orange hover:underline"
          >
            Explorer
          </a>
        </div>
      </div>

      {isSuccess ? (
        <div className="flex items-center gap-1.5 text-eve-green text-xs font-medium">
          <CheckCircle className="w-4 h-4" />
          {status === "already_authorized" ? "Already authorized" : "Authorized"}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-400 max-w-[200px] truncate">{status?.slice(6)}</span>
          <button onClick={onAuthorize} className="btn-ghost text-xs px-3 py-1.5">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      ) : (
        <button
          onClick={onAuthorize}
          disabled={isSigning}
          className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
        >
          {isSigning ? (
            <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Signing...</span>
          ) : (
            "Authorize FEN"
          )}
        </button>
      )}
    </div>
  );
}
