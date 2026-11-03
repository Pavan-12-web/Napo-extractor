/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NormalizedConversation } from '../types/schema';
import { downloadConversation } from '../lib/exportLayer';
import {
  Download,
  Copy,
  Check,
  User,
  Bot,
  AlertTriangle,
  Code2,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NormalizedConversationViewProps {
  conversation: NormalizedConversation;
}

export const NormalizedConversationView: React.FC<NormalizedConversationViewProps> = ({
  conversation,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'md' | 'json' | 'txt' | 'html' | 'pdf'>('md');
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleCopy = () => {
    const text = conversation.messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadConversation(conversation, selectedFormat);
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-[#0b101c] border border-[#1b2537] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
              {conversation.platform}
            </span>
            <span className="text-xs font-mono text-slate-500">
              v{conversation.parserVersion}
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              {conversation.extractionStatus}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {conversation.title || 'Conversation Transcript'}
          </h2>
          <div className="text-xs text-slate-400 font-mono mt-1">
            <span>{conversation.messages.length} message turn(s)</span>
            {conversation.connectorUsed && (
              <>
                <span className="mx-2">·</span>
                <span>Connector: {conversation.connectorUsed}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/30 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Download .{selectedFormat}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2.5 bg-[#121a2a] hover:bg-[#182338] border border-[#23314a] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Format Selector */}
          <div className="flex items-center bg-[#070b14] border border-[#1b2537] rounded-xl p-1 text-xs">
            {(['md', 'json', 'txt', 'html', 'pdf'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-2.5 py-1 rounded font-mono uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
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
      </div>

      {/* Honest Platform Limitations Warnings */}
      {conversation.warnings.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 text-xs text-amber-200">
          <div className="font-bold flex items-center gap-1.5 mb-1.5 text-amber-300">
            <AlertTriangle className="w-4 h-4" />
            <span>Platform Limitations & Notes:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            {conversation.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Message List */}
      <div className="space-y-4">
        {conversation.messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <article
              key={msg.id || index}
              className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                isUser
                  ? 'bg-[#090f1b] border-[#182338]'
                  : 'bg-[#0d1424] border-[#1d2a44]'
              }`}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#141e30]">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      isUser
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {msg.author || (isUser ? 'User' : 'Assistant')}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  #{index + 1}
                </span>
              </div>

              {/* Message Content */}
              <div className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                {renderFormattedContent(msg.content)}
              </div>

              {/* Artifacts (Claude) */}
              {msg.artifacts && msg.artifacts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#182438] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span>Attached Artifact Source:</span>
                  </div>
                  {msg.artifacts.map((art, aIdx) => (
                    <div key={aIdx} className="bg-[#070b14] border border-[#1e2c45] rounded-xl overflow-hidden">
                      <div className="bg-[#0b101c] px-3.5 py-2 border-b border-[#1e2c45] flex items-center justify-between text-xs">
                        <span className="font-mono text-white font-semibold">{art.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{art.language || art.type}</span>
                      </div>
                      <pre className="p-3 text-xs font-mono text-slate-300 overflow-x-auto max-h-72">
                        <code>{art.content}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#182438] text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-1">Citations:</span>
                  <ul className="space-y-1">
                    {msg.citations.map((c, cIdx) => (
                      <li key={cIdx} className="flex items-center gap-1.5">
                        <span className="font-mono text-blue-400">[{c.number}]</span>
                        <span>{c.title}</span>
                        {c.url && (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-0.5 ml-1"
                          >
                            <span>view source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Raw Normalized Schema Inspection Drawer */}
      <div className="bg-[#0b101c] border border-[#1b2537] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white bg-[#0e1422] cursor-pointer"
        >
          <span>Normalized Schema JSON ({conversation.messages.length} messages)</span>
          {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRawJson && (
          <pre className="p-4 bg-[#070a10] border-t border-[#1b2537] text-xs font-mono text-blue-300 overflow-x-auto max-h-80 select-all">
            <code>{JSON.stringify(conversation, null, 2)}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

function renderFormattedContent(text: string): React.ReactNode {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    const lang = match[1] || 'code';
    const code = match[2];

    parts.push(
      <div
        key={`code-${match.index}`}
        className="my-4 rounded-lg overflow-hidden border border-[#1e2c45] bg-[#070b14]"
      >
        <div className="bg-[#0b101c] px-3 py-1.5 border-b border-[#1e2c45] text-[11px] font-mono text-blue-400 flex items-center justify-between">
          <span>{lang}</span>
          <span className="text-slate-500 text-[10px]">code block</span>
        </div>
        <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto leading-normal">
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts;
}
