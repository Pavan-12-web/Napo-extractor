/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation, NormalizedMessage } from '../types/schema';
import { sanitizeCleanText, nodeToCleanMarkdown } from '../adapters/htmlUtils';

/**
 * Extracts a balanced JSON object starting from a given index containing '{'.
 * Correctly handles quotes, escapes, and nested braces.
 */
function extractBalancedJsonObject(str: string, startIndex: number): { json: string; endIndex: number } | null {
  const openBrace = str.indexOf('{', startIndex);
  if (openBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let quoteChar = '';
  let isEscaped = false;

  for (let i = openBrace; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === quoteChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return {
          json: str.slice(openBrace, i + 1),
          endIndex: i + 1,
        };
      }
    }
  }

  return null;
}

/**
 * Safely extracts string payloads passed to streamController.enqueue(...),
 * correctly handling character escaping and quotes without prematurely breaking on nested semicolons or parens.
 */
function extractEnqueuePayloads(html: string): string[] {
  const marker = 'streamController.enqueue(';
  const payloads: string[] = [];
  let pos = 0;
  while ((pos = html.indexOf(marker, pos)) !== -1) {
    const startIdx = pos + marker.length;
    let i = startIdx;
    while (i < html.length && /\s/.test(html[i])) i++;
    if (html[i] === '"' || html[i] === "'") {
      const quoteChar = html[i];
      let strEnd = i + 1;
      let escaped = false;
      while (strEnd < html.length) {
        const c = html[strEnd];
        if (escaped) {
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === quoteChar) {
          break;
        }
        strEnd++;
      }
      if (strEnd < html.length) {
        payloads.push(html.slice(i, strEnd + 1));
        pos = strEnd;
        continue;
      }
    }
    pos += marker.length;
  }
  return payloads;
}

/**
 * ChatGPT Connector: Deep parsing across React Router streaming context, React Flight payloads,
 * legacy __NEXT_DATA__, script tags, and DOM turns.
 * Guarantees extraction of complete dialogue without metadata teasers.
 */
export class ChatGptConnector {
  static readonly PARSER_VERSION = '2.6.0';

  /**
   * Parses React Router / Remix streaming payloads (devalue/Turbo format) used in modern ChatGPT share pages.
   */
  static parseReactRouterStream(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      const payloads = extractEnqueuePayloads(payloadText);
      if (payloads.length === 0) return null;

      for (const rawQuoted of payloads) {
        try {
          const rawData = JSON.parse(rawQuoted);
          const parsed = JSON.parse(rawData);
          if (!Array.isArray(parsed)) continue;

          // Strategy A: linear_conversation index list
          const linIdx = parsed.indexOf('linear_conversation');
          if (linIdx !== -1 && Array.isArray(parsed[linIdx + 1])) {
            const turnIndices: number[] = parsed[linIdx + 1];

            const deref = (idx: any, depth = 0, seen = new Set<number>()): any => {
              if (depth > 8) return null;
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
                let realKey = key;
                if (key.startsWith('_')) {
                  const keyIdx = parseInt(key.slice(1), 10);
                  if (typeof parsed[keyIdx] === 'string') {
                    realKey = parsed[keyIdx];
                  }
                }
                if (realKey === 'parent' || realKey === 'children') continue;
                obj[realKey] = deref(item[key], depth + 1, new Set(seen));
              }
              return obj;
            };

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
              let rawContent = Array.isArray(parts)
                ? parts.filter((p: unknown) => typeof p === 'string').join('\n')
                : typeof msg.content?.text === 'string'
                ? msg.content.text
                : '';

              // Skip internal logged-out instructions placeholder
              if (rawContent.trim() === 'Original custom instructions no longer available') {
                continue;
              }

              // Handle user turn where prompt was an uploaded image or attachment without text
              if (
                !rawContent.trim() &&
                role === 'user' &&
                (msg.metadata?.attachments?.length ||
                  msg.metadata?.maskedUploads?.length ||
                  msg.metadata?.user_context_message_data)
              ) {
                rawContent = '[Uploaded image / math prompt]';
              }

              const content = sanitizeCleanText(rawContent);
              if (!content || content.trim().length === 0) continue;

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

            if (messages.length >= 1) {
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
            }
          }

          // Strategy B: Check if array directly holds mapping object
          for (const item of parsed) {
            if (item && typeof item === 'object' && item.mapping) {
              const result = this.normalizeFromMapping(item.mapping, item.title || '', null, sourceUrl);
              if (result.messages.length > 0) return result;
            }
          }
        } catch {
          // Try next payload
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parses React Flight chunks embedded in <script> tags of modern Next.js/React Flight ChatGPT share pages.
   */
  static parseReactFlightPayload(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      const flightChunks: string[] = [];
      const pushMatches = payloadText.matchAll(
        /(?:self\.__next_f|\(self\.__next_f\s*=\s*self\.__next_f\s*\|\|\s*\[\]\))\s*\.push\(\[\s*\d+\s*,\s*"([\s\S]*?)"\s*\]\)/g
      );

      for (const m of pushMatches) {
        try {
          const unescaped = JSON.parse(`"${m[1]}"`);
          flightChunks.push(unescaped);
        } catch {
          flightChunks.push(m[1]);
        }
      }

      if (flightChunks.length === 0) return null;
      const combinedFlight = flightChunks.join('\n');

      if (!combinedFlight.includes('linear_conversation') && !combinedFlight.includes('mapping')) {
        return null;
      }

      // 1. Try finding mapping object
      const mappingIndex = combinedFlight.indexOf('"mapping":');
      if (mappingIndex !== -1) {
        const balanced = extractBalancedJsonObject(combinedFlight, mappingIndex + 9);
        if (balanced) {
          try {
            const mappingData = JSON.parse(balanced.json);
            if (mappingData && typeof mappingData === 'object') {
              const res = this.normalizeFromMapping(mappingData, '', null, sourceUrl);
              if (res.messages.length > 0) return res;
            }
          } catch {
            // Continue
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Deeply inspects all <script> blocks for conversation trees.
   */
  static parseScriptTagsDeep(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      const scripts = Array.from(payloadText.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi));

      for (const match of scripts) {
        const content = match[1]?.trim();
        if (!content) continue;

        // Check if script has mapping
        if (content.includes('"mapping":')) {
          const mapIdx = content.indexOf('"mapping":');
          const balanced = extractBalancedJsonObject(content, mapIdx + 9);
          if (balanced) {
            try {
              const mapping = JSON.parse(balanced.json);
              if (mapping && typeof mapping === 'object' && Object.keys(mapping).length > 0) {
                const res = this.normalizeFromMapping(mapping, '', null, sourceUrl);
                if (res.messages.length > 0) return res;
              }
            } catch {
              // Continue
            }
          }
        }

        // Check if script is JSON
        if ((content.startsWith('{') && content.endsWith('}')) || (content.startsWith('[') && content.endsWith(']'))) {
          try {
            const data = JSON.parse(content);
            const serverResponse =
              data?.props?.pageProps?.serverResponse?.data ||
              data?.props?.pageProps?.sharedConversation ||
              data?.serverResponse?.data;

            if (serverResponse?.mapping) {
              const res = this.normalizeFromMapping(
                serverResponse.mapping,
                serverResponse.title || '',
                serverResponse.model?.slug || null,
                sourceUrl
              );
              if (res.messages.length > 0) return res;
            }
          } catch {
            // Not pure JSON
          }
        }
      }

      return null;
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
   * Fallback regex scanner: Extracts chronological user and assistant message parts
   * directly from script texts if AST parsing encounters unexpected wrappers.
   */
  static parseScriptRegexMessages(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      // Search for message chunks with author role and parts
      const messageRegex = /"author"\s*:\s*\{\s*"role"\s*:\s*"(user|assistant)"[\s\S]*?"parts"\s*:\s*\[\s*"((?:\\.|[^"\\])*)"/g;
      const matches = Array.from(payloadText.matchAll(messageRegex));

      if (matches.length < 2) return null;

      const messages: NormalizedMessage[] = [];
      const seenContent = new Set<string>();

      for (let i = 0; i < matches.length; i++) {
        const role = matches[i][1] as 'user' | 'assistant';
        let rawContent = matches[i][2];
        try {
          rawContent = JSON.parse(`"${rawContent}"`);
        } catch {
          rawContent = rawContent.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }

        const clean = sanitizeCleanText(rawContent);
        if (!clean || clean.length < 2) continue;

        // Dedup consecutive duplicate messages
        const key = `${role}:${clean.slice(0, 100)}`;
        if (seenContent.has(key)) continue;
        seenContent.add(key);

        messages.push({
          id: `regex-msg-${messages.length + 1}`,
          role,
          author: role === 'user' ? 'User' : 'ChatGPT',
          content: clean,
          format: 'markdown',
          createdAt: null,
          citations: [],
          attachments: [],
          artifacts: [],
        });
      }

      const hasUser = messages.some(m => m.role === 'user');
      const hasAssistant = messages.some(m => m.role === 'assistant');

      if (!hasUser || !hasAssistant || messages.length < 2) {
        return null;
      }

      return {
        extractionStatus: 'complete',
        platform: 'chatgpt',
        sourceUrl,
        shareId: sourceUrl.split('/').pop()?.split('?')[0] || '',
        title: 'ChatGPT Conversation',
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

    const nodeIds = Object.keys(mapping);
    for (const id of nodeIds) {
      const node = mapping[id];
      const msg = node?.message;
      if (!msg) continue;

      const role = msg.author?.role;
      if (role !== 'user' && role !== 'assistant') continue;

      const parts = msg.content?.parts;
      if (!Array.isArray(parts)) continue;

      let content = parts
        .filter((p: unknown) => typeof p === 'string')
        .join('\n')
        .trim();

      if (!content) continue;

      content = sanitizeCleanText(content);
      if (!content) continue;

      const citations = (msg.metadata?.citations || []).map((c: any, idx: number) => ({
        number: idx + 1,
        title: c.metadata?.title || 'Source Citation',
        url: c.metadata?.url || '',
      }));

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
   * Parses modern OpenAI Octane native/suspense signals embedded in <script> tags.
   */
  static parseOctaneSignals(payloadText: string, sourceUrl: string): NormalizedConversation | null {
    try {
      const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
      let m;
      const messages: NormalizedMessage[] = [];
      const seenIds = new Set<string>();

      const decodeOctaneVal = (val: any): any => {
        if (!Array.isArray(val) || val.length === 0) return val;
        const type = val[0];
        if (type === 'string' || type === 'number' || type === 'boolean') {
          return val[1];
        }
        if (type === 'array' && Array.isArray(val[1])) {
          return val[1].map(decodeOctaneVal);
        }
        if (type === 'object' && Array.isArray(val[1])) {
          const obj: Record<string, any> = {};
          for (const pair of val[1]) {
            if (Array.isArray(pair) && pair.length === 2 && typeof pair[0] === 'string') {
              obj[pair[0]] = decodeOctaneVal(pair[1]);
            }
          }
          return obj;
        }
        return val;
      };

      const searchDecoded = (node: any) => {
        if (!node || typeof node !== 'object') return;

        if (node.role && (node.role === 'user' || node.role === 'assistant')) {
          const role = node.role as 'user' | 'assistant';
          let content = typeof node.content === 'string' ? node.content.trim() : '';
          const id = node.id || `octane-${messages.length + 1}`;

          if (content === 'Original custom instructions no longer available') {
            return;
          }

          if (!content && role === 'user' && (node.maskedUploads || node.attachments)) {
            content = '[Uploaded image / math prompt]';
          }

          const clean = sanitizeCleanText(content);
          if (clean && !seenIds.has(id)) {
            seenIds.add(id);
            messages.push({
              id,
              role,
              author: role === 'user' ? 'User' : 'ChatGPT',
              content: clean,
              format: 'markdown',
              createdAt: null,
              citations: [],
              attachments: [],
              artifacts: [],
            });
          }
        }

        if (Array.isArray(node)) {
          for (const item of node) searchDecoded(item);
        } else {
          for (const k of Object.keys(node)) searchDecoded(node[k]);
        }
      };

      while ((m = scriptRegex.exec(payloadText)) !== null) {
        const attrs = m[1];
        const content = m[2]?.trim();
        if (!attrs.includes('octane') && !content.includes('"scopes"')) continue;

        try {
          const data = JSON.parse(content);
          if (!data.scopes || !Array.isArray(data.scopes)) continue;

          for (const scope of data.scopes) {
            if (scope.entries && Array.isArray(scope.entries)) {
              for (const entry of scope.entries) {
                const decoded = decodeOctaneVal(entry.value);
                searchDecoded(decoded);
              }
            }
          }
        } catch {
          // Continue
        }
      }

      if (messages.length > 0) {
        const titleMatch = payloadText.match(/<title>([\s\S]*?)<\/title>/i);
        const title = titleMatch
          ? titleMatch[1].replace(/ - ChatGPT$| \| ChatGPT$/i, '').trim()
          : 'ChatGPT Conversation';

        return {
          extractionStatus: 'complete',
          platform: 'chatgpt',
          sourceUrl,
          shareId: sourceUrl.split('/').pop()?.split('?')[0] || '',
          title: title || 'ChatGPT Conversation',
          model: null,
          updatedAt: null,
          messages,
          warnings: [],
          parserVersion: this.PARSER_VERSION,
          connectorUsed: 'structured_api',
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Master entry point for HTML parsing. Runs all strategies sequentially.
   */
  static parseRenderedHtml(html: string, sourceUrl: string): NormalizedConversation | null {
    // 1. Try modern React Router streaming payload first
    const stream = this.parseReactRouterStream(html, sourceUrl);
    if (stream && stream.messages.length > 0) return stream;

    // 2. Try modern Octane signal payloads
    const octane = this.parseOctaneSignals(html, sourceUrl);
    if (octane && octane.messages.length > 0) return octane;

    // 3. Try React Flight
    const flight = this.parseReactFlightPayload(html, sourceUrl);
    if (flight && flight.messages.length > 0) return flight;

    // 3. Try deep script scanner
    const scriptRes = this.parseScriptTagsDeep(html, sourceUrl);
    if (scriptRes && scriptRes.messages.length > 0) return scriptRes;

    // 4. Try legacy __NEXT_DATA__
    const nextData = this.parseNextDataPayload(html, sourceUrl);
    if (nextData && nextData.messages.length > 0) return nextData;

    // 5. Try script regex fallback
    const regexRes = this.parseScriptRegexMessages(html, sourceUrl);
    if (regexRes && regexRes.messages.length > 0) return regexRes;

    // 6. DOM-based extraction
    try {
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const turnNodes = Array.from(
          doc.querySelectorAll('[data-message-author-role], article, [data-testid^="conversation-turn-"]')
        );

        if (turnNodes.length > 0) {
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

          if (messages.length > 0) {
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
      }
    } catch {
      // DOMParser not available or failed
    }

    return null;
  }
}

function attachmentsDetected(mapping: Record<string, any>): boolean {
  for (const k of Object.keys(mapping)) {
    if (mapping[k]?.message?.metadata?.attachments?.length > 0) return true;
  }
  return false;
}
