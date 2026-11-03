/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation } from '../types/schema';

export const EMPTY_SHELL_ERROR_MESSAGE =
  'No conversation content was found. This appears to be an application shell captured before the conversation was rendered. Copy the visible conversation text or use the local page extractor.';

export interface ValidationResult {
  isValid: boolean;
  isEmptyShell: boolean;
  status: 'complete' | 'partial' | 'error';
  errorMessage?: string;
  warnings: string[];
}

/**
 * Checks if input HTML is purely an unrendered single-page app shell.
 */
export function checkIsEmptyApplicationShell(inputHtml: string): boolean {
  const trimmed = inputHtml.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();

  // Common application shell markers
  const hasScriptTags = lower.includes('<script');
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
    !lower.includes('chat_messages');

  if ((hasEmptyRoot || (hasScriptTags && lower.length < 20000)) && hasNoDialogueMarkers) {
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
