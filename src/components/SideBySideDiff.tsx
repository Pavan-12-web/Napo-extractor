/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Columns, Copy, Check, Eye } from 'lucide-react';

interface SideBySideDiffProps {
  sourceText: string;
  cleanText: string;
}

export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({ sourceText, cleanText }) => {
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedClean, setCopiedClean] = useState(false);

  const sourceLines = sourceText.split(/\r?\n/).length;
  const cleanLines = cleanText.split(/\r?\n/).length;

  const handleCopySource = () => {
    navigator.clipboard.writeText(sourceText);
    setCopiedSource(true);
    setTimeout(() => setCopiedSource(false), 2000);
  };

  const handleCopyClean = () => {
    navigator.clipboard.writeText(cleanText);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  return (
    <div className="bg-[#090d16] border border-[#182338] rounded-2xl p-6 sm:p-8 mb-12 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#141e30] mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Side-by-Side Verification (Source vs Extracted)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare raw unparsed source payload directly against the clean sanitized conversation.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          <span>Source: {sourceText.length.toLocaleString()} chars</span>
          <span className="mx-2">·</span>
          <span>Extracted: {cleanText.length.toLocaleString()} chars</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Source Input */}
        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl overflow-hidden flex flex-col">
          <div className="bg-[#0e1422] px-4 py-3 border-b border-[#1b2537] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Raw Source Input</span>
              <span className="text-[11px] font-mono text-slate-500">
                ({sourceLines} lines · {sourceText.length.toLocaleString()} chars)
              </span>
            </div>
            <button
              onClick={handleCopySource}
              className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px] cursor-pointer"
            >
              {copiedSource ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed select-all whitespace-pre-wrap">
            <code>{sourceText || '(No source input available)'}</code>
          </pre>
        </div>

        {/* Right Column: Clean Extracted Text */}
        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl overflow-hidden flex flex-col">
          <div className="bg-[#0e1422] px-4 py-3 border-b border-[#1b2537] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-300">Sanitized Output</span>
              <span className="text-[11px] font-mono text-slate-500">
                ({cleanLines} lines · {cleanText.length.toLocaleString()} chars)
              </span>
            </div>
            <button
              onClick={handleCopyClean}
              className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px] cursor-pointer"
            >
              {copiedClean ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed select-all whitespace-pre-wrap">
            <code>{cleanText || '(No extracted text)'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
