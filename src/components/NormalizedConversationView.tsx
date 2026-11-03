/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NormalizedConversation } from '../types/schema';
import { downloadConversation, exportAsMarkdown } from '../lib/exportLayer';
import { Download, Copy, Check, User, Bot, FileText } from 'lucide-react';

interface NormalizedConversationViewProps {
  conversation: NormalizedConversation;
}

export const NormalizedConversationView: React.FC<NormalizedConversationViewProps> = ({
  conversation,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const plainText = exportAsMarkdown(conversation);
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Download & Copy Plain English Text */}
      <div className="bg-[#0b101c] border border-blue-500/40 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Extracted Plain English Conversation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {conversation.messages.length} message turn(s) extracted · Zero metadata or tracking tags
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Action: Download .md */}
          <button
            onClick={() => downloadConversation(conversation, 'md')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download Plain Text (.md)</span>
          </button>

          {/* Secondary Action: Download .txt */}
          <button
            onClick={() => downloadConversation(conversation, 'txt')}
            className="px-3.5 py-2.5 bg-[#121a2a] hover:bg-[#182338] border border-[#23314a] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.txt</span>
          </button>

          {/* Copy Plain Text */}
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 bg-[#121a2a] hover:bg-[#182338] border border-[#23314a] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copy Plain Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clean Plain English Messages */}
      <div className="space-y-4">
        {conversation.messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <article
              key={msg.id || index}
              className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                isUser ? 'bg-[#090f1b] border-[#182338]' : 'bg-[#0d1424] border-[#1d2a44]'
              }`}
            >
              {/* Clean Speaker Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#141e30]">
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
                    {isUser ? 'User' : 'Assistant'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  #{index + 1}
                </span>
              </div>

              {/* Pure Plain English Message Text */}
              <div className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                {renderFormattedContent(msg.content)}
              </div>
            </article>
          );
        })}
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
          <span className="text-slate-500 text-[10px]">code</span>
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
