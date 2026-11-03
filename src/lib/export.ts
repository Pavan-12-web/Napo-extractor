/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, ExportFormat } from '../types/extractor';

/**
 * Formats messages into clean Plain Text (.txt)
 */
export function formatAsTxt(messages: ChatMessage[]): string {
  return messages
    .map(msg => `${msg.role}:\n${msg.text}`)
    .join('\n\n----------------------------------------\n\n');
}

/**
 * Formats messages into clean Markdown (.md)
 */
export function formatAsMarkdown(messages: ChatMessage[]): string {
  return messages
    .map(msg => `## ${msg.role}\n\n${msg.text}`)
    .join('\n\n---\n\n');
}

/**
 * Formats messages into clean JSON (.json)
 * STRICT: Only speaker role and text, numbered by order. No timestamps, model names, or IDs.
 */
export function formatAsJson(messages: ChatMessage[]): string {
  const cleanList = messages.map((msg, index) => ({
    order: index + 1,
    role: msg.role,
    text: msg.text,
  }));
  return JSON.stringify(cleanList, null, 2);
}

/**
 * Formats messages into clean HTML (.html)
 * STRICT: No tracking scripts, no meta headers, no metadata.
 */
export function formatAsHtml(messages: ChatMessage[]): string {
  const bodyItems = messages
    .map((msg, idx) => {
      const roleClass = msg.role.toLowerCase();
      // Basic HTML escaping for safe representation
      const safeText = msg.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `  <article class="message ${roleClass}">
    <header class="speaker-role">#${idx + 1} ${msg.role}</header>
    <div class="message-content">${safeText.replace(/\n/g, '<br/>')}</div>
  </article>`;
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Clean Conversation Transcript</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111827; }
    .message { margin-bottom: 2rem; padding: 1.25rem; border-radius: 8px; border: 1px solid #e5e7eb; }
    .message.user { background: #f9fafb; border-color: #e5e7eb; }
    .message.assistant { background: #ffffff; border-color: #d1d5db; }
    .speaker-role { font-weight: 700; margin-bottom: 0.75rem; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; color: #374151; }
    .message-content { white-space: pre-wrap; font-size: 0.95rem; }
    @media print { body { max-width: 100%; margin: 0; } .message { border: 1px solid #ccc; page-break-inside: avoid; } }
  </style>
</head>
<body>
${bodyItems}
</body>
</html>`;
}

/**
 * Triggers the clean browser print dialog for high-resolution PDF export.
 */
export function triggerPrintPdf(messages: ChatMessage[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const htmlContent = formatAsHtml(messages);
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

/**
 * Helper to download formatted content as a file with proper mime type.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportConversation(messages: ChatMessage[], format: ExportFormat): void {
  switch (format) {
    case 'txt':
      downloadFile(formatAsTxt(messages), 'conversation.txt', 'text/plain;charset=utf-8');
      break;
    case 'md':
      downloadFile(formatAsMarkdown(messages), 'conversation.md', 'text/markdown;charset=utf-8');
      break;
    case 'json':
      downloadFile(formatAsJson(messages), 'conversation.json', 'application/json;charset=utf-8');
      break;
    case 'html':
      downloadFile(formatAsHtml(messages), 'conversation.html', 'text/html;charset=utf-8');
      break;
    case 'pdf':
      triggerPrintPdf(messages);
      break;
  }
}
