/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation, NormalizedMessage } from '../types/schema';
import { sanitizeCleanText, nodeToCleanMarkdown } from '../adapters/htmlUtils';

/**
 * ChatGPT Connector: Parses React Flight payloads, legacy __NEXT_DATA__, and rendered DOM turns.
 * Strictly in-memory, zero local disk writes, no external asset downloading.
 */
export class ChatGptConnector {
  static readonly PARSER_VERSION = '2.4.0';

  /**
   * Parses React Flight chunks often embedded in <script> tags of modern Next.js/React Flight ChatGPT share pages.
   */
  static parseReactFlightPayload(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      // React Flight stream lines often look like: 1:{"props":...} or contain self.__next_f.push([1, "..."])
      const flightChunks: string[] = [];
      const pushMatches = payloadText.matchAll(/self\.__next_f\.push\(\[\d+,\s*"([\s\S]*?)"\]\)/g);
      for (const m of pushMatches) {
        // Unescape escaped quotes and newlines
        try {
          const unescaped = JSON.parse(`"${m[1]}"`);
          flightChunks.push(unescaped);
        } catch {
          flightChunks.push(m[1]);
        }
      }

      const combinedFlight = flightChunks.join('\n');
      if (!combinedFlight.includes('linear_conversation') && !combinedFlight.includes('mapping')) {
        return null;
      }

      // Locate JSON mapping tree within flight stream
      const mappingIndex = combinedFlight.indexOf('"mapping":');
      if (mappingIndex === -1) return null;

      // Extract JSON substring around mapping
      const openBrace = combinedFlight.lastIndexOf('{', mappingIndex);
      if (openBrace === -1) return null;

      // Find matching bracket or balance braces
      let braceCount = 0;
      let endIndex = -1;
      for (let i = openBrace; i < combinedFlight.length; i++) {
        if (combinedFlight[i] === '{') braceCount++;
        else if (combinedFlight[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }

      if (endIndex === -1) return null;
      const jsonStr = combinedFlight.slice(openBrace, endIndex);
      const data = JSON.parse(jsonStr);

      return this.normalizeFromMapping(data.mapping, data.title || '', data.model_slug || null, sourceUrl);
    } catch {
      return null;
    }
  }

  /**
   * Parses legacy __NEXT_DATA__ script JSON.
   */
  static parseNextDataPayload(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      const match = payloadText.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) return null;

      const data = JSON.parse(match[1]);
      const serverResponse =
        data?.props?.pageProps?.serverResponse?.data ||
        data?.props?.pageProps?.sharedConversation;

      if (!serverResponse || !serverResponse.mapping) return null;

      return this.normalizeFromMapping(
        serverResponse.mapping,
        serverResponse.title || '',
        serverResponse.model?.slug || null,
        sourceUrl
      );
    } catch {
      return null;
    }
  }

  /**
   * Normalizes standard ChatGPT mapping tree into common schema.
   */
  static normalizeFromMapping(
    mapping: Record<string, any>,
    title: string,
    model: string | null,
    sourceUrl: string
  ): NormalizedConversation {
    const messages: NormalizedMessage[] = [];
    const warnings: string[] = [];

    // Order traversal: start with root or find chronological sequence
    const nodeIds = Object.keys(mapping);
    for (const id of nodeIds) {
      const node = mapping[id];
      const msg = node?.message;
      if (!msg) continue;

      const role = msg.author?.role;
      // Exclude system messages, hidden prompts, and internal reasoning by default
      if (role !== 'user' && role !== 'assistant') continue;

      const parts = msg.content?.parts;
      if (!Array.isArray(parts)) continue;

      let content = parts
        .filter((p: unknown) => typeof p === 'string')
        .join('\n')
        .trim();

      if (!content) continue;

      content = sanitizeCleanText(content);

      // Citations references
      const citations = (msg.metadata?.citations || []).map((c: any, idx: number) => ({
        number: idx + 1,
        title: c.metadata?.title || 'Source Citation',
        url: c.metadata?.url || '',
      }));

      // Attachment references (names preserved, binary downloading disabled)
      const attachments = (msg.metadata?.attachments || []).map((att: any) => ({
        name: att.name || 'Attachment',
        mimeType: att.mime_type,
        sizeBytes: att.size,
        unretrievableNotice: 'Raw attachment downloading is disabled for security.',
      }));

      messages.push({
        id: msg.id || id,
        role: role === 'user' ? 'user' : 'assistant',
        author: role === 'user' ? 'User' : 'ChatGPT',
        content,
        format: 'markdown',
        createdAt: msg.create_time ? new Date(msg.create_time * 1000).toISOString() : null,
        citations,
        attachments,
        artifacts: [],
      });
    }

    if (attachmentsDetected(mapping)) {
      warnings.push('Images and attachments are noted as references; raw file binaries are excluded.');
    }

    const shareId = sourceUrl.split('/').pop()?.split('?')[0] || '';

    return {
      extractionStatus: messages.length > 0 ? 'complete' : 'partial',
      platform: 'chatgpt',
      sourceUrl,
      shareId,
      title: title || 'ChatGPT Conversation',
      model,
      updatedAt: null,
      messages,
      warnings,
      parserVersion: this.PARSER_VERSION,
      connectorUsed: 'structured_api',
    };
  }

  /**
   * Parses React Router / Remix streaming payloads (devalue/Turbo format) used in modern ChatGPT share pages.
   */
  static parseReactRouterStream(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      const streamMatch = payloadText.match(/window\.__reactRouterContext\.streamController\.enqueue\(("[\s\S]*?")\);/);
      if (!streamMatch) return null;

      const rawData = JSON.parse(streamMatch[1]);
      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed)) return null;

      const linIdx = parsed.indexOf('linear_conversation');
      if (linIdx === -1 || !Array.isArray(parsed[linIdx + 1])) return null;

      const turnIndices: number[] = parsed[linIdx + 1];

      function deref(idx: any, depth = 0, seen = new Set<number>()): any {
        if (depth > 6) return null;
        if (idx === null || idx === undefined) return null;
        if (typeof idx !== 'number') return idx;
        if (idx < 0 || idx >= parsed.length) return idx;
        const item = parsed[idx];
        if (typeof item !== 'object' || item === null) return item;
        if (seen.has(idx)) return null;
        seen.add(idx);

        if (Array.isArray(item)) {
          return item.map(childIdx => deref(childIdx, depth + 1, new Set(seen)));
        }

        const obj: Record<string, any> = {};
        for (const key of Object.keys(item)) {
          if (key === '_187' || key === '_189') continue; // Skip circular parent/child graphs
          let realKey = key;
          if (key.startsWith('_')) {
            const keyIdx = parseInt(key.slice(1), 10);
            if (typeof parsed[keyIdx] === 'string') {
              realKey = parsed[keyIdx];
            }
          }
          obj[realKey] = deref(item[key], depth + 1, new Set(seen));
        }
        return obj;
      }

      const messages: NormalizedMessage[] = [];

      for (const nodeIdx of turnIndices) {
        const node = deref(nodeIdx);
        const msg = node?.message;
        if (!msg) continue;

        const role = msg.author?.role;
        if (role !== 'user' && role !== 'assistant') continue;

        const contentType = msg.content?.content_type;
        if (
          contentType === 'model_editable_context' ||
          contentType === 'reasoning_recap' ||
          contentType === 'thoughts'
        ) {
          continue;
        }

        const parts = msg.content?.parts;
        const rawContent = Array.isArray(parts)
          ? parts.filter((p: unknown) => typeof p === 'string').join('\n')
          : '';

        const content = sanitizeCleanText(rawContent);
        if (!content) continue;

        const createdAt = msg.create_time ? new Date(msg.create_time * 1000).toISOString() : null;

        messages.push({
          id: msg.id || `chatgpt-${messages.length + 1}`,
          role: role === 'user' ? 'user' : 'assistant',
          author: role === 'user' ? 'User' : 'ChatGPT',
          content,
          format: 'markdown',
          createdAt,
          citations: [],
          attachments: [],
          artifacts: [],
        });
      }

      if (messages.length === 0) return null;

      const titleMatch = payloadText.match(/<title>([\s\S]*?)<\/title>/i);
      const title = titleMatch
        ? titleMatch[1].replace(/ - ChatGPT$| \| ChatGPT$/i, '').trim()
        : 'ChatGPT Conversation';

      const shareId = sourceUrl.split('/').pop()?.split('?')[0] || '';

      return {
        extractionStatus: 'complete',
        platform: 'chatgpt',
        sourceUrl,
        shareId,
        title: title || 'ChatGPT Conversation',
        model: null,
        updatedAt: null,
        messages,
        warnings: [],
        parserVersion: this.PARSER_VERSION,
        connectorUsed: 'structured_api',
      };
    } catch {
      return null;
    }
  }

  /**
   * DOM fallback parser for rendered HTML.
   */
  static parseRenderedHtml(html: string, sourceUrl: string): NormalizedConversation | null {
    // 1. Try modern React Router streaming payload first
    const stream = this.parseReactRouterStream(html, sourceUrl);
    if (stream && stream.messages.length > 0) return stream;

    // 2. Try React Flight
    const flight = this.parseReactFlightPayload(html, sourceUrl);
    if (flight && flight.messages.length > 0) return flight;

    // 3. Try legacy __NEXT_DATA__
    const nextData = this.parseNextDataPayload(html, sourceUrl);
    if (nextData && nextData.messages.length > 0) return nextData;

    // 4. DOM-based extraction
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const turnNodes = Array.from(
      doc.querySelectorAll('[data-message-author-role], article, [data-testid^="conversation-turn-"]')
    );


    if (turnNodes.length === 0) return null;

    const messages: NormalizedMessage[] = [];
    const warnings: string[] = [];

    turnNodes.forEach((node, idx) => {
      const roleAttr = node.getAttribute('data-message-author-role');
      let role: 'user' | 'assistant' = 'assistant';
      if (roleAttr === 'user' || node.classList.contains('user-turn') || node.querySelector('[data-message-author-role="user"]')) {
        role = 'user';
      }

      const content = sanitizeCleanText(nodeToCleanMarkdown(node));
      if (!content) return;

      messages.push({
        id: `chatgpt-turn-${idx + 1}`,
        role,
        author: role === 'user' ? 'User' : 'ChatGPT',
        content,
        format: 'markdown',
        createdAt: null,
        citations: [],
        attachments: [],
        artifacts: [],
      });
    });

    if (messages.length === 0) return null;

    return {
      extractionStatus: 'complete',
      platform: 'chatgpt',
      sourceUrl,
      shareId: sourceUrl.split('/').pop()?.split('?')[0] || '',
      title: doc.title?.replace(' | ChatGPT', '').trim() || 'ChatGPT Conversation',
      model: null,
      updatedAt: null,
      messages,
      warnings,
      parserVersion: this.PARSER_VERSION,
      connectorUsed: 'embedded_payload',
    };
  }
}

function attachmentsDetected(mapping: Record<string, any>): boolean {
  for (const k of Object.keys(mapping)) {
    if (mapping[k]?.message?.metadata?.attachments?.length > 0) return true;
  }
  return false;
}
