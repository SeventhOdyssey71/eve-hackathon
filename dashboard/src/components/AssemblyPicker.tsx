"use client";

import { useState } from "react";
import type { OwnedAssembly } from "@/hooks/use-owned-assemblies";
import { ChevronDown } from "lucide-react";

interface AssemblyPickerProps {
  label: string;
  assemblies: OwnedAssembly[];
  isLoading: boolean;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  type: "gate" | "storage_unit";
}

export function AssemblyPicker({
  label,
  assemblies,
  isLoading,
  value,
  onChange,
  placeholder = "0x...",
  type,
}: AssemblyPickerProps) {
  const [mode, setMode] = useState<"select" | "manual">(assemblies.length > 0 ? "select" : "manual");

  const selected = assemblies.find((a) => a.id === value);
  const typeLabel = type === "gate" ? "Gate" : "SSU";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label mb-0">{label}</label>
        <button
          type="button"
          onClick={() => setMode(mode === "select" ? "manual" : "select")}
          className="text-[10px] text-eve-orange hover:text-eve-orange-light transition-colors"
        >
          {mode === "select" ? "Enter ID manually" : `Pick from wallet`}
        </button>
      </div>

      {mode === "select" && assemblies.length > 0 ? (
        <div className="relative">
          <select
            className="input-field text-[13px] appearance-none pr-8"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select a {typeLabel}...</option>
            {assemblies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.id.slice(0, 10)}...{a.id.slice(-4)})
                {a.isOnline ? " [online]" : " [offline]"}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-eve-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      ) : mode === "select" && assemblies.length === 0 ? (
        <div>
          <div className="text-xs text-eve-muted py-2 px-3 bg-eve-elevated rounded-lg mb-2">
            {isLoading
              ? `Scanning wallet for ${typeLabel} objects...`
              : `No ${typeLabel} objects found in wallet.`}
          </div>
          <input
            type="text"
            placeholder={placeholder}
            className="input-field font-mono text-xs"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          className="input-field font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {value && selected && (
        <div className="text-[10px] text-eve-text-dim mt-1">
          {selected.name} -- {selected.isOnline ? "Online" : "Offline"}
        </div>
      )}
    </div>
  );
}
