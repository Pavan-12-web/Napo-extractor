/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation, NormalizedMessage, ProviderId } from '../types/schema';
import { ChatGptConnector } from '../connectors/chatgpt';
import { ClaudeConnector } from '../connectors/claude';
import { GeminiConnector, PerplexityConnector, GrokConnector, MetaAiConnector } from '../connectors/others';
import { validateNormalizedConversation, checkIsEmptyApplicationShell, EMPTY_SHELL_ERROR_MESSAGE } from './validation';
import { auditAndSanitizePrivacy } from './privacyAudit';
import { generateContentSummary } from './summary';
import { sanitizeCleanText, nodeToCleanMarkdown } from '../adapters/htmlUtils';

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

    // 5. Try generic HTML dialogue & meta tag extraction
    if (!conversation) {
      conversation = extractGenericHtmlConversation(trimmed, sourceUrl || 'pasted-html');
    }

    // Guard: If the input is an HTML document or application shell and structured HTML extraction
    // failed to yield conversation turns, DO NOT fall back to stream text parsing (which would
    // wrap the raw HTML source code into a User message).
    if (!conversation && (trimmed.startsWith('<!DOCTYPE') || /<(html|head|body|script)[^>]*>/i.test(trimmed))) {
      return {
        success: false,
        conversation: null,
        errorMessage: EMPTY_SHELL_ERROR_MESSAGE,
        isEmptyShell: true,
        warnings: ['HTML document contained no extractable conversation messages.'],
      };
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
    // Match standalone or inline user label: e.g. "User:", "**User:**", "User: Hello"
    const userMatch = trimmed.match(/^(?:\*\*)?(?:user|human|you)(?:\*\*)?:\s*(.*)$/i);
    if (userMatch) {
      flush();
      currentRole = 'user';
      if (userMatch[1]) {
        currentLines.push(userMatch[1]);
      }
      continue;
    }

    // Match standalone or inline assistant label: e.g. "Assistant:", "**Assistant:**", "Assistant: Hello"
    const assistantMatch = trimmed.match(/^(?:\*\*)?(?:assistant|chatgpt|claude|gemini|grok|meta(?:\s*ai)?|perplexity)(?:\*\*)?:\s*(.*)$/i);
    if (assistantMatch) {
      flush();
      currentRole = 'assistant';
      if (assistantMatch[1]) {
        currentLines.push(assistantMatch[1]);
      }
      continue;
    }

    currentLines.push(line);
  }
  flush();

  if (messages.length === 0 && text.trim()) {
    // If text looks like raw HTML markup, do not push it as a User turn
    if (!/<!DOCTYPE|<html|<head|<body|<script/i.test(text)) {
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

/**
 * Fallback parser for generic HTML containing conversation turns or metadata descriptions.
 */
function extractGenericHtmlConversation(html: string, sourceUrl: string): NormalizedConversation | null {
  try {
    if (typeof DOMParser === 'undefined') return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove scripts, styles, and chrome elements
    doc.querySelectorAll('script, style, noscript, svg, nav, header, footer, iframe').forEach(el => el.remove());

    const candidates = Array.from(
      doc.querySelectorAll(
        '[class*="message"], [class*="turn"], [class*="prompt"], [class*="response"], [class*="bubble"], [class*="chat-item"], [data-role], article'
      )
    );

    const messages: NormalizedMessage[] = [];

    if (candidates.length >= 2) {
      candidates.forEach((el, idx) => {
        const text = sanitizeCleanText(nodeToCleanMarkdown(el));
        if (text && text.length > 5) {
          const isUser = /user|human|prompt|query/i.test(el.className + ' ' + (el.getAttribute('data-role') || ''));
          messages.push({
            id: `msg-gen-${idx + 1}`,
            role: isUser ? 'user' : 'assistant',
            author: isUser ? 'User' : 'Assistant',
            content: text,
            format: 'markdown',
            createdAt: null,
            citations: [],
            attachments: [],
            artifacts: [],
          });
        }
      });
    }

    // Never treat meta tags (og:description, etc.) as conversation turns.
    // Genuine conversations must have real message elements or structured data.
    if (messages.length === 0) return null;

    return {
      extractionStatus: 'complete',
      platform: 'ai_chat',
      sourceUrl,
      shareId: '',
      title: doc.title?.trim() || 'Extracted Conversation',
      model: null,
      updatedAt: null,
      messages,
      warnings: [],
      parserVersion: '2.1.0-generic',
      connectorUsed: 'embedded_payload',
    };
  } catch {
    return null;
  }
}
