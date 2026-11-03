/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Bookmark,
  Layers,
  ArrowRight,
  ExternalLink,
  Lock,
  Copy,
  Check,
  Code2,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getBookmarkletCode } from '../lib/bookmarklet';

interface StaticPagesProps {
  view: string;
  onNavigateHome: () => void;
  onSelectInputMode: (mode: 'link' | 'bookmarklet' | 'paste') => void;
}

export const StaticPages: React.FC<StaticPagesProps> = ({
  view,
  onNavigateHome,
  onSelectInputMode,
}) => {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const bookmarkletCode = getBookmarkletCode();

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  if (view === 'platforms') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Supported AI Platforms
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Napo Extractor uses modular adapters behind a common interface. ChatGPT and Gemini are fully active now; Claude, Grok, Meta AI, and Perplexity are ready stubs awaiting verified sample links.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ChatGPT */}
          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">ChatGPT</h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded">
                Active Adapter
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Extracts messages from public share links, Next.js JSON state, or saved HTML.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-[#070b14] p-3 rounded border border-[#152033] space-y-1">
              <div>Patterns supported:</div>
              <div className="text-blue-400">chatgpt.com/share/...</div>
              <div className="text-blue-400">chatgpt.com/s/cx_...</div>
            </div>
          </div>

          {/* Gemini */}
          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">Google Gemini</h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded">
                Active Adapter
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Accepts short and expanded share links, stripping Google chrome and extracting conversation turns.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-[#070b14] p-3 rounded border border-[#152033] space-y-1">
              <div>Patterns supported:</div>
              <div className="text-blue-400">share.gemini.google/[id]</div>
              <div className="text-blue-400">gemini.google.com/share/[id]</div>
            </div>
          </div>

          {/* Claude Stub */}
          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5 opacity-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">Claude</h3>
              <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                Awaiting sample link
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Placeholder adapter configured. Ready to bind selectors once sample link is verified.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-[#070b14] p-3 rounded border border-[#152033]">
              Sample Link Pending · Paste mode fallback available
            </div>
          </div>

          {/* Grok Stub */}
          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5 opacity-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">Grok (xAI)</h3>
              <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                Awaiting sample link
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Placeholder adapter configured. No selectors guessed until sample link provided.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-[#070b14] p-3 rounded border border-[#152033]">
              Sample Link Pending · Paste mode fallback available
            </div>
          </div>

          {/* Meta AI Stub */}
          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5 opacity-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">Meta AI</h3>
              <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                Awaiting sample link
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Placeholder adapter configured. Ready for sample link testing.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-[#070b14] p-3 rounded border border-[#152033]">
              Sample Link Pending · Paste mode fallback available
            </div>
          </div>

          {/* Perplexity Stub */}
          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5 opacity-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">Perplexity</h3>
              <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                Awaiting sample link
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Placeholder adapter configured. Awaiting sample link for selector inspection.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-[#070b14] p-3 rounded border border-[#152033]">
              Sample Link Pending · Paste mode fallback available
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'how-it-works') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          How It Works
        </h1>
        <p className="text-sm text-slate-400 mb-10 leading-relaxed">
          Napo Extractor provides a clean, stateless three-step pipeline designed to extract visible conversation text without metadata leaks or data retention.
        </p>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold font-mono shrink-0">
              01
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Provide Link, HTML, or Bookmarklet Payload
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose Link Mode for public URLs, Bookmarklet Mode to extract directly from your open browser tab, or Paste Mode to paste saved HTML or dialogue.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold font-mono shrink-0">
              02
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Sanitization & Dual-Method Verification
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platform-specific adapters strip interface chrome (copy buttons, share banners, thought indicators). Simultaneously, an independent secondary stream parser computes character counts to cross-verify that nothing visible was lost.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold font-mono shrink-0">
              03
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Pristine Export & Cryptographic Hashes
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Export clean text as TXT, Markdown, JSON (only role and text), clean HTML, or print-ready PDF. Review the Extraction Integrity Summary and rule-based content summary below.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#182338]">
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Try Extractor Now &rarr;
          </button>
        </div>
      </div>
    );
  }

  if (view === 'bookmarklet') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Browser Bookmarklet
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The Napo Bookmarklet runs directly on the active share tab in your browser. Because it runs locally inside your authenticated browser session, it effortlessly bypasses Cloudflare bot protection and dynamic JavaScript rendering hurdles.
        </p>

        {/* Drag target box */}
        <div className="bg-[#0b101c] border border-blue-500/40 rounded-2xl p-6 text-center mb-8">
          <span className="text-xs text-slate-400 block mb-3 font-semibold uppercase tracking-wider">
            Drag This Button to Your Bookmarks Bar:
          </span>
          <a
            href={bookmarkletCode}
            onClick={e => e.preventDefault()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/40 cursor-grab active:cursor-grabbing transition-transform active:scale-95"
          >
            <Bookmark className="w-4 h-4" />
            <span>Napo Extractor</span>
          </a>
          <p className="text-xs text-slate-500 mt-3">
            (Press Ctrl+Shift+B or Cmd+Shift+B if your bookmarks bar is hidden)
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          <h3 className="font-bold text-white text-base">How to Use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
            <li>Open any public AI chat share link (ChatGPT, Gemini, etc.) in your browser.</li>
            <li>Click the <strong>Napo Extractor</strong> bookmarklet in your bookmarks bar.</li>
            <li>The script instantly extracts the conversation turns directly from the live DOM and copies them to your clipboard.</li>
            <li>Return to Napo Extractor and open Paste Mode to inspect the full transcript and integrity audit.</li>
          </ol>
        </div>

        {/* Copy snippet option */}
        <div className="bg-[#090e18] border border-[#162133] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Or Copy Raw Javascript URL:</span>
            <button
              onClick={handleCopyBookmarklet}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedBookmarklet ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Javascript Code</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-[#050810] p-2.5 rounded font-mono text-[11px] text-slate-400 break-all max-h-24 overflow-y-auto select-all">
            {bookmarkletCode}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'features') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Features & Integrity Guarantees
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Built for personal use, privacy, and rigorous verification.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Zero Metadata Leakage</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Never outputs model identifiers, token counts, timestamps, conversation IDs, user account avatars, or hidden system prompts. Strictly output visible dialogue.
            </p>
          </div>

          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Dual-Method Cross-Validation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every extraction runs two independent parsing algorithms. Character and message counts are compared in real time to alert you to any dropped letters or formatting discrepancies.
            </p>
          </div>

          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Cryptographic SHA-256 Hashes</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generates a deterministic SHA-256 root hash for the whole conversation and separate hashes for each message turn, enabling tamper-evident verification.
            </p>
          </div>

          <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">100% Stateless & Private</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No database, no user accounts, no analytics tracking, no server logs. Your conversation data lives only in browser memory and disappears on refresh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'comparison') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Comparison: Napo vs Alternatives
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Why an integrity-verified, zero-metadata extractor beats manual copying or heavy browser extensions.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-[#1b2537] bg-[#0b101c] rounded-xl">
            <thead>
              <tr className="border-b border-[#1b2537] bg-[#0e1422] text-slate-300 font-semibold">
                <th className="p-3">Feature</th>
                <th className="p-3 text-blue-400">Napo Extractor</th>
                <th className="p-3 text-slate-400">Manual Copy-Paste</th>
                <th className="p-3 text-slate-400">Browser Extensions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162133] text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-white">Metadata Stripping</td>
                <td className="p-3 text-emerald-400">Strict (100% clean)</td>
                <td className="p-3 text-red-400">Manual editing required</td>
                <td className="p-3 text-amber-400">Varies / Often includes chrome</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Integrity Cross-Check</td>
                <td className="p-3 text-emerald-400">Dual-method + SHA-256</td>
                <td className="p-3 text-red-400">None (silent drops)</td>
                <td className="p-3 text-red-400">None</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Data Privacy</td>
                <td className="p-3 text-emerald-400">Stateless, zero storage</td>
                <td className="p-3 text-emerald-400">Local</td>
                <td className="p-3 text-amber-400">Requires broad permissions</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Export Formats</td>
                <td className="p-3 text-emerald-400">TXT, MD, JSON, HTML, PDF</td>
                <td className="p-3 text-slate-400">Raw clipboard only</td>
                <td className="p-3 text-slate-400">Typically 1 format</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Bot/JS Fallback</td>
                <td className="p-3 text-emerald-400">Bookmarklet & Paste bridge</td>
                <td className="p-3 text-slate-400">Manual</td>
                <td className="p-3 text-red-400">Breaks on page changes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (view === 'use-cases') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Personal Use Cases
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          How power users leverage Napo Extractor for research, coding, and personal knowledge management.
        </p>

        <div className="space-y-6 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <h3 className="font-bold text-white text-sm mb-1">Obsidian & Markdown Binders</h3>
            <p className="leading-relaxed">
              Export clean Markdown directly into your knowledge vault. Code fences, lists, and tables stay properly formatted without messy web styling or unnecessary timestamps.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <h3 className="font-bold text-white text-sm mb-1">Notion Document Archiving</h3>
            <p className="leading-relaxed">
              Use either clean Markdown or structured HTML to paste seamlessly into Notion pages. No unwanted UI buttons, avatars, or "Thought for 12 seconds" artifacts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <h3 className="font-bold text-white text-sm mb-1">Codebase & Technical Notes</h3>
            <p className="leading-relaxed">
              Archive technical troubleshooting sessions into your git repositories or project documentation. The integrity report confirms that no code lines were truncated.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'faq') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Answers to common questions about Napo Extractor's architecture and operation.
        </p>

        <div className="space-y-6 text-xs">
          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <h3 className="font-bold text-white text-sm mb-1">
              Why did my ChatGPT share link fail automated fetching?
            </h3>
            <p className="text-slate-300 leading-relaxed">
              ChatGPT public share endpoints (/s/cx_... and /share/...) are protected by Cloudflare bot management. Cloudflare blocks automated server-side requests (such as curl or Node.js fetch). When this occurs, Napo Extractor alerts you plainly and recommends running the Bookmarklet directly in your open browser tab or using Paste mode.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <h3 className="font-bold text-white text-sm mb-1">
              Why does Gemini require JavaScript or the Bookmarklet?
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Google Gemini share links return an empty HTML application shell. The conversation text is rendered dynamically in the browser via JavaScript. The Bookmarklet or Paste mode reads the rendered DOM directly.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <h3 className="font-bold text-white text-sm mb-1">
              Does Napo Extractor use AI to extract or summarize?
            </h3>
            <p className="text-slate-300 leading-relaxed">
              No. Napo Extractor uses 100% deterministic, rule-based parsers and standard lexical tokenizers. There are no AI models, LLM API calls, or machine learning inferences.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <h3 className="font-bold text-white text-sm mb-1">
              Is my conversation data stored anywhere?
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Never. Napo Extractor has no database, no session persistence, no logs, and no analytics. Everything is processed statelessly in transient memory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'chatgpt-to-markdown') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          ChatGPT to Markdown Guide
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          How to convert ChatGPT shared conversations into clean Markdown (.md) files.
        </p>

        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-6 text-xs text-slate-300 space-y-4">
          <p>
            ChatGPT shares often embed code snippets, tables, and lists. Napo Extractor formats each message cleanly:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>User prompts become <code className="text-blue-400">## User</code></li>
            <li>Assistant replies become <code className="text-blue-400">## Assistant</code></li>
            <li>Code blocks maintain exact language specifiers (e.g., <code className="text-blue-400">```typescript</code>)</li>
            <li>Tables, blockquotes, and lists are converted to standard GitHub Flavored Markdown.</li>
          </ul>
          <div className="pt-4">
            <button
              onClick={() => {
                onNavigateHome();
                onSelectInputMode('link');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Start Converting
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'notion-export') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Notion Export Workflow
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          The cleanest method to archive AI chat dialogues into your Notion workspace.
        </p>

        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-6 text-xs text-slate-300 space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>Extract your share link or paste your conversation in Napo Extractor.</li>
            <li>Select <strong>Markdown</strong> or <strong>HTML</strong> as your export format.</li>
            <li>Click <strong>Copy</strong> to copy the sanitized text to your clipboard.</li>
            <li>In Notion, open a new page and press <kbd className="bg-[#141e30] px-1.5 py-0.5 rounded text-white font-mono">Cmd+V</kbd> or <kbd className="bg-[#141e30] px-1.5 py-0.5 rounded text-white font-mono">Ctrl+V</kbd>.</li>
            <li>Notion automatically parses headers, code fences, and quotes into native blocks!</li>
          </ol>
        </div>
      </div>
    );
  }

  if (view === 'changelog') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Changelog
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Release history and improvements for Napo Extractor.
        </p>

        <div className="space-y-6 text-xs">
          <div className="p-4 rounded-xl bg-[#0b101c] border border-[#1b2537]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Version 1.0.0</span>
              <span className="text-slate-500 font-mono">Current Release</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Full ChatGPT adapter supporting /share/... and /s/cx_... patterns.</li>
              <li>Full Gemini adapter supporting share.gemini.google and gemini.google.com/share/.</li>
              <li>Pluggable adapter architecture with stubs for Claude, Grok, Meta AI, and Perplexity.</li>
              <li>Three input modes: Link mode, Bookmarklet mode, Paste mode.</li>
              <li>Dual-method integrity cross-check and SHA-256 cryptographic hashes.</li>
              <li>Side-by-side collapsible split view (Source vs Extracted).</li>
              <li>Rule-based content summary (zero AI models or external APIs).</li>
              <li>Five export formats: TXT, Markdown, JSON, HTML, PDF.</li>
              <li>Strict zero-metadata enforcement.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'about') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          About Napo Extractor
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Personal-use web utility for clean, verifiable AI chat extraction.
        </p>

        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-6 text-xs text-slate-300 space-y-4">
          <p>
            Napo Extractor was designed from scratch as an original, private utility for knowledge workers who need to turn public AI share links into pure, readable text for notes, documentation, and archival.
          </p>
          <p>
            Unlike typical browser extensions or scraping scripts, Napo Extractor emphasizes mathematical integrity verification: every character is counted, cross-checked using a secondary parsing method, and verified with cryptographic SHA-256 hashes.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'privacy') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Napo Extractor is engineered from the ground up to be strictly stateless and private.
        </p>

        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-6 text-xs text-slate-300 space-y-4 leading-relaxed">
          <h3 className="font-bold text-white text-sm">1. No Data Retention</h3>
          <p>
            We operate zero databases, zero cloud storage buckets, and zero persistent log stores. Extracted conversations are parsed in transient memory and immediately returned to your browser.
          </p>

          <h3 className="font-bold text-white text-sm">2. No Tracking or Cookies</h3>
          <p>
            We do not use advertising trackers, analytics scripts, fingerprinting, or session cookies.
          </p>

          <h3 className="font-bold text-white text-sm">3. No Credentials or Private Data</h3>
          <p>
            Napo Extractor only operates on public share links. It never asks for, accepts, or transmits user account credentials or authorization tokens.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'terms') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Terms of Service & Trademarks
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Legal terms and non-affiliation disclaimer.
        </p>

        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-6 text-xs text-slate-300 space-y-4 leading-relaxed">
          <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg text-blue-200">
            <strong>Trademark Notice:</strong> ChatGPT is a trademark of OpenAI. Gemini is a trademark of Google LLC. Claude is a trademark of Anthropic PBC. Grok is a trademark of xAI. Meta AI is a trademark of Meta Platforms, Inc. Perplexity is a trademark of Perplexity AI, Inc. Napo Extractor is an independent project and is not affiliated with, endorsed by, or sponsored by any of these companies.
          </div>
          <p>
            Napo Extractor is provided on an "as is" and "as available" basis for personal, non-commercial use. Users are responsible for ensuring that public share links they extract comply with the applicable terms of the source platforms.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'contact') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Contact & Feedback
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Have a sample link for Claude, Grok, Meta AI, or Perplexity?
        </p>

        <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl p-6 text-xs text-slate-300 space-y-4">
          <p>
            Because Napo Extractor avoids guessing selectors, new platform adapters are built strictly upon verified public sample links.
          </p>
          <p>
            If you have a verified public share link or sample HTML for Claude, Grok, Meta AI, or Perplexity, you can paste the HTML directly into Paste Mode to test extraction immediately.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                onNavigateHome();
                onSelectInputMode('paste');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Open Paste Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
