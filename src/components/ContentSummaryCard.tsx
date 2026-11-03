/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ContentSummary } from '../types/extractor';
import { Sparkles, MessageSquare, Terminal, Key, Heading, CheckCircle } from 'lucide-react';

interface ContentSummaryCardProps {
  summary: ContentSummary;
}

export const ContentSummaryCard: React.FC<ContentSummaryCardProps> = ({ summary }) => {
  if (summary.turnCount === 0) return null;

  return (
    <section className="bg-[#090d16] border border-[#182338] rounded-2xl p-6 sm:p-8 mb-12 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#141e30]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Rule-Based Content Summary
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic algorithmic summary generated exclusively from extracted text without AI models or external APIs.
          </p>
        </div>

        <span className="text-[11px] font-mono text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2.5 py-1 rounded-md">
          Rule-Based Only
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-xs">
        {/* Card 1: Conversation Context */}
        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Conversation Scope</span>
            </div>
            <p className="text-slate-400">
              Total Turns:{' '}
              <span className="font-mono font-bold text-white tabular-nums">
                {summary.turnCount}
              </span>
            </p>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-1">
              Opening Inquiry (User Prompt):
            </span>
            <p className="text-slate-200 bg-[#070b14] p-3 rounded-lg border border-[#141e2e] leading-relaxed italic">
              "{summary.firstUserSnippet || 'No user prompt text found.'}"
            </p>
          </div>

          {summary.lastAssistantConclusion && (
            <div>
              <span className="text-slate-400 block font-semibold mb-1">
                Concluding Assistant Statement:
              </span>
              <p className="text-slate-200 bg-[#070b14] p-3 rounded-lg border border-[#141e2e] leading-relaxed">
                "{summary.lastAssistantConclusion}"
              </p>
            </div>
          )}
        </div>

        {/* Card 2: Technical & Semantic Entities */}
        <div className="bg-[#0d1320] border border-[#162133] rounded-xl p-4 space-y-4">
          {/* Top Frequent Keywords */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Top Frequent Keywords (Stopword Filtered)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summary.topKeywords.length > 0 ? (
                summary.topKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-[#070b14] border border-[#1b273b] px-2.5 py-1 rounded text-slate-200 font-mono text-[11px]"
                  >
                    <span>{kw.word}</span>
                    <span className="text-blue-400 text-[10px] tabular-nums font-semibold">
                      ({kw.count})
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-slate-500 font-mono">No dominant keywords found.</span>
              )}
            </div>
          </div>

          {/* Code Languages Detected */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Detected Code Languages</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summary.detectedLanguages.length > 0 ? (
                summary.detectedLanguages.map((lang, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-700/50 text-blue-300 font-mono text-[11px]"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 font-mono">No code blocks present.</span>
              )}
            </div>
          </div>

          {/* Headings Found */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
              <Heading className="w-3.5 h-3.5 text-blue-400" />
              <span>Extracted Topic Headings</span>
            </div>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              {summary.headingsFound.length > 0 ? (
                summary.headingsFound.map((h, i) => (
                  <li key={i} className="truncate">
                    {h}
                  </li>
                ))
              ) : (
                <li className="list-none text-slate-500 font-mono">No structured markdown headings.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
