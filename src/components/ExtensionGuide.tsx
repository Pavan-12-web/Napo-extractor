/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bookmark, Download, Copy, Check, ShieldCheck, ExternalLink, Chrome, FileCode } from 'lucide-react';
import { getBookmarkletCode } from '../lib/bookmarklet';

export const ExtensionGuide: React.FC = () => {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const bookmarkletCode = getBookmarkletCode();

  const manifestJson = `{
  "manifest_version": 3,
  "name": "Napo Extractor — Companion Extension",
  "version": "1.0.0",
  "permissions": ["activeTab", "scripting", "tabs"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://grok.com/*",
    "https://meta.ai/*",
    "https://www.perplexity.ai/*"
  ]
}`;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Local Page Extractor
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Local extraction from the page you opened in your browser. This tool reads the rendered DOM using your authorized browser profile without transmitting cookies, authorization headers, or private session tokens.
        </p>
      </div>

      {/* Option 1: Zero-Install Bookmarklet */}
      <div className="bg-[#0b101c] border border-blue-500/40 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Method A: Drag-and-Drop Bookmarklet (Zero-Install)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Works instantly on any desktop browser without developer mode.
            </p>
          </div>
        </div>

        <div className="bg-[#070b14] border border-[#162235] rounded-xl p-5 text-center my-4">
          <span className="text-xs text-slate-400 block mb-3 font-semibold uppercase tracking-wider">
            Drag This Button to Your Bookmarks Bar:
          </span>
          <a
            href={bookmarkletCode}
            onClick={e => e.preventDefault()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 cursor-grab active:cursor-grabbing transition-transform active:scale-95"
          >
            <Bookmark className="w-4 h-4" />
            <span>Napo Extractor</span>
          </a>
          <p className="text-[11px] text-slate-500 mt-3">
            Press Ctrl+Shift+B (or Cmd+Shift+B on macOS) to show your browser bookmarks bar.
          </p>
        </div>

        <div className="text-xs text-slate-300 space-y-1.5 mt-4">
          <span className="font-semibold text-white block">Execution Flow:</span>
          <p>1. Open the conversation in your browser normally.</p>
          <p>2. Click <strong>Napo Extractor</strong> in your bookmarks bar.</p>
          <p>3. The dialogue is extracted locally from the rendered DOM and copied to your clipboard.</p>
          <p>4. Open Napo Extractor and paste to review and export.</p>
        </div>
      </div>

      {/* Option 2: Manifest V3 Extension */}
      <div className="bg-[#0b101c] border border-[#1b2537] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Chrome className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Method B: Manifest V3 Companion Extension
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automates background tab opening and direct bridge communication.
            </p>
          </div>
        </div>

        <div className="bg-[#070b14] border border-[#162235] rounded-xl p-4 my-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300">manifest.json</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(manifestJson);
                setCopiedManifest(true);
                setTimeout(() => setCopiedManifest(false), 2000);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 cursor-pointer"
            >
              {copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedManifest ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-2 bg-[#05070e] rounded">
            <code>{manifestJson}</code>
          </pre>
        </div>

        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs text-blue-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            <strong>Privacy Guarantee:</strong> The companion extension runs strictly within your local browser profile. It never sends authentication cookies, session credentials, or raw page HTML to our server.
          </p>
        </div>
      </div>
    </div>
  );
};
