/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation, NormalizedMessage, ArtifactReference } from '../types/schema';
import { sanitizeCleanText, nodeToCleanMarkdown } from '../adapters/htmlUtils';

/**
 * Claude Connector: Parses public chat snapshots and rendered DOM turns.
 * Treats interactive Artifacts as source code rather than executable applications.
 */
export class ClaudeConnector {
  static readonly PARSER_VERSION = '2.2.0';

  /**
   * Derives share UUID from a Claude share URL.
   */
  static extractShareUuid(url: string): string | null {
    const match = url.match(/claude\.ai\/(share|chat)\/([0-9a-fA-F-]{36})/i);
    return match ? match[2] : null;
  }

  /**
   * Normalizes Claude Chat Snapshot JSON payload into common schema.
   */
  static parseSnapshotJson(data: any, sourceUrl: string): NormalizedConversation | null {
    try {
      const uuid = this.extractShareUuid(sourceUrl) || data?.uuid || '';
      const conversation = data?.chat_messages || data?.messages || data?.conversation || data;

      if (!Array.isArray(conversation) && !data?.chat_messages) {
        return null;
      }

      const rawMessages: any[] = Array.isArray(conversation) ? conversation : data.chat_messages;
      const messages: NormalizedMessage[] = [];
      const warnings: string[] = [];
      let artifactsCount = 0;

      for (let i = 0; i < rawMessages.length; i++) {
        const item = rawMessages[i];
        const roleStr = (item.sender || item.role || '').toLowerCase();
        const role: 'user' | 'assistant' = roleStr.includes('human') || roleStr.includes('user') ? 'user' : 'assistant';

        let textContent = '';
        const artifacts: ArtifactReference[] = [];

        // Check content format: string or array of parts
        if (typeof item.text === 'string') {
          textContent = item.text;
        } else if (typeof item.content === 'string') {
          textContent = item.content;
        } else if (Array.isArray(item.content)) {
          // Parse multi-part blocks (text, tool_use, artifacts, documents)
          for (const part of item.content) {
            if (part.type === 'text' && part.text) {
              textContent += part.text + '\n';
            } else if (part.type === 'tool_use' || part.name === 'artifacts') {
              // Extract Artifact source code
              const input = part.input || {};
              const artContent = input.content || '';
              const artTitle = input.title || 'Claude Artifact';
              const artType = input.type || 'application/vnd.ant.code';
              const artLang = input.language || 'typescript';

              artifacts.push({
                identifier: part.id || `artifact-${i + 1}`,
                title: artTitle,
                type: artType,
                language: artLang,
                content: artContent,
                isInteractiveWarning: 'Interactive Artifact rendered as static source code.',
              });
              artifactsCount++;

              textContent += `\n\`\`\`${artLang}\n// Artifact: ${artTitle}\n${artContent}\n\`\`\`\n\n`;
            }
          }
        }

        // Inline artifact tags check (<antArtifact ...>...</antArtifact>)
        const inlineArtifactMatches = textContent.matchAll(/<antArtifact\s+([^>]+)>([\s\S]*?)<\/antArtifact>/g);
        for (const m of inlineArtifactMatches) {
          const attrs = m[1];
          const artBody = m[2];
          const titleMatch = attrs.match(/title="([^"]+)"/);
          const langMatch = attrs.match(/language="([^"]+)"/);
          const typeMatch = attrs.match(/type="([^"]+)"/);

          artifacts.push({
            identifier: `inline-artifact-${artifacts.length + 1}`,
            title: titleMatch ? titleMatch[1] : 'Claude Artifact',
            type: typeMatch ? typeMatch[1] : 'code',
            language: langMatch ? langMatch[1] : 'code',
            content: artBody.trim(),
            isInteractiveWarning: 'Interactive Artifact exported as source code.',
          });
          artifactsCount++;
        }

        const cleaned = sanitizeCleanText(textContent);
        if (!cleaned) continue;

        messages.push({
          id: item.uuid || `claude-msg-${i + 1}`,
          role,
          author: role === 'user' ? 'User' : 'Claude',
          content: cleaned,
          format: 'markdown',
          createdAt: item.created_at || null,
          citations: [],
          attachments: (item.attachments || []).map((att: any) => ({
            name: att.file_name || 'Document',
            sizeBytes: att.file_size,
            unretrievableNotice: 'Private attachments require authentication and are excluded.',
          })),
          artifacts,
        });
      }

      if (artifactsCount > 0) {
        warnings.push(`${artifactsCount} Claude Artifact(s) preserved as clean source code; interactive runtime execution is not supported.`);
      }

      return {
        extractionStatus: 'complete',
        platform: 'claude',
        sourceUrl,
        shareId: uuid,
        title: data.name || data.title || 'Claude Conversation',
        model: data.model || null,
        updatedAt: data.updated_at || null,
        messages,
        warnings,
        parserVersion: this.PARSER_VERSION,
        connectorUsed: 'structured_api',
      };
    } catch {
      return null;
    }
  }

  /**
   * DOM fallback parser for rendered Claude HTML.
   */
  static parseRenderedHtml(html: string, sourceUrl: string): NormalizedConversation | null {
    // Check if snapshot JSON is embedded in a script tag
    const scriptMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      try {
        const parsed = JSON.parse(scriptMatch[1]);
        const snapshot = parsed?.props?.pageProps?.snapshot || parsed?.props?.pageProps?.conversation;
        if (snapshot) {
          const res = this.parseSnapshotJson(snapshot, sourceUrl);
          if (res && res.messages.length > 0) return res;
        }
      } catch {
        // Fall through
      }
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for Claude message bubbles
    const userNodes = Array.from(doc.querySelectorAll('.font-user-message, [data-is-streaming="false"] .font-user-message, .human-turn, [data-testid="user-message"]'));
    const claudeNodes = Array.from(doc.querySelectorAll('.font-claude-message, .font-claude, .assistant-turn, [data-testid="claude-message"]'));

    if (userNodes.length === 0 && claudeNodes.length === 0) {
      return null;
    }

    const messages: NormalizedMessage[] = [];
    const allTurns = Array.from(doc.querySelectorAll('[data-is-streaming], .font-user-message, .font-claude-message, article'));

    allTurns.forEach((node, idx) => {
      const isUser = node.classList.contains('font-user-message') || node.querySelector('.font-user-message');
      const role: 'user' | 'assistant' = isUser ? 'user' : 'assistant';
      const content = sanitizeCleanText(nodeToCleanMarkdown(node));

      if (content) {
        messages.push({
          id: `claude-dom-${idx + 1}`,
          role,
          author: role === 'user' ? 'User' : 'Claude',
          content,
          format: 'markdown',
          createdAt: null,
          citations: [],
          attachments: [],
          artifacts: [],
        });
      }
    });

    if (messages.length === 0) return null;

    return {
      extractionStatus: 'complete',
      platform: 'claude',
      sourceUrl,
      shareId: this.extractShareUuid(sourceUrl) || '',
      title: doc.title?.replace(' | Claude', '').trim() || 'Claude Conversation',
      model: null,
      updatedAt: null,
      messages,
      warnings: ['Extracted from rendered DOM. Dynamic interactive artifacts are preserved as static text.'],
      parserVersion: this.PARSER_VERSION,
      connectorUsed: 'embedded_payload',
    };
  }
}
