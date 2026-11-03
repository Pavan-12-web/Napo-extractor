/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage } from '../types/extractor';
import { nodeToCleanMarkdown, sanitizeCleanText } from './htmlUtils';
import { ParseResult, PlatformAdapter } from './types';
import { ChatGptConnector } from '../connectors/chatgpt';

export const chatGptAdapter: PlatformAdapter = {
  id: 'chatgpt',
  name: 'ChatGPT',
  status: 'active',
  exampleUrl: 'https://chatgpt.com/s/cx_6ae88f2e4ab08191a6ef4ecf15378398',

  canHandle(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    return (
      (trimmed.includes('chatgpt.com/share/') ||
        trimmed.includes('chatgpt.com/s/cx_') ||
        trimmed.includes('chatgpt.com/s/') ||
        trimmed.includes('chat.openai.com/share/')) &&
      !trimmed.includes('gemini.google')
    );
  },

  parseHtml(html: string): ParseResult {
    let uncaptured = { images: 0, attachments: 0, canvases: 0 };
    let truncationDetected = false;

    // Check 0: Modern React Router stream controller payload
    const streamRes = ChatGptConnector.parseReactRouterStream(html, 'https://chatgpt.com/share/pasted');
    if (streamRes && streamRes.messages.length > 0) {
      const messages: ChatMessage[] = streamRes.messages.map(m => ({
        role: m.role === 'user' ? 'User' : 'Assistant',
        text: m.content,
      }));
      return {
        messages,
        rawText: messages.map(m => `${m.role}:\n${m.text}`).join('\n\n'),
        uncaptured,
        truncationDetected,
      };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const messages: ChatMessage[] = [];

    // Check 1: Embedded JSON in script tags (e.g., __NEXT_DATA__ or remix state)
    const scriptElements = Array.from(doc.querySelectorAll('script'));

    for (const script of scriptElements) {
      const text = script.textContent || '';
      if (text.includes('"linear_conversation"') || text.includes('"mapping"') || text.includes('__NEXT_DATA__')) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            const mapping =
              data?.props?.pageProps?.serverResponse?.data?.mapping ||
              data?.props?.pageProps?.sharedConversation?.mapping ||
              data?.mapping;

            if (mapping && typeof mapping === 'object') {
              const nodeIds = Object.keys(mapping);
              for (const id of nodeIds) {
                const node = mapping[id];
                const msg = node?.message;
                if (!msg) continue;
                const authorRole = msg.author?.role;
                if (authorRole !== 'user' && authorRole !== 'assistant') continue;

                const parts = msg.content?.parts;
                if (Array.isArray(parts)) {
                  const textContent = parts
                    .filter((p: unknown) => typeof p === 'string')
                    .join('\n')
                    .trim();
                  if (textContent) {
                    messages.push({
                      role: authorRole === 'user' ? 'User' : 'Assistant',
                      text: sanitizeCleanText(textContent),
                    });
                  }
                }
              }

              if (messages.length > 0) {
                const rawCombined = messages.map(m => `${m.role}:\n${m.text}`).join('\n\n');
                return {
                  messages,
                  rawText: rawCombined,
                  uncaptured,
                  truncationDetected,
                };
              }
            }
          }
        } catch {
          // If script JSON parse fails, fall through to DOM parsing
        }
      }
    }

    // Check 2: DOM-based extraction
    // Look for conversation turns
    const turnElements = Array.from(
      doc.querySelectorAll(
        '[data-message-author-role], article, [data-testid^="conversation-turn-"]'
      )
    );

    if (turnElements.length > 0) {
      for (const el of turnElements) {
        const roleAttr = el.getAttribute('data-message-author-role');
        let role: 'User' | 'Assistant' | null = null;

        if (roleAttr === 'user') {
          role = 'User';
        } else if (roleAttr === 'assistant') {
          role = 'Assistant';
        } else {
          // Fallback role detection
          const text = el.textContent || '';
          if (el.querySelector('[data-message-author-role="user"]') || el.classList.contains('user-turn')) {
            role = 'User';
          } else if (el.querySelector('[data-message-author-role="assistant"]') || text.includes('ChatGPT said')) {
            role = 'Assistant';
          }
        }

        if (!role) continue;

        // Count uncaptured elements inside this turn
        uncaptured.images += el.querySelectorAll('img:not([alt*="avatar"]):not([alt*="profile"])').length;
        uncaptured.attachments += el.querySelectorAll('[data-testid*="attachment"], [aria-label*="attachment"]').length;
        uncaptured.canvases += el.querySelectorAll('canvas, [data-testid*="canvas"]').length;

        // Extract clean markdown
        const markdown = sanitizeCleanText(nodeToCleanMarkdown(el));
        if (markdown) {
          messages.push({ role, text: markdown });
        }
      }
    }

    // Check truncation signs in the HTML
    const htmlLower = html.toLowerCase();
    if (
      htmlLower.includes('continue generating') ||
      htmlLower.includes('load earlier messages') ||
      htmlLower.includes('show more')
    ) {
      truncationDetected = true;
    }

    // If still no messages found via specific selectors, fall back to general text parsing
    if (messages.length === 0) {
      return this.parseText(doc.body?.innerText || doc.body?.textContent || html);
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

      if (/^(user|you said):?$/i.test(line)) {
        flush();
        currentRole = 'User';
        continue;
      } else if (/^(assistant|chatgpt|chatgpt said):?$/i.test(line)) {
        flush();
        currentRole = 'Assistant';
        continue;
      }

      if (currentRole) {
        currentLines.push(rawLine);
      }
    }
    flush();

    // Check if plain text had no explicit headers
    if (messages.length === 0 && text.trim()) {
      // Never treat an unparsed HTML document as a User message
      if (!/<!DOCTYPE|<html|<body|<head/i.test(text)) {
        messages.push({ role: 'User', text: sanitizeCleanText(text) });
      }
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
