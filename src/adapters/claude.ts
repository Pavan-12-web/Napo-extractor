/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage } from '../types/extractor';
import { sanitizeCleanText } from './htmlUtils';
import { ParseResult, PlatformAdapter } from './types';

export const claudeAdapter: PlatformAdapter = {
  id: 'claude',
  name: 'Claude',
  status: 'awaiting_sample',
  exampleUrl: 'https://claude.ai/share/[SAMPLE LINK PENDING]',
  urlNotice: 'Awaiting sample link. URL patterns and selectors are not guessed until a verified sample link is provided.',

  canHandle(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('claude.ai/share/') || trimmed.includes('claude.ai/chat/');
  },

  parseHtml(html: string): ParseResult {
    // Fallback text parser until verified sample link is provided
    return this.parseText(html);
  },

  parseText(text: string): ParseResult {
    const lines = text.split(/\r?\n/);
    const messages: ChatMessage[] = [];
    let currentRole: 'User' | 'Assistant' | null = null;
    let currentLines: string[] = [];

    const flush = () => {
      if (currentRole && currentLines.length > 0) {
        const cleaned = sanitizeCleanText(currentLines.join('\n'));
        if (cleaned) {
          messages.push({ role: currentRole, text: cleaned });
        }
        currentLines = [];
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (/^(user|human):?$/i.test(line)) {
        flush();
        currentRole = 'User';
        continue;
      } else if (/^(claude|assistant):?$/i.test(line)) {
        flush();
        currentRole = 'Assistant';
        continue;
      }
      if (currentRole) {
        currentLines.push(rawLine);
      }
    }
    flush();

    if (messages.length === 0 && text.trim()) {
      messages.push({ role: 'User', text: sanitizeCleanText(text) });
    }

    return {
      messages,
      rawText: text,
      uncaptured: { images: 0, attachments: 0, canvases: 0 },
      truncationDetected: false,
    };
  },
};
