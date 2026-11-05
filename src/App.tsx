/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { NormalizedConversation } from './types/schema';
import { orchestrateParse } from './lib/parserOrchestrator';
import { detectProvider } from './registry/providers';
import { ExtensionBridge } from './lib/extensionBridge';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { NormalizedConversationView } from './components/NormalizedConversationView';
import { ExtensionGuide } from './components/ExtensionGuide';
import { ProviderRegistryView } from './components/ProviderRegistryView';
import { TestLab } from './components/TestLab';
import { StaticPages } from './components/StaticPages';
import { ClipboardAssistant } from './components/ClipboardAssistant';

import {
  ArrowRight,
  AlertCircle,
  Link as LinkIcon,
  FileText,
  X,
  Clipboard,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'test-lab' | 'extension' | 'platforms' | string>('home');
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assistantInfo, setAssistantInfo] = useState<{ url: string; provider: string } | null>(null);

  // Result state
  const [result, setResult] = useState<NormalizedConversation | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ExtensionBridge.init();

    const hash = window.location.hash.replace('#', '');
    if (hash === 'test-lab') {
      setCurrentView('test-lab');
    } else if (hash === 'extension' || hash === 'bookmarklet') {
      setCurrentView('extension');
    } else if (hash && hash !== 'home') {
      setCurrentView(hash);
    }
  }, []);

  const handleReset = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setResult(null);
    setAssistantInfo(null);
  };

  const handleExtractAnother = () => {
    setResult(null);
    setInput('');
    setErrorMessage(null);
    setStatusMessage(null);
    setAssistantInfo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Smart inspection of current input
  const trimmedInput = input.trim();
  const isUrl = /^https?:\/\/[^\s]+$/i.test(trimmedInput);
  const detectedProvider = isUrl ? detectProvider(trimmedInput) : null;

  /**
   * Unified Extraction Handler:
   * Handles URLs via backend proxy or text/HTML locally in browser
   */
  const handleExtract = async (overrideText?: string) => {
    const raw = (overrideText !== undefined ? overrideText : input).trim();
    if (!raw) return;

    handleReset();
    setIsProcessing(true);

    const isInputUrl = /^https?:\/\/[^\s]+$/i.test(raw);

    if (isInputUrl) {
      // URL Extraction via backend proxy
      const detected = detectProvider(raw);
      const providerName = detected ? detected.name : 'AI Platform';
      setStatusMessage(`Fetching conversation from ${providerName}...`);

      try {
        const response = await fetch('/api/fetch-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: raw }),
        });

        if (!response.ok) {
          const errorJson = await response.json().catch(() => null);
          setIsProcessing(false);
          setStatusMessage(null);
          if (response.status === 403 || errorJson?.status === 'bot_blocked') {
            setAssistantInfo({
              url: raw,
              provider: errorJson?.blockedPlatform || providerName,
            });
            return;
          }
          setErrorMessage(
            errorJson?.error ||
              `Could not connect to conversation link (Server status: ${response.status}). You can copy the conversation text and click "Paste from Clipboard" to extract it.`
          );
          return;
        }

        const data = await response.json();

        if (!data.success) {
          setIsProcessing(false);
          setStatusMessage(null);
          if (data.status === 'bot_blocked' || data.status === 'js_required') {
            setAssistantInfo({
              url: data.targetUrl || raw,
              provider: data.blockedPlatform || providerName,
            });
            return;
          }
          setErrorMessage(
            data.error ||
              'Could not fetch conversation directly from this link. You can copy the conversation text and click "Paste from Clipboard" to extract it.'
          );
          return;
        }

        // 1. Structured JSON (e.g. Gemini normalized conversation or Claude snapshot)
        if (data.jsonData) {
          if (data.jsonData.extractionStatus && Array.isArray(data.jsonData.messages) && data.jsonData.messages.length > 0) {
            setResult(data.jsonData);
            setIsProcessing(false);
            setStatusMessage(null);
            scrollToResult();
            return;
          }

          const parsed = orchestrateParse(JSON.stringify(data.jsonData), raw);
          setIsProcessing(false);
          setStatusMessage(null);
          if (parsed.success && parsed.conversation && parsed.conversation.messages.length > 0) {
            setResult(parsed.conversation);
            scrollToResult();
            return;
          }
        }

        // 2. HTML payload (ChatGPT React stream, meta data, DOM)
        if (data.html) {
          const parsed = orchestrateParse(data.html, raw);
          setIsProcessing(false);
          setStatusMessage(null);
          if (parsed.success && parsed.conversation && parsed.conversation.messages.length > 0) {
            setResult(parsed.conversation);
            scrollToResult();
            return;
          } else {
            // Empty SPA shell or client rendering blocked extraction; activate clipboard assistant
            setAssistantInfo({
              url: raw,
              provider: providerName,
            });
            return;
          }
        }
      } catch (err: unknown) {
        setIsProcessing(false);
        setStatusMessage(null);
        // On network error or timeout, provide immediate clipboard bypass
        setAssistantInfo({
          url: raw,
          provider: providerName,
        });
      }
    } else {
      // Local Text / Markdown / HTML paste extraction
      setStatusMessage('Extracting plain English dialogue...');
      setTimeout(() => {
        const parsed = orchestrateParse(raw, 'pasted-content');
        setIsProcessing(false);
        setStatusMessage(null);

        if (!parsed.success || !parsed.conversation) {
          setErrorMessage(parsed.errorMessage || 'Unable to parse conversation content.');
          return;
        }

        setResult(parsed.conversation);
        scrollToResult();
      }, 60);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setInput(text);
        handleExtract(text);
      } else {
        setErrorMessage('Clipboard is empty. Copy the conversation text and try again.');
      }
    } catch {
      setErrorMessage('Browser clipboard access blocked. Please press Ctrl+V / ⌘+V to paste into the box.');
    }
  };

  const scrollToResult = () => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Sample quick testers
  const loadSampleChatGpt = () => {
    const sampleUrl = 'https://chatgpt.com/share/6ae9a821-7990-83ee-b2ea-ee3a1d8d5540';
    setInput(sampleUrl);
    handleExtract(sampleUrl);
  };

  const loadSampleClaude = () => {
    const sampleUrl = 'https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874';
    setInput(sampleUrl);
    handleExtract(sampleUrl);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Minimal Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={view => {
          setCurrentView(view);
          window.location.hash = view === 'home' ? '' : view;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectInputMode={() => {
          setCurrentView('home');
        }}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {currentView === 'test-lab' ? (
          <TestLab
            onLoadIntoApp={(payload, conversation) => {
              setInput(payload);
              setResult(conversation);
              setCurrentView('home');
              scrollToResult();
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
            onSelectInputMode={() => setCurrentView('home')}
          />
        ) : (
          <div className="space-y-8">
            {/* Header: Quiet, human, clear purpose */}
            <div className="text-center max-w-xl mx-auto pt-2 pb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Extract Plain Text AI Conversations
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Paste any ChatGPT, Claude, Gemini, or Perplexity share link — or paste dialogue text directly. Get clean plain English text with zero metadata or HTML tags.
              </p>
            </div>

            {/* The Unified Smart Box */}
            <div className="bg-[#0b101d] border border-[#1a2538] rounded-2xl p-4 sm:p-6 shadow-xl transition-all focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/30">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={isUrl || !input ? 3 : 7}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || isUrl)) {
                      e.preventDefault();
                      handleExtract();
                    }
                  }}
                  placeholder="Paste a public AI chat link (e.g. https://chatgpt.com/share/...) or paste dialogue text..."
                  className="w-full bg-[#06080f] border border-[#162033] focus:border-blue-500 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 font-mono outline-none leading-relaxed resize-y transition-all"
                />

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  {!input && (
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-white bg-[#0e1422] hover:bg-[#162033] border border-[#1e2a40] transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Paste from clipboard"
                    >
                      <Clipboard className="w-3 h-3 text-blue-400" />
                      <span>Paste</span>
                    </button>
                  )}

                  {input && (
                    <button
                      type="button"
                      onClick={() => {
                        setInput('');
                        textareaRef.current?.focus();
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-white bg-[#0e1422] transition-colors cursor-pointer"
                      title="Clear input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom bar inside smart box */}
              <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Auto-Detection Indicator */}
                <div className="text-xs text-slate-400 flex items-center gap-2 min-h-[22px]">
                  {isUrl ? (
                    <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{detectedProvider ? detectedProvider.name : 'AI'} share link detected</span>
                    </span>
                  ) : trimmedInput.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pasted text ({trimmedInput.length.toLocaleString()} characters)</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 hidden sm:inline">
                      Tip: Press Enter to extract a link, or ⌘+Enter for pasted text
                    </span>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssistantInfo({
                          url: trimmedInput,
                          provider: detectedProvider ? detectedProvider.name : 'AI Platform',
                        });
                      }}
                      className="px-3 py-2 bg-[#101726] hover:bg-[#182338] border border-[#1e2c45] text-slate-300 hover:text-white font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      title="Open Clipboard Assistant workflow"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assisted Mode</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleExtract()}
                    disabled={isProcessing || !trimmedInput}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#131b2c] disabled:text-slate-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-blue-900/30 flex items-center gap-2"
                  >
                    <span>{isProcessing ? 'Extracting...' : 'Extract Conversation'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Quick Sample Links */}
              <div className="mt-4 pt-3.5 border-t border-[#141d2e] flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500">Try a sample:</span>
                <button
                  type="button"
                  onClick={loadSampleChatGpt}
                  className="text-slate-300 hover:text-blue-400 underline decoration-slate-600 underline-offset-2 transition-colors cursor-pointer"
                >
                  ChatGPT share link
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={loadSampleClaude}
                  className="text-slate-300 hover:text-blue-400 underline decoration-slate-600 underline-offset-2 transition-colors cursor-pointer"
                >
                  Claude snapshot link
                </button>
              </div>
            </div>

            {/* Clipboard Assistant for bypassing Cloudflare/Bot protection */}
            {assistantInfo && (
              <ClipboardAssistant
                targetUrl={assistantInfo.url}
                providerName={assistantInfo.provider}
                onExtractFromText={(text) => {
                  setAssistantInfo(null);
                  setInput(text);
                  handleExtract(text);
                }}
                onCancel={() => {
                  setAssistantInfo(null);
                }}
              />
            )}

            {/* Status Indicator */}
            {statusMessage && (
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-center gap-2.5 animate-fade-in">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Error Message with 1-click clipboard paste fallback */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-red-200">Unable to extract conversation</span>
                    <p className="mt-0.5 text-slate-300 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste from Clipboard & Extract</span>
                </button>
              </div>
            )}

            {/* Extracted Results: Pure Conversation & Direct Download */}
            {result && (
              <div ref={resultRef} className="pt-4 animate-fade-in">
                <NormalizedConversationView
                  conversation={result}
                  onReset={handleExtractAnother}
                />
              </div>
            )}
          </div>
        )}
      </main>

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
