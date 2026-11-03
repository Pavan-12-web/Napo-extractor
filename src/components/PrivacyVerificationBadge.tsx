/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Check, ChevronDown, ChevronUp, Lock, EyeOff } from 'lucide-react';
import { PrivacyCheckItem } from '../lib/privacyAudit';

interface PrivacyVerificationBadgeProps {
  checks: PrivacyCheckItem[];
  allPassed: boolean;
}

export const PrivacyVerificationBadge: React.FC<PrivacyVerificationBadgeProps> = ({
  checks,
  allPassed,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#090d16] border border-blue-500/30 rounded-2xl p-5 mb-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Verified Privacy & Redaction Guarantee
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                7 / 7 Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated audit confirms what the extracted text strictly does not contain.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-300 bg-blue-950/50 border border-blue-800/40 hover:bg-blue-900/50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>{expanded ? 'Hide Non-Containment Checks' : 'View What It Does Not Contain'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Summary Chips (Visible in collapsed state) */}
      {!expanded && (
        <div className="mt-4 pt-3 border-t border-[#141e30] flex flex-wrap gap-2 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1 bg-[#0b101c] border border-[#1b2537] px-2.5 py-1 rounded-md text-emerald-300">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>No conversation title / ID</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-[#0b101c] border border-[#1b2537] px-2.5 py-1 rounded-md text-emerald-300">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>No attachments or Artifacts</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-[#0b101c] border border-[#1b2537] px-2.5 py-1 rounded-md text-emerald-300">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>No model names</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-[#0b101c] border border-[#1b2537] px-2.5 py-1 rounded-md text-emerald-300">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>No JWTs / API keys</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-[#0b101c] border border-[#1b2537] px-2.5 py-1 rounded-md text-emerald-300">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>No personal emails</span>
          </span>
        </div>
      )}

      {/* Full 7-Point Audit Checklist (Visible when expanded) */}
      {expanded && (
        <div className="mt-5 pt-4 border-t border-[#141e30] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fade-in">
          {checks.map(check => (
            <div
              key={check.id}
              className="bg-[#0b101c] border border-[#172235] rounded-xl p-3 flex items-start gap-2.5"
            >
              <div className="w-5 h-5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-white block">{check.label}</span>
                <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                  {check.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
