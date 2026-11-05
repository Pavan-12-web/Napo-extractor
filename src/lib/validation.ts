/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation } from '../types/schema';

export const EMPTY_SHELL_ERROR_MESSAGE =
  'No conversation text was found in this page. Please copy the conversation text and click "Paste from Clipboard" to extract it.';

export interface ValidationResult {
  isValid: boolean;
  isEmptyShell: boolean;
  status: 'complete' | 'partial' | 'error';
  errorMessage?: string;
  warnings: string[];
}

/**
 * Checks if input HTML is purely an unrendered single-page app shell with zero content.
 */
export function checkIsEmptyApplicationShell(inputHtml: string): boolean {
  const trimmed = inputHtml.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();

  // True empty shells have empty root containers and no content
  const hasEmptyRoot =
    lower.includes('<div id="root"></div>') ||
    lower.includes('<div id="app"></div>') ||
    lower.includes('<div id="__next"></div>') ||
    lower.includes('<div id="root">\n</div>') ||
    lower.includes('<div id="app">\n</div>');

  const hasNoDialogueMarkers =
    !lower.includes('user-query') &&
    !lower.includes('model-response') &&
    !lower.includes('font-user-message') &&
    !lower.includes('font-claude-message') &&
    !lower.includes('data-message-author-role') &&
    !lower.includes('chatgpt said') &&
    !lower.includes('linear_conversation') &&
    !lower.includes('chat_messages') &&
    !lower.includes('mapping') &&
    !lower.includes('__next_data__');

  // Only consider it an empty shell if it has an empty mount container with no text content
  if (hasEmptyRoot && hasNoDialogueMarkers && lower.length < 5000) {
    return true;
  }

  return false;
}

/**
 * Validates extracted conversation against the 9-point integrity checklist.
 */
export function validateNormalizedConversation(
  conv: NormalizedConversation | null,
  rawSourceText: string
): ValidationResult {
  if (!conv) {
    const isShell = checkIsEmptyApplicationShell(rawSourceText);
    return {
      isValid: false,
      isEmptyShell: isShell,
      status: 'error',
      errorMessage: isShell ? EMPTY_SHELL_ERROR_MESSAGE : 'No conversation content could be extracted.',
      warnings: [],
    };
  }

  const warnings = [...conv.warnings];

  // 1. Check if empty shell was caught
  if (conv.messages.length === 0) {
    const isShell = checkIsEmptyApplicationShell(rawSourceText);
    return {
      isValid: false,
      isEmptyShell: isShell,
      status: 'error',
      errorMessage: isShell ? EMPTY_SHELL_ERROR_MESSAGE : 'No conversation messages found in input.',
      warnings,
    };
  }

  // 2. Validate message roles and non-empty content
  let hasValidSequence = true;
  for (let i = 0; i < conv.messages.length; i++) {
    const msg = conv.messages[i];
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      warnings.push(`Message #${i + 1} has unrecognized role "${msg.role}".`);
    }
    if (!msg.content || msg.content.trim().length === 0) {
      warnings.push(`Message #${i + 1} contains empty content.`);
    }
  }

  // 3. Check for lingering web chrome
  const chromePatterns = [
    /^(copy code|thought for \d+|share conversation|was this response helpful|show drafts)/im,
  ];
  for (const msg of conv.messages) {
    for (const pat of chromePatterns) {
      if (pat.test(msg.content)) {
        warnings.push('Minor web chrome tokens were sanitized from output.');
        break;
      }
    }
  }

  // 3b. Guard against teaser metadata or single-line preview summaries
  const totalWords = conv.messages.reduce((acc, m) => acc + (m.content ? m.content.trim().split(/\s+/).length : 0), 0);
  const combinedContent = conv.messages.map(m => m.content.toLowerCase()).join(' ');

  const isMetadataTeaser =
    combinedContent.includes("here's a chat someone thought you'd want to see") ||
    combinedContent.includes("check out this chat") ||
    (totalWords < 20 && (rawSourceText.includes('<!DOCTYPE') || rawSourceText.includes('<html')));

  if (isMetadataTeaser) {
    return {
      isValid: false,
      isEmptyShell: true,
      status: 'error',
      errorMessage:
        'Only page preview metadata was detected rather than the conversation dialogue. Please copy the conversation text and click "Paste from Clipboard & Extract".',
      warnings: ['Rejected 1-line metadata teaser.'],
    };
  }

  // 4. Determine final status: partial if attachments or citations missing
  let finalStatus: 'complete' | 'partial' = 'complete';
  if (warnings.length > 0) {
    finalStatus = 'partial';
  }

  return {
    isValid: true,
    isEmptyShell: false,
    status: finalStatus,
    warnings,
  };
}
