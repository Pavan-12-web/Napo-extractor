/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage } from '../types/extractor';
import { nodeToCleanMarkdown, sanitizeCleanText } from './htmlUtils';
import { ParseResult, PlatformAdapter } from './types';

export const geminiAdapter: PlatformAdapter = {
  id: 'gemini',
  name: 'Gemini',
  status: 'active',
  exampleUrl: 'https://share.gemini.google/D96t5BUjuFVg',

  canHandle(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    return (
      trimmed.includes('share.gemini.google') ||
      trimmed.includes('gemini.google.com/share/') ||
      trimmed.includes('bard.google.com/share/')
    );
  },

  parseHtml(html: string): ParseResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const messages: ChatMessage[] = [];
    let uncaptured = { images: 0, attachments: 0, canvases: 0 };
    let truncationDetected = false;

    // Check 1: Embedded Google JSON data in script tags
    const scripts = Array.from(doc.querySelectorAll('script'));
    for (const script of scripts) {
      const text = script.textContent || '';
      if (text.includes('AF_initDataCallback') || text.includes('WIZ_global_data')) {
        // Look for string arrays or conversation patterns
        try {
          const match = text.match(/data:\s*(\[[\s\S]*?\])\s*\}\);/);
          if (match && match[1]) {
            // Some Gemini shares embed data blobs here
          }
        } catch {
          // ignore
        }
      }
    }

    // Check 2: DOM-based extraction
    // Gemini message query containers
    const turnElements = Array.from(
      doc.querySelectorAll(
        '.user-query, [data-test-id="user-query"], user-query-container, .model-response, [data-test-id="model-response"], .response-container, message-content'
      )
    );

    if (turnElements.length > 0) {
      for (const el of turnElements) {
        let role: 'User' | 'Assistant' | null = null;
        const className = el.className || '';
        const testId = el.getAttribute('data-test-id') || '';

        if (
          className.includes('user-query') ||
          testId.includes('user-query') ||
          el.tagName.toLowerCase() === 'user-query-container'
        ) {
          role = 'User';
        } else if (
          className.includes('model-response') ||
          testId.includes('model-response') ||
          className.includes('response-container') ||
          el.tagName.toLowerCase() === 'message-content'
        ) {
          role = 'Assistant';
        }

        if (!role) continue;

        // Count uncaptured
        uncaptured.images += el.querySelectorAll('img:not([alt*="avatar"])').length;
        uncaptured.attachments += el.querySelectorAll('[data-test-id*="attachment"], file-preview').length;
        uncaptured.canvases += el.querySelectorAll('canvas').length;

        const markdown = sanitizeCleanText(nodeToCleanMarkdown(el));
        if (markdown) {
          // Check if this is a duplicate or nested container
          const lastMsg = messages[messages.length - 1];
          if (!lastMsg || lastMsg.role !== role || lastMsg.text !== markdown) {
            messages.push({ role, text: markdown });
          }
        }
      }
    }

    // Fallback: search for general article or conversation containers
    if (messages.length === 0) {
      const generalContainers = Array.from(doc.querySelectorAll('main, [role="main"]'));
      if (generalContainers.length > 0) {
        return this.parseText(generalContainers[0].textContent || '');
      }
      return this.parseText(doc.body?.innerText || doc.body?.textContent || html);
    }

    // Check for truncation signs
    const lowerHtml = html.toLowerCase();
    if (lowerHtml.includes('show more') || lowerHtml.includes('expand response')) {
      truncationDetected = true;
    }

    const rawCombined = messages.map(m => `${m.role}:\n${m.text}`).join('\n\n');
    return {
      messages,
      rawText: rawCombined,
      uncaptured,
      truncationDetected,
    };
  },

  parseText(text: string): ParseResult {
    const lines = text.split(/\r?\n/);
    const messages: ChatMessage[] = [];
    let currentRole: 'User' | 'Assistant' | null = null;
    let currentLines: string[] = [];
    let truncationDetected = false;

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

      if (/^(user|you|prompt):?$/i.test(line)) {
        flush();
        currentRole = 'User';
        continue;
      } else if (/^(gemini|assistant|response):?$/i.test(line)) {
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

    if (text.includes('...') && text.endsWith('...')) {
      truncationDetected = true;
    }

    return {
      messages,
      rawText: text,
      uncaptured: { images: 0, attachments: 0, canvases: 0 },
      truncationDetected,
    };
  },
};
