/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChatMessage, ExportFormat } from '../types/extractor';
import { exportConversation, formatAsTxt } from '../lib/export';
import { Download, Copy, Check, FileDown, Sparkles } from 'lucide-react';

interface DownloadActionBarProps {
  messages: ChatMessage[];
}

export const DownloadActionBar: React.FC<DownloadActionBarProps> = ({ messages }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    exportConversation(messages, selectedFormat);
  };

  const handleCopy = () => {
    const text = formatAsTxt(messages);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLabels: Record<ExportFormat, string> = {
    md: 'Markdown (.md)',
    txt: 'Plain Text (.txt)',
    json: 'Clean JSON (.json)',
    html: 'Clean HTML (.html)',
    pdf: 'Print PDF (.pdf)',
  };

  return (
    <div className="bg-[#0b101c] border border-blue-500/40 rounded-2xl p-4 sm:p-5 mb-8 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Left side: Prominent Primary Download Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleDownload}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Download Extracted Data (.{selectedFormat})</span>
        </button>

        <button
          onClick={handleCopy}
          className="px-4 py-3.5 bg-[#121a2a] hover:bg-[#182338] border border-[#23314a] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-400">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Copy Full Text</span>
            </>
          )}
        </button>
      </div>

      {/* Right side: Format Selector Pills */}
      <div className="flex items-center gap-2 bg-[#070b14] border border-[#1b2537] rounded-xl p-1.5 self-center md:self-auto overflow-x-auto max-w-full">
        <span className="text-[11px] font-mono text-slate-500 px-2 shrink-0">Format:</span>
        {(['md', 'txt', 'json', 'html', 'pdf'] as ExportFormat[]).map(fmt => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
              selectedFormat === fmt
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>
    </div>
  );
};
