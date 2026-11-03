/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PROVIDER_REGISTRY } from '../registry/providers';
import { Check, X, AlertTriangle, Layers, ShieldCheck } from 'lucide-react';

export const ProviderRegistryView: React.FC = () => {
  const providers = Object.values(PROVIDER_REGISTRY);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Provider Capability Registry
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Versioned capability specifications for supported AI conversation providers. Each provider adapter defines its own URL patterns, extraction strategies, and limitations independently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map(p => {
          const isHealthy = p.health === 'healthy';
          const isBlocked = p.health === 'blocked_for_direct_fetch';

          return (
            <div
              key={p.id}
              className="bg-[#0b101c] border border-[#1b2537] rounded-2xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#162133]">
                <div>
                  <h3 className="font-bold text-white text-base">{p.name}</h3>
                  <span className="text-[11px] font-mono text-slate-500">v{p.version}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
                    isHealthy
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : isBlocked
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {isHealthy ? 'Healthy' : 'Browser Session Required'}
                </span>
              </div>

              {/* Capability Matrix */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Direct Server Fetch:</span>
                  <span className={p.capabilities.directFetch ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                    {p.capabilities.directFetch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>{p.capabilities.directFetch ? 'Enabled' : 'Blocked / JS Required'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Structured Data Payload:</span>
                  <span className={p.capabilities.structuredData ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                    {p.capabilities.structuredData ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>{p.capabilities.structuredData ? 'Supported' : 'None'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Browser Extension Connector:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                </div>
              </div>

              {/* Supported Content Types */}
              <div className="pt-2 border-t border-[#141e2e]">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Supported Content:</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.supportedContentTypes.map(ct => (
                    <span key={ct} className="px-2 py-0.5 rounded bg-[#070b14] border border-[#182538] text-[10px] font-mono text-blue-300">
                      {ct}
                    </span>
                  ))}
                </div>
              </div>

              {/* Known Limitations */}
              <div className="pt-2 border-t border-[#141e2e] text-xs">
                <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Platform Limitations:</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
                  {p.knownLimitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
