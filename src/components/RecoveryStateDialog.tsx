/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, FileText, Bookmark, ExternalLink, AlertTriangle } from 'lucide-react';

interface RecoveryStateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaste: () => void;
  onSelectLocalExtractor: () => void;
  providerName?: string;
  targetUrl: string;
  technicalDetails?: string;
}

export const RecoveryStateDialog: React.FC<RecoveryStateDialogProps> = ({
  isOpen,
  onClose,
  onSelectPaste,
  onSelectLocalExtractor,
  providerName = 'This platform',
  targetUrl,
  technicalDetails,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101d] border border-[#1d293d] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              This platform blocks automatic URL extraction
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Open the conversation normally, then extract it locally or paste the conversation content.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 my-6">
          <button
            onClick={() => {
              onClose();
              onSelectPaste();
            }}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Paste conversation</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectLocalExtractor();
            }}
            className="w-full py-3 px-4 bg-[#121a2a] hover:bg-[#182338] border border-[#24334c] text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-blue-400" />
            <span>Use local extractor</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>

        {/* Optional Expandable Technical Diagnostic Details */}
        <div className="border-t border-[#162235] pt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center justify-between w-full cursor-pointer py-1"
          >
            <span>Technical diagnostic details</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 bg-[#070b14] rounded-lg border border-[#141e2e] text-[11px] font-mono text-slate-400 space-y-1">
              <div>Target URL: <span className="text-blue-400 break-all">{targetUrl}</span></div>
              <div>Provider: <span className="text-white">{providerName}</span></div>
              <div>Reason: Cloudflare challenge / Client SPA hydration requires browser session.</div>
              {technicalDetails && <div className="text-amber-400 mt-1">{technicalDetails}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
