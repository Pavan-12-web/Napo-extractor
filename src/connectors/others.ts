/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation, NormalizedMessage, ProviderId } from '../types/schema';
import { sanitizeCleanText, nodeToCleanMarkdown } from '../adapters/htmlUtils';

export class GeminiConnector {
  static readonly PARSER_VERSION = '2.2.0';

  static parse(html: string, sourceUrl: string): NormalizedConversation | null {
    if (typeof DOMParser === 'undefined') return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const turnNodes = Array.from(
        doc.querySelectorAll(
          '.user-query, [data-test-id="user-query"], user-query-container, .model-response, [data-test-id="model-response"], .response-container, message-content, [data-message-author-role], .conversation-container > div, .chat-turn'
        )
      );

      if (turnNodes.length === 0) return null;

      const messages: NormalizedMessage[] = [];
      const warnings: string[] = [];
      let hasImages = false;

      turnNodes.forEach((node, idx) => {
        const classStr = (node.className || '').toString().toLowerCase();
        const testId = (node.getAttribute('data-test-id') || '').toLowerCase();
        const tag = node.tagName.toLowerCase();
        const authorRole = (node.getAttribute('data-message-author-role') || '').toLowerCase();

        const isUser =
          authorRole === 'user' ||
          classStr.includes('user') ||
          testId.includes('user') ||
          tag.includes('user');

        if (node.querySelector('img:not([alt*="avatar"])')) {
          hasImages = true;
        }

        const content = sanitizeCleanText(nodeToCleanMarkdown(node));
        if (!content) return;

        messages.push({
          id: `gemini-msg-${idx + 1}`,
          role: isUser ? 'user' : 'assistant',
          author: isUser ? 'User' : 'Gemini',
          content,
          format: 'markdown',
          createdAt: null,
          citations: [],
          attachments: [],
          artifacts: [],
        });
      });

      if (messages.length === 0) return null;

      if (hasImages) {
        warnings.push('Images referenced in the prompt are preserved in text context, but image asset binaries are excluded.');
      }

      return {
        extractionStatus: 'complete',
        platform: 'gemini',
        sourceUrl,
        shareId: sourceUrl.split('/').pop()?.split('?')[0] || '',
        title: doc.title?.replace(' - Gemini', '').trim() || 'Gemini Conversation',
        model: null,
        updatedAt: null,
        messages,
        warnings,
        parserVersion: this.PARSER_VERSION,
        connectorUsed: 'embedded_payload',
      };
    } catch {
      return null;
    }
  }
}

export class PerplexityConnector {
  static readonly PARSER_VERSION = '1.3.0';

  static parse(html: string, sourceUrl: string): NormalizedConversation | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Search query and answer blocks
    const queryEl = doc.querySelector('h1, [data-testid="search-query"], .query-text');
    const answerEl = doc.querySelector('.prose, [data-testid="answer-content"], .answer-text');

    if (!queryEl && !answerEl) return null;

    const messages: NormalizedMessage[] = [];
    const warnings: string[] = [
      'Perplexity citations: source URLs and superscript citation numbers are preserved where provided in visible HTML.',
    ];

    if (queryEl) {
      messages.push({
        id: 'pplx-query-1',
        role: 'user',
        author: 'User',
        content: sanitizeCleanText(queryEl.textContent || ''),
        format: 'markdown',
        createdAt: null,
        citations: [],
        attachments: [],
        artifacts: [],
      });
    }

    if (answerEl) {
      const citations = Array.from(answerEl.querySelectorAll('a[href^="http"], .citation')).map((a, i) => ({
        number: i + 1,
        title: a.textContent?.trim() || `Source [${i + 1}]`,
        url: a.getAttribute('href') || undefined,
      }));

      messages.push({
        id: 'pplx-answer-1',
        role: 'assistant',
        author: 'Perplexity',
        content: sanitizeCleanText(nodeToCleanMarkdown(answerEl)),
        format: 'markdown',
        createdAt: null,
        citations,
        attachments: [],
        artifacts: [],
      });
    }

    return {
      extractionStatus: 'complete',
      platform: 'perplexity',
      sourceUrl,
      shareId: sourceUrl.split('/').pop()?.split('?')[0] || '',
      title: queryEl?.textContent?.slice(0, 60) || 'Perplexity Search',
      model: null,
      updatedAt: null,
      messages,
      warnings,
      parserVersion: this.PARSER_VERSION,
      connectorUsed: 'embedded_payload',
    };
  }
}

export class GrokConnector {
  static readonly PARSER_VERSION = '1.2.0';

  static parse(textOrHtml: string, sourceUrl: string): NormalizedConversation | null {
    // Basic structural parse for Grok turns
    const lines = textOrHtml.split(/\r?\n/);
    const messages: NormalizedMessage[] = [];
    let currentRole: 'user' | 'assistant' = 'user';
    let currentLines: string[] = [];

    const flush = () => {
      if (currentLines.length > 0) {
        const content = sanitizeCleanText(currentLines.join('\n'));
        if (content) {
          messages.push({
            id: `grok-turn-${messages.length + 1}`,
            role: currentRole,
            author: currentRole === 'user' ? 'User' : 'Grok',
            content,
            format: 'markdown',
            createdAt: null,
            citations: [],
            attachments: [],
            artifacts: [],
          });
        }
        currentLines = [];
      }
    };

    for (const line of lines) {
      if (/^(user|human):?$/i.test(line.trim())) {
        flush();
        currentRole = 'user';
        continue;
      } else if (/^(grok|assistant):?$/i.test(line.trim())) {
        flush();
        currentRole = 'assistant';
        continue;
      }
      currentLines.push(line);
    }
    flush();

    if (messages.length === 0) return null;

    return {
      extractionStatus: 'complete',
      platform: 'grok',
      sourceUrl,
      shareId: sourceUrl.split('/').pop()?.split('?')[0] || '',
      title: 'Grok Conversation',
      model: null,
      updatedAt: null,
      messages,
      warnings: ['Extracted via Grok parser. Internal web searches are omitted.'],
      parserVersion: this.PARSER_VERSION,
      connectorUsed: 'manual_paste',
    };
  }
}

export class MetaAiConnector {
  static readonly PARSER_VERSION = '1.1.0';

  static parse(textOrHtml: string, sourceUrl: string): NormalizedConversation | null {
    const lines = textOrHtml.split(/\r?\n/);
    const messages: NormalizedMessage[] = [];
    let currentRole: 'user' | 'assistant' = 'user';
    let currentLines: string[] = [];

    const flush = () => {
      if (currentLines.length > 0) {
        const content = sanitizeCleanText(currentLines.join('\n'));
        if (content) {
          messages.push({
            id: `meta-turn-${messages.length + 1}`,
            role: currentRole,
            author: currentRole === 'user' ? 'User' : 'Meta AI',
            content,
            format: 'markdown',
            createdAt: null,
            citations: [],
            attachments: [],
            artifacts: [],
          });
        }
        currentLines = [];
      }
    };

    for (const line of lines) {
      if (/^(user|you):?$/i.test(line.trim())) {
        flush();
        currentRole = 'user';
        continue;
      } else if (/^(meta|meta ai|assistant):?$/i.test(line.trim())) {
        flush();
        currentRole = 'assistant';
        continue;
      }
      currentLines.push(line);
    }
    flush();

    if (messages.length === 0) return null;

    return {
      extractionStatus: 'complete',
      platform: 'meta',
      sourceUrl,
      shareId: sourceUrl.split('/').pop()?.split('?')[0] || '',
      title: 'Meta AI Conversation',
      model: null,
      updatedAt: null,
      messages,
      warnings: ['Direct URL extraction is blocked by Meta AI. Parsed from rendered session content.'],
      parserVersion: this.PARSER_VERSION,
      connectorUsed: 'browser_extension',
    };
  }
}
