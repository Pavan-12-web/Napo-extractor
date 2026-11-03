/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IntegrityReport } from '../types/extractor';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Hash,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Columns,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface IntegritySummaryProps {
  integrity: IntegrityReport;
  onToggleSideBySide: () => void;
  showSideBySide: boolean;
}

export const IntegritySummary: React.FC<IntegritySummaryProps> = ({
  integrity,
  onToggleSideBySide,
  showSideBySide,
}) => {
  const [showHashes, setShowHashes] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);

  const isVerified = integrity.status === 'Verified';
  const isPartial = integrity.status === 'Partial';
  const isFailed = integrity.status === 'Failed';

  return (
    <section className="bg-[#090d16] border border-[#182338] rounded-2xl p-6 sm:p-8 mb-12 shadow-2xl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#141e30]">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isVerified
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isPartial
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isVerified ? (
                <ShieldCheck className="w-4 h-4" />
              ) : isPartial ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Extraction Integrity Summary
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mathematical & structural audit verifying clean extraction with zero metadata leakage.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border ${
              isVerified
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : isPartial
                ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                : 'bg-red-950/60 text-red-300 border-red-700/60'
            }`}
          >
            <span>Status: {integrity.status}</span>
          </div>

          <button
            onClick={onToggleSideBySide}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              showSideBySide
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-[#121a2a] text-slate-300 border-[#22314a] hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{showSideBySide ? 'Hide Split View' : 'Compare Source'}</span>
          </button>
        </div>
      </div>

      {/* Warning/Failure Explanation if not 100% verified */}
      {integrity.failureReasons.length > 0 && (
        <div className="my-6 p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200">
          <div className="font-bold flex items-center gap-1.5 mb-1.5 text-amber-300">
            <Info className="w-4 h-4" />
            <span>Integrity Caveats & Missing Elements:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            {integrity.failureReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid: Message & Text Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Total Messages</span>
          <span className="text-xl font-mono font-bold text-white tabular-nums">
            {integrity.totalMessages}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
            U: {integrity.userMessages} · A: {integrity.assistantMessages}
          </span>
        </div>

        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Characters</span>
          <span className="text-xl font-mono font-bold text-white tabular-nums">
            {integrity.characterCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
            sanitized count
          </span>
        </div>

        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Words</span>
          <span className="text-xl font-mono font-bold text-white tabular-nums">
            {integrity.wordCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
            prose tokens
          </span>
        </div>

        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Lines</span>
          <span className="text-xl font-mono font-bold text-white tabular-nums">
            {integrity.lineCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
            row breaks
          </span>
        </div>

        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Code Blocks</span>
          <span className="text-xl font-mono font-bold text-white tabular-nums">
            {integrity.codeBlocksCount}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
            fenced blocks
          </span>
        </div>

        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Tables & Lists</span>
          <span className="text-xl font-mono font-bold text-white tabular-nums">
            {integrity.tablesCount} / {integrity.listsCount}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
            tables / lists
          </span>
        </div>
      </div>

      {/* Dual Method Cross-Check Panel */}
      <div className="bg-[#0b101c] border border-[#182337] rounded-xl p-5 my-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Dual-Method Extraction Cross-Check
            </h4>
          </div>
          <span
            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
              integrity.dualCheck.isMatched
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
            }`}
          >
            {integrity.dualCheck.isMatched ? 'Aligned' : 'Discrepancy Detected'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#080c14] p-3 rounded-lg border border-[#141e2e]">
            <span className="text-slate-500 block text-[10px]">Method A (Primary AST/DOM):</span>
            <span className="text-white font-bold text-sm tabular-nums">
              {integrity.dualCheck.primaryMethodChars.toLocaleString()} chars
            </span>
          </div>

          <div className="bg-[#080c14] p-3 rounded-lg border border-[#141e2e]">
            <span className="text-slate-500 block text-[10px]">Method B (Independent Stream):</span>
            <span className="text-white font-bold text-sm tabular-nums">
              {integrity.dualCheck.secondaryMethodChars.toLocaleString()} chars
            </span>
          </div>

          <div className="bg-[#080c14] p-3 rounded-lg border border-[#141e2e]">
            <span className="text-slate-500 block text-[10px]">Difference Delta:</span>
            <span
              className={`font-bold text-sm tabular-nums ${
                integrity.dualCheck.difference === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {integrity.dualCheck.difference} chars
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2">{integrity.dualCheck.notes}</p>
      </div>

      {/* Truncation & Non-Text Element Check */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-6">
        <div className="bg-[#0b101c] border border-[#182337] rounded-xl p-4">
          <h5 className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Truncation & Pagination Checks</span>
          </h5>
          <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Truncation Detected:</span>
              <span className={integrity.truncationDetected ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {integrity.truncationDetected ? 'YES (Potential incomplete tail)' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Message Reached:</span>
              <span className={integrity.lastMessageReached ? 'text-emerald-400' : 'text-amber-400'}>
                {integrity.lastMessageReached ? 'Confirmed Reached' : 'Unconfirmed'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0b101c] border border-[#182337] rounded-xl p-4">
          <h5 className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Non-Text / Rich Media Flag</span>
          </h5>
          <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Images Excluded:</span>
              <span className="tabular-nums text-slate-200">
                {integrity.uncapturedElements.images}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Attachments Excluded:</span>
              <span className="tabular-nums text-slate-200">
                {integrity.uncapturedElements.attachments}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Interactive Canvases:</span>
              <span className="tabular-nums text-slate-200">
                {integrity.uncapturedElements.canvases}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Hashes Section */}
      <div className="border border-[#182337] rounded-xl bg-[#0b101c] overflow-hidden my-6">
        <button
          onClick={() => setShowHashes(!showHashes)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white bg-[#0e1422] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-blue-400" />
            <span>Cryptographic SHA-256 Hashes (Root & Per-Message)</span>
          </div>
          {showHashes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHashes && (
          <div className="p-4 space-y-4 text-xs font-mono border-t border-[#182337]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                Root SHA-256 (Full Transcript):
              </span>
              <div className="p-2.5 rounded bg-[#070a10] border border-[#141e2e] text-blue-400 break-all select-all">
                {integrity.rootSha256}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                Per-Message Hashes ({integrity.messageHashes.length} items):
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                {integrity.messageHashes.map((h, i) => (
                  <div
                    key={i}
                    className="p-1.5 rounded bg-[#070a10] border border-[#141e2e] text-slate-300 text-[11px] flex items-center justify-between"
                  >
                    <span className="text-slate-500 mr-2">#{i + 1}</span>
                    <span className="break-all select-all">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* First & Last 150 Characters Snippets */}
      <div className="border border-[#182337] rounded-xl bg-[#0b101c] overflow-hidden">
        <button
          onClick={() => setShowSnippets(!showSnippets)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white bg-[#0e1422] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Boundary Excerpt Verification (First & Last 150 Characters)</span>
          </div>
          {showSnippets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSnippets && (
          <div className="p-4 space-y-4 text-xs font-mono border-t border-[#182337]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#070a10] border border-[#141e2e] p-3 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                  First Message — First 150 Chars:
                </span>
                <p className="text-slate-300 text-[11px] whitespace-pre-wrap">
                  {integrity.firstMessageSnippet.start || '(empty)'}
                </p>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider mt-3 mb-1">
                  First Message — Last 150 Chars:
                </span>
                <p className="text-slate-300 text-[11px] whitespace-pre-wrap">
                  {integrity.firstMessageSnippet.end || '(empty)'}
                </p>
              </div>

              <div className="bg-[#070a10] border border-[#141e2e] p-3 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                  Last Message — First 150 Chars:
                </span>
                <p className="text-slate-300 text-[11px] whitespace-pre-wrap">
                  {integrity.lastMessageSnippet.start || '(empty)'}
                </p>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider mt-3 mb-1">
                  Last Message — Last 150 Chars:
                </span>
                <p className="text-slate-300 text-[11px] whitespace-pre-wrap">
                  {integrity.lastMessageSnippet.end || '(empty)'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
