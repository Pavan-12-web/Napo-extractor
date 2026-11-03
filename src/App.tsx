/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NormalizedConversation, ProviderId } from './types/schema';
import { orchestrateParse } from './lib/parserOrchestrator';
import { detectProvider } from './registry/providers';
import { ExtensionBridge } from './lib/extensionBridge';
import { generateContentSummary } from './lib/summary';
import { auditAndSanitizePrivacy } from './lib/privacyAudit';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { RecoveryStateDialog } from './components/RecoveryStateDialog';
import { ContentSummaryCard } from './components/ContentSummaryCard';
import { PrivacyVerificationBadge } from './components/PrivacyVerificationBadge';
import { NormalizedConversationView } from './components/NormalizedConversationView';
import { ExtensionGuide } from './components/ExtensionGuide';
import { ProviderRegistryView } from './components/ProviderRegistryView';
import { TestLab } from './components/TestLab';
import { StaticPages } from './components/StaticPages';

import {
  FileText,
  Bookmark,
  Link as LinkIcon,
  FlaskConical,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'test-lab' | 'extension' | 'platforms' | string>('home');
  const [inputMode, setInputMode] = useState<'paste' | 'link'>('paste');

  // Input states
  const [pasteInput, setPasteInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  // Status & Progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recovery dialog state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryTargetUrl, setRecoveryTargetUrl] = useState('');
  const [recoveryProviderName, setRecoveryProviderName] = useState('');

  // Result state
  const [result, setResult] = useState<NormalizedConversation | null>(null);

  useEffect(() => {
    ExtensionBridge.init();

    const hash = window.location.hash.replace('#', '');
    if (hash === 'test-lab') {
      setCurrentView('test-lab');
    } else if (hash === 'extension' || hash === 'bookmarklet') {
      setCurrentView('extension');
    } else if (hash === 'link') {
      setInputMode('link');
    } else if (hash && hash !== 'home') {
      setCurrentView(hash);
    }
  }, []);

  const handleReset = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setResult(null);
    setShowRecoveryDialog(false);
  };

  /**
   * Primary Mode: Local Client-Side Paste Extraction
   */
  const handleExtractFromPaste = (explicitText?: string) => {
    const rawContent = (explicitText !== undefined ? explicitText : pasteInput).trim();
    if (!rawContent) return;

    // Smart URL auto-detection: if the user pasted a single URL into the paste box,
    // automatically route to URL mode extraction
    if (/^https?:\/\/[^\s]+$/i.test(rawContent)) {
      setUrlInput(rawContent);
      setInputMode('link');
      handleExtractFromUrl(rawContent);
      return;
    }

    handleReset();
    setIsProcessing(true);
    setStatusMessage('Parsing conversation locally...');

    setTimeout(() => {
      const res = orchestrateParse(rawContent, 'pasted-content');
      setIsProcessing(false);
      setStatusMessage(null);

      if (!res.success || !res.conversation) {
        setErrorMessage(res.errorMessage || 'Unable to parse conversation content.');
        return;
      }

      setResult(res.conversation);
    }, 100);
  };

  /**
   * URL Mode: 5-Tier Connector Hierarchy
   */
  const handleExtractFromUrl = async (overrideUrl?: string) => {
    const trimmedUrl = (overrideUrl !== undefined ? overrideUrl : urlInput).trim();
    if (!trimmedUrl) return;

    handleReset();
    setIsProcessing(true);
    setStatusMessage('Detecting provider & connecting...');

    const detected = detectProvider(trimmedUrl);
    const providerName = detected ? detected.name : 'Unknown provider';

    try {
      // Connect to server proxy (Tier 1: Snapshot API, Tier 2: Public page fetch)
      const response = await fetch('/api/fetch-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        setIsProcessing(false);
        setStatusMessage(null);

        // If blocked by Cloudflare or requires browser JS hydration, immediately open Recovery Dialog
        if (data.status === 'bot_blocked' || data.status === 'js_required') {
          setRecoveryTargetUrl(trimmedUrl);
          setRecoveryProviderName(providerName);
          setShowRecoveryDialog(true);
          return;
        }

        setErrorMessage(data.error || 'Failed to retrieve public share page.');
        return;
      }

      // If server returned structured JSON (e.g. Claude chat snapshot)
      if (data.jsonData) {
        const parsed = orchestrateParse(JSON.stringify(data.jsonData), trimmedUrl);
        setIsProcessing(false);
        if (parsed.success && parsed.conversation) {
          setResult(parsed.conversation);
          return;
        }
      }

      // If server returned raw HTML
      if (data.html) {
        const parsed = orchestrateParse(data.html, trimmedUrl);
        setIsProcessing(false);
        if (parsed.success && parsed.conversation) {
          setResult(parsed.conversation);
          return;
        } else {
          if (parsed.isEmptyShell) {
            setRecoveryTargetUrl(trimmedUrl);
            setRecoveryProviderName(providerName);
            setShowRecoveryDialog(true);
            return;
          }
          setErrorMessage(parsed.errorMessage || 'No conversation content found in retrieved page.');
        }
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setErrorMessage(`Network request failed: ${msg}`);
    }
  };


  // Compute privacy audit and summary for current result
  const summary = result ? generateContentSummary(result.messages.map(m => ({ role: m.role === 'user' ? 'User' : 'Assistant', text: m.content }))) : null;
  const privacy = result ? auditAndSanitizePrivacy(result.messages.map(m => ({ role: m.role === 'user' ? 'User' : 'Assistant', text: m.content })), result.rawSourceSnippet || '') : null;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Contract */}
      <Navbar
        currentView={currentView}
        onNavigate={view => {
          setCurrentView(view);
          window.location.hash = view === 'home' ? '' : view;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectInputMode={mode => {
          if (mode === 'extension') {
            setCurrentView('extension');
          } else {
            setInputMode(mode);
            setCurrentView('home');
          }
        }}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {currentView === 'test-lab' ? (
          <TestLab
            onLoadIntoApp={(payload, conversation) => {
              setPasteInput(payload);
              setResult(conversation);
              setCurrentView('home');
              setInputMode('paste');
            }}
          />
        ) : currentView === 'extension' ? (
          <ExtensionGuide />
        ) : currentView === 'platforms' ? (
          <ProviderRegistryView />
        ) : currentView !== 'home' ? (
          <StaticPages
            view={currentView}
            onNavigateHome={() => setCurrentView('home')}
            onSelectInputMode={mode => {
              setInputMode(mode === 'link' ? 'link' : 'paste');
              setCurrentView('home');
            }}
          />
        ) : (
          <div>
            {/* Hero / Header Section */}
            <div className="text-center max-w-2xl mx-auto mb-8 pt-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Lossless AI Conversation{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                  Extraction & Export
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                Parse and normalize conversations locally across ChatGPT, Claude, Gemini, Grok, Meta AI, and Perplexity with zero bot evasion and strict privacy guarantees.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex p-1 bg-[#0d1320] border border-[#1b273d] rounded-xl text-xs font-medium">
                <button
                  onClick={() => {
                    setInputMode('paste');
                    handleReset();
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                    inputMode === 'paste'
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Primary: Paste Conversation</span>
                </button>

                <button
                  onClick={() => {
                    setInputMode('link');
                    handleReset();
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                    inputMode === 'link'
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>URL Mode (Public Endpoints)</span>
                </button>
              </div>
            </div>

            {/* Input Canvas */}
            <div className="bg-[#0b101c] border border-[#1b263b] rounded-2xl p-6 sm:p-8 mb-8 shadow-2xl relative">
              {/* PRIMARY MODE: PASTE CONVERSATION */}
              {inputMode === 'paste' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">Paste Conversation Content</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Accepts rendered conversation text, Markdown, saved HTML (Ctrl+S), or Claude snapshot JSON. Parsed 100% locally.
                      </p>
                    </div>

                    <button
                      onClick={() => setCurrentView('test-lab')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Acceptance Test Lab (16 Fixtures) &rarr;</span>
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={pasteInput}
                    onChange={e => setPasteInput(e.target.value)}
                    placeholder="Paste rendered text, Markdown, HTML, or Claude snapshot JSON here..."
                    className="w-full bg-[#070b14] border border-[#1f2d45] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-4 text-xs text-white placeholder-slate-500 font-mono outline-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                      Local in-browser parsing · Zero server transmission
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      {pasteInput && (
                        <button
                          onClick={() => setPasteInput('')}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => handleExtractFromPaste()}
                        disabled={isProcessing || !pasteInput.trim()}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a2538] disabled:text-slate-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-blue-900/30 flex items-center gap-2"
                      >
                        <span>{isProcessing ? 'Parsing...' : 'Extract & Normalize'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* URL MODE */}
              {inputMode === 'link' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">Public Share URL Extraction</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Attempts public structured retrieval or direct page fetch. If the provider blocks direct fetching, the recovery dialog guides you to local extraction.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://claude.ai/share/... or https://chatgpt.com/s/cx_..."
                      className="flex-1 bg-[#070b14] border border-[#1f2d45] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono outline-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleExtractFromUrl();
                      }}
                    />

                    <button
                      onClick={() => handleExtractFromUrl()}
                      disabled={isProcessing || !urlInput.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a2538] disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span>{isProcessing ? 'Connecting...' : 'Extract URL'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>Verified Test Link:</span>
                    <button
                      onClick={() => setUrlInput('https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874')}
                      className="text-blue-400 hover:underline"
                    >
                      Claude (767b0a62-...)
                    </button>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {statusMessage && (
                <div className="mt-4 p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 font-mono flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-xs text-red-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-red-200">Notice:</span>
                    <p className="mt-0.5 text-slate-300 leading-relaxed font-mono">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RESULTS VIEW */}
            {result && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. Rule-Based Content Summary */}
                {summary && <ContentSummaryCard summary={summary} />}

                {/* 2. Privacy Verification Badge: What It Does Not Contain */}
                {privacy && (
                  <PrivacyVerificationBadge
                    checks={privacy.checks}
                    allPassed={privacy.allPassed}
                  />
                )}

                {/* 3. Normalized Conversation Output & One-Click Download */}
                <NormalizedConversationView conversation={result} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Recovery State Dialog */}
      <RecoveryStateDialog
        isOpen={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
        onSelectPaste={() => {
          setInputMode('paste');
        }}
        onSelectLocalExtractor={() => {
          setCurrentView('extension');
        }}
        providerName={recoveryProviderName}
        targetUrl={recoveryTargetUrl}
      />

      {/* Footer */}
      <Footer
        onNavigate={view => {
          if (view === 'bookmarklet' || view === 'extension') {
            setCurrentView('extension');
          } else {
            setCurrentView(view);
          }
          window.location.hash = view === 'home' ? '' : view;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
