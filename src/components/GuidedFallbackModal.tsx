/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Bookmark, FileText, ExternalLink, Check, Copy, AlertTriangle } from 'lucide-react';
import { getBookmarkletCode } from '../lib/bookmarklet';

interface GuidedFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'bot_blocked' | 'js_required' | 'private_or_deleted' | 'error' | string;
  targetUrl: string;
  onSwitchToPaste: () => void;
}

export const GuidedFallbackModal: React.FC<GuidedFallbackModalProps> = ({
  isOpen,
  onClose,
  reason,
  targetUrl,
  onSwitchToPaste,
}) => {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const bookmarkletCode = getBookmarkletCode();

  if (!isOpen) return null;

  const isCloudflare = reason === 'bot_blocked' || targetUrl.includes('chatgpt.com');
  const isGeminiJs = reason === 'js_required' || targetUrl.includes('gemini.google');

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101d] border border-[#1d293d] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
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
              {isCloudflare
                ? 'Automated Fetch Blocked by Bot Protection'
                : isGeminiJs
                ? 'Dynamic Browser Rendering Required'
                : 'Direct Server Fetch Unavailable'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Napo Extractor does not evade bot protection. Use Bookmarklet or Paste mode.
            </p>
          </div>
        </div>

        {/* Diagnostic explanation */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 text-xs text-slate-300 mb-6 space-y-2">
          <div className="font-semibold text-blue-300">Diagnostic Details:</div>
          <p>
            {isCloudflare
              ? 'ChatGPT public share endpoints (/s/cx_... or /share/...) require a verified browser session and reject automated server-side curl/Node.js requests with a Cloudflare bot challenge.'
              : isGeminiJs
              ? 'Gemini share pages return an empty application shell over HTTP; the conversation text is rendered client-side by browser JavaScript after page load.'
              : 'The target share page could not be accessed directly over HTTP.'}
          </p>
          <div className="text-slate-400 font-mono break-all text-[11px] bg-[#070b14] p-2 rounded border border-[#162235]">
            Target: {targetUrl || 'Public Share URL'}
          </div>
        </div>

        {/* Guided Resolution Options */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Your Preferred Extraction Path:
          </h4>

          {/* Option A: Bookmarklet (1-Click) */}
          <div className="bg-[#090f1b] border border-[#1a2538] hover:border-blue-500/50 rounded-xl p-4 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">
                    Path A: Run Bookmarklet (Recommended)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Runs directly inside the open share page tab in your browser, bypassing bot protection and JavaScript hurdles.
                </p>
              </div>
              <a
                href={bookmarkletCode}
                onClick={e => e.preventDefault()}
                title="Drag this button to your browser bookmarks bar"
                className="px-3 py-1.5 text-xs font-semibold text-blue-300 bg-blue-950/60 border border-blue-500/40 rounded-lg hover:bg-blue-900/60 transition-colors whitespace-nowrap cursor-grab active:cursor-grabbing"
              >
                Drag Bookmarklet
              </a>
            </div>

            <div className="mt-3 pt-3 border-t border-[#162235] flex items-center justify-between text-xs">
              <span className="text-slate-500">Or copy snippet directly:</span>
              <button
                onClick={handleCopyBookmarklet}
                className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-mono text-[11px] cursor-pointer"
              >
                {copiedBookmarklet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Bookmarklet JS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option B: Direct Paste Mode */}
          <div className="bg-[#090f1b] border border-[#1a2538] hover:border-blue-500/50 rounded-xl p-4 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">
                    Path B: Paste Page HTML or Text
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Save the page (Ctrl+S / Cmd+S) or select and copy conversation text, then paste here for deterministic extraction.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onSwitchToPaste();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Switch to Paste
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
