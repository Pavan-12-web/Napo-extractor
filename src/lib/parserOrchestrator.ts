/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation, ProviderId } from '../types/schema';
import { ChatGptConnector } from '../connectors/chatgpt';
import { ClaudeConnector } from '../connectors/claude';
import { GeminiConnector, PerplexityConnector, GrokConnector, MetaAiConnector } from '../connectors/others';
import { validateNormalizedConversation, checkIsEmptyApplicationShell, EMPTY_SHELL_ERROR_MESSAGE } from './validation';
import { auditAndSanitizePrivacy } from './privacyAudit';
import { generateContentSummary } from './summary';
import { sanitizeCleanText } from '../adapters/htmlUtils';

export interface ParseOrchestrationResult {
  success: boolean;
  conversation: NormalizedConversation | null;
  errorMessage?: string;
  isEmptyShell: boolean;
  warnings: string[];
}

/**
 * Universal client-side parsing orchestrator.
 * Accepts raw text, Markdown, JSON, or saved HTML and normalizes into common schema.
 */
export function orchestrateParse(
  rawInput: string,
  sourceUrl: string = ''
): ParseOrchestrationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      success: false,
      conversation: null,
      errorMessage: 'Input is empty.',
      isEmptyShell: false,
      warnings: [],
    };
  }

  // Check 1: Empty application shell detection
  if (checkIsEmptyApplicationShell(trimmed)) {
    return {
      success: false,
      conversation: null,
      errorMessage: EMPTY_SHELL_ERROR_MESSAGE,
      isEmptyShell: true,
      warnings: [],
    };
  }

  let conversation: NormalizedConversation | null = null;

  // Strategy A: JSON format check (Claude snapshot or custom exported JSON)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      // Try Claude chat snapshot
      conversation = ClaudeConnector.parseSnapshotJson(parsedJson, sourceUrl || 'https://claude.ai/share/snapshot');

      // Try ChatGPT mapping JSON
      if (!conversation && parsedJson.mapping) {
        conversation = ChatGptConnector.normalizeFromMapping(
          parsedJson.mapping,
          parsedJson.title || '',
          parsedJson.model?.slug || null,
          sourceUrl || 'https://chatgpt.com/share/json'
        );
      }
    } catch {
      // Not JSON, continue to next strategy
    }
  }

  // Strategy B: HTML parsing
  if (!conversation && /<[a-z][\s\S]*>/i.test(trimmed)) {
    // 1. Try ChatGPT React Flight / __NEXT_DATA__ / DOM
    conversation = ChatGptConnector.parseRenderedHtml(trimmed, sourceUrl || 'https://chatgpt.com/share/pasted');

    // 2. Try Claude Snapshot / DOM
    if (!conversation) {
      conversation = ClaudeConnector.parseRenderedHtml(trimmed, sourceUrl || 'https://claude.ai/share/pasted');
    }

    // 3. Try Gemini DOM
    if (!conversation) {
      conversation = GeminiConnector.parse(trimmed, sourceUrl || 'https://share.gemini.google/pasted');
    }

    // 4. Try Perplexity DOM
    if (!conversation) {
      conversation = PerplexityConnector.parse(trimmed, sourceUrl || 'https://perplexity.ai/search/pasted');
    }
  }

  // Strategy C: Plain Text / Markdown stream parsing
  if (!conversation) {
    conversation = parseStreamText(trimmed, sourceUrl);
  }

  // Validate the normalized conversation
  const validation = validateNormalizedConversation(conversation, trimmed);

  if (!validation.isValid || !conversation) {
    return {
      success: false,
      conversation: null,
      errorMessage: validation.errorMessage || 'Unable to parse valid conversation turns.',
      isEmptyShell: validation.isEmptyShell,
      warnings: validation.warnings,
    };
  }

  // Apply privacy non-containment audit
  auditAndSanitizePrivacy(
    conversation.messages.map(m => ({ role: m.role === 'user' ? 'User' : 'Assistant', text: m.content })),
    trimmed
  );

  return {
    success: true,
    conversation: {
      ...conversation,
      extractionStatus: validation.status,
      warnings: Array.from(new Set([...conversation.warnings, ...validation.warnings])),
      rawSourceSnippet: trimmed.slice(0, 500),
    },
    isEmptyShell: false,
    warnings: validation.warnings,
  };
}

/**
 * Fallback parser for plain text and Markdown dialogues.
 */
function parseStreamText(text: string, sourceUrl: string): NormalizedConversation {
  const lines = text.split(/\r?\n/);
  const messages: any[] = [];
  let currentRole: 'user' | 'assistant' = 'user';
  let currentLines: string[] = [];

  const flush = () => {
    if (currentLines.length > 0) {
      const content = sanitizeCleanText(currentLines.join('\n'));
      if (content) {
        messages.push({
          id: `msg-${messages.length + 1}`,
          role: currentRole,
          author: currentRole === 'user' ? 'User' : 'Assistant',
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
    const trimmed = line.trim();
    if (/^(user|human|you):?$/i.test(trimmed)) {
      flush();
      currentRole = 'user';
      continue;
    } else if (/^(assistant|chatgpt|claude|gemini|grok|meta|perplexity):?$/i.test(trimmed)) {
      flush();
      currentRole = 'assistant';
      continue;
    }
    currentLines.push(line);
  }
  flush();

  if (messages.length === 0 && text.trim()) {
    messages.push({
      id: 'msg-1',
      role: 'user',
      author: 'User',
      content: sanitizeCleanText(text),
      format: 'markdown',
      createdAt: null,
      citations: [],
      attachments: [],
      artifacts: [],
    });
  }

  return {
    extractionStatus: messages.length > 0 ? 'complete' : 'error',
    platform: 'ai_chat',
    sourceUrl: sourceUrl || 'pasted-text',
    shareId: '',
    title: 'Extracted Conversation',
    model: null,
    updatedAt: null,
    messages,
    warnings: [],
    parserVersion: '2.0.0-stream',
    connectorUsed: 'manual_paste',
  };
}
