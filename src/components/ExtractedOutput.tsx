/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChatMessage } from '../types/extractor';
import { User, Bot, Maximize2, Minimize2, MessageSquare } from 'lucide-react';

interface ExtractedOutputProps {
  messages: ChatMessage[];
}

export const ExtractedOutput: React.FC<ExtractedOutputProps> = ({ messages }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (messages.length === 0) return null;

  return (
    <div className="bg-[#0b101c] border border-[#1b2537] rounded-2xl overflow-hidden shadow-xl mb-8">
      {/* Header bar */}
      <div className="border-b border-[#1b2537] bg-[#0d1322] px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            Extracted Conversation Dialogue
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ({messages.length} turns)
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse View' : 'Expand View'}
          className="p-1.5 bg-[#141d2d] hover:bg-[#1a263b] border border-[#233149] text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Show All</span>
            </>
          )}
        </button>
      </div>

      {/* Message List */}
      <div
        className={`divide-y divide-[#162032] p-4 sm:p-6 space-y-6 overflow-y-auto ${
          isExpanded ? 'max-h-none' : 'max-h-[640px]'
        }`}
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'User';

          return (
            <article
              key={index}
              className={`rounded-xl p-5 border transition-all ${
                isUser ? 'bg-[#090f1b] border-[#182338]' : 'bg-[#0e1524] border-[#1d2a44]'
              }`}
            >
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
                    {msg.role}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  #{index + 1}
                </span>
              </div>

              <div className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                {renderFormattedContent(msg.text)}
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
