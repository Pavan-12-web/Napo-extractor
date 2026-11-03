/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation } from '../types/schema';
import { downloadFile } from './export';

/**
 * Clean Markdown Export: Contains ONLY the plain English conversation context with clean speaker labels.
 * Zero metadata, zero titles, zero warnings, zero IDs, zero timestamps.
 */
export function exportAsMarkdown(conv: NormalizedConversation): string {
  return conv.messages
    .map(msg => {
      const speakerLabel = msg.role === 'user' ? 'User:' : 'Assistant:';
      return `${speakerLabel}\n${msg.content.trim()}`;
    })
    .join('\n\n');
}

/**
 * Plain Text Export: Contains ONLY the plain English conversation context with clean speaker labels.
 */
export function exportAsPlainText(conv: NormalizedConversation): string {
  return conv.messages
    .map(msg => {
      const speakerLabel = msg.role === 'user' ? 'User:' : 'Assistant:';
      return `${speakerLabel}\n${msg.content.trim()}`;
    })
    .join('\n\n');
}

/**
 * Plain HTML Export: Contains strictly the plain English dialogue turns.
 */
export function exportAsHtml(conv: NormalizedConversation): string {
  const messageCards = conv.messages
    .map(m => {
      const speaker = m.role === 'user' ? 'User' : 'Assistant';
      const roleClass = m.role === 'user' ? 'user' : 'assistant';
      return `<article class="msg ${roleClass}">
        <header class="role">${speaker}:</header>
        <div class="content">${escapeHtml(m.content).replace(/\n/g, '<br/>')}</div>
      </article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Conversation Transcript</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111827; background: #ffffff; }
    .msg { border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
    .msg.user { background: #f9fafb; border-color: #d1d5db; }
    .msg.assistant { background: #ffffff; border-color: #9ca3af; }
    .role { font-weight: 700; font-size: 0.9rem; color: #374151; margin-bottom: 8px; }
    .content { white-space: pre-wrap; font-size: 0.95rem; }
    @media print { body { max-width: 100%; margin: 0; } .msg { page-break-inside: avoid; } }
  </style>
</head>
<body>
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

export function downloadConversation(
  conv: NormalizedConversation,
  format: 'md' | 'txt' | 'html' | 'pdf' = 'md'
) {
  const filename = 'conversation';

  switch (format) {
    case 'md':
      downloadFile(exportAsMarkdown(conv), `${filename}.md`, 'text/markdown;charset=utf-8');
      break;
    case 'txt':
      downloadFile(exportAsPlainText(conv), `${filename}.txt`, 'text/plain;charset=utf-8');
      break;
    case 'html':
      downloadFile(exportAsHtml(conv), `${filename}.html`, 'text/html;charset=utf-8');
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
