/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation, NormalizedMessage } from '../types/schema';
import { downloadFile } from './export';

/**
 * Lossless JSON Export: Returns the exact complete normalized schema.
 */
export function exportAsLosslessJson(conv: NormalizedConversation): string {
  return JSON.stringify(conv, null, 2);
}

/**
 * Lossless Markdown Export: Preserves titles, code blocks, tables, citations, and artifacts.
 */
export function exportAsMarkdown(conv: NormalizedConversation): string {
  const parts: string[] = [];

  parts.push(`# ${conv.title || 'Conversation Transcript'}\n`);

  if (conv.warnings.length > 0) {
    parts.push(`> [!NOTE]\n> ${conv.warnings.join('\n> ')}\n`);
  }

  conv.messages.forEach(msg => {
    const roleHeading = msg.role === 'user' ? '## User' : '## Assistant';
    parts.push(`${roleHeading}\n\n${msg.content}`);

    // If artifacts exist, append clean source code blocks
    if (msg.artifacts && msg.artifacts.length > 0) {
      msg.artifacts.forEach(art => {
        parts.push(`\n### Artifact: ${art.title} (${art.language || art.type})\n\`\`\`${art.language || 'text'}\n${art.content}\n\`\`\``);
      });
    }

    // If citations exist
    if (msg.citations && msg.citations.length > 0) {
      parts.push('\n**Citations:**');
      msg.citations.forEach(c => {
        parts.push(`- [${c.number}] ${c.title || 'Source'}${c.url ? `: ${c.url}` : ''}`);
      });
    }

    parts.push('\n---\n');
  });

  return parts.join('\n');
}

/**
 * Formats Plain Text (.txt)
 */
export function exportAsPlainText(conv: NormalizedConversation): string {
  return conv.messages
    .map(m => `${m.role.toUpperCase()}:\n${m.content}`)
    .join('\n\n========================================\n\n');
}

/**
 * Self-contained HTML Export with Unicode, RTL, and print styling
 */
export function exportAsHtml(conv: NormalizedConversation): string {
  const messageCards = conv.messages
    .map(m => {
      const isUser = m.role === 'user';
      return `<article class="msg ${isUser ? 'user' : 'assistant'}">
        <header class="role">${isUser ? 'USER' : 'ASSISTANT'}</header>
        <div class="content">${escapeHtml(m.content).replace(/\n/g, '<br/>')}</div>
      </article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(conv.title || 'Conversation Transcript')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif; line-height: 1.6; max-width: 840px; margin: 40px auto; padding: 0 20px; color: #111827; background: #ffffff; }
    .msg { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .msg.user { background: #f9fafb; border-color: #d1d5db; }
    .msg.assistant { background: #ffffff; border-color: #9ca3af; }
    .role { font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em; color: #4b5563; margin-bottom: 8px; }
    .content { white-space: pre-wrap; font-size: 0.95rem; }
    @media print { body { max-width: 100%; margin: 0; } .msg { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(conv.title || 'Conversation Transcript')}</h1>
  ${messageCards}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function downloadConversation(conv: NormalizedConversation, format: 'md' | 'json' | 'txt' | 'html' | 'pdf') {
  const slug = (conv.title || 'conversation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  switch (format) {
    case 'json':
      downloadFile(exportAsLosslessJson(conv), `${slug}.json`, 'application/json;charset=utf-8');
      break;
    case 'md':
      downloadFile(exportAsMarkdown(conv), `${slug}.md`, 'text/markdown;charset=utf-8');
      break;
    case 'txt':
      downloadFile(exportAsPlainText(conv), `${slug}.txt`, 'text/plain;charset=utf-8');
      break;
    case 'html':
      downloadFile(exportAsHtml(conv), `${slug}.html`, 'text/html;charset=utf-8');
      break;
    case 'pdf': {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(exportAsHtml(conv));
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        window.print();
      }
      break;
    }
  }
}
