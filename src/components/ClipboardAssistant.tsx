/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ExternalLink, Clipboard, Sparkles, ArrowRight, ShieldAlert, Check } from 'lucide-react';

interface ClipboardAssistantProps {
  targetUrl: string;
  providerName: string;
  onExtractFromText: (text: string) => void;
  onCancel: () => void;
}

export function ClipboardAssistant({
  targetUrl,
  providerName,
  onExtractFromText,
  onCancel,
}: ClipboardAssistantProps) {
  const [autoDetecting, setAutoDetecting] = useState(true);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  // Auto-detect when user switches back to this tab
  useEffect(() => {
    let active = true;

    const handleWindowFocus = async () => {
      if (!active || !autoDetecting) return;

      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && text.trim().length > 30 && text.trim() !== targetUrl) {
            setCopiedStatus(true);
            setTimeout(() => {
              if (active) onExtractFromText(text);
            }, 400);
          }
        }
      } catch {
        // Clipboard read permission might require explicit user click
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      active = false;
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [autoDetecting, targetUrl, onExtractFromText]);

  const handleManualPaste = async () => {
    setReadError(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          onExtractFromText(text);
          return;
        }
      }
      setReadError('Clipboard is currently empty. Please copy the conversation text from the open tab first.');
    } catch {
      setReadError('Please press Ctrl+V (or Cmd+V) directly into the text box below.');
    }
  };

  return (
    <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0 mt-0.5">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Cloudflare Anti-Bot Block Detected on {providerName}
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
              Assisted Mode
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            {providerName}&apos;s anti-bot system blocked cloud datacenter requests. You can bypass this instantly using our automatic clipboard assistant:
          </p>
        </div>
      </div>

      {/* 2-Step Workflow Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Step 1 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                1
              </span>
              Open & Copy
            </div>
            <p className="text-sm text-slate-300">
              Open the conversation link in your browser, press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-white">Ctrl+A</kbd> then <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-white">Ctrl+C</kbd> to copy the dialogue.
            </p>
          </div>

          <div className="mt-4">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
            >
              <span>Open Link in New Tab</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                2
              </span>
              Switch Back & Paste
            </div>
            <p className="text-sm text-slate-300">
              Switch back to this window (auto-detected), or click below to extract the clean transcript immediately.
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={handleManualPaste}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
            >
              {copiedStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Extracting Copied Dialogue...</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  <span>Paste from Clipboard & Extract</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {readError && (
        <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900/50 rounded-lg p-3 mb-4">
          {readError}
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Auto-detection listening when you switch back to this tab</span>
        </div>

        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors underline"
        >
          Cancel and return to input
        </button>
      </div>
    </div>
  );
}
