/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage } from '../types/extractor';
import { sanitizeCleanText } from './htmlUtils';
import { ParseResult, PlatformAdapter } from './types';

export const metaAdapter: PlatformAdapter = {
  id: 'meta',
  name: 'Meta AI',
  status: 'awaiting_sample',
  exampleUrl: 'https://meta.ai/share/[SAMPLE LINK PENDING]',
  urlNotice: 'Awaiting sample link. URL patterns and selectors are not guessed until a verified sample link is provided.',

  canHandle(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('meta.ai/share/') || trimmed.includes('meta.ai/c/');
  },

  parseHtml(html: string): ParseResult {
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
      if (/^(user|you):?$/i.test(line)) {
        flush();
        currentRole = 'User';
        continue;
      } else if (/^(meta|meta ai|assistant):?$/i.test(line)) {
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
