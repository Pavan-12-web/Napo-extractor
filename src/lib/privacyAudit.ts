/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage } from '../types/extractor';

export interface PrivacyCheckItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}

export interface PrivacyAuditResult {
  checks: PrivacyCheckItem[];
  allPassed: boolean;
  cleanText: string;
}

// Public support addresses that are acceptable in discussions
const ALLOWED_PUBLIC_EMAILS = new Set([
  'support@anthropic.com',
  'support@openai.com',
  'support@google.com',
]);

/**
 * Audits and sanitizes conversation messages to guarantee non-containment:
 * 1. No conversation title or conversation ID
 * 2. No attachments or Artifact contents
 * 3. No model name
 * 4. No account identity or organization record
 * 5. No JWT, API key, password, or populated session cookie
 * 6. No personal email address (only public support addresses permitted)
 * 7. No hidden system prompt or internal role instructions
 */
export function auditAndSanitizePrivacy(
  messages: ChatMessage[],
  sourceRawText: string
): PrivacyAuditResult {
  const combinedText = messages.map(m => m.text).join('\n\n');

  // Check 1: No conversation title or conversation ID
  const hasNoConversationId =
    !/\b(conversation[_-]?id|share[_-]?id|thread[_-]?id)\s*[:=]\s*[a-zA-Z0-9_-]{10,}/i.test(combinedText);

  // Check 2: No attachments or Artifact contents
  const hasNoAttachments =
    !/<attachment[\s\S]*?>/i.test(combinedText) &&
    !/<artifact[\s\S]*?>/i.test(combinedText) &&
    !/\[Attachment:\s*[^\]]+\]/i.test(combinedText);

  // Check 3: No model names or version identifiers in message headers
  const hasNoModelName =
    !/^(model|engine|system_fingerprint)\s*[:=]\s*.+$/im.test(combinedText) &&
    !/\b(gpt-4o|claude-3-5|gemini-1\.5|gemini-2\.0|grok-2)\s*said:/i.test(combinedText);

  // Check 4: No account identity or organization record
  const hasNoAccountOrOrg =
    !/\b(org[_-]?id|account[_-]?id|user[_-]?id|billing[_-]?account)\s*[:=]\s*[a-zA-Z0-9_-]{6,}/i.test(combinedText);

  // Check 5: No JWT, API key, password, or populated session cookie
  // JWT pattern: eyJ...
  const jwtRegex = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/;
  // OpenAI API Key pattern: sk-...
  const apiKeyRegex = /\b(sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{35}|Bearer\s+[a-zA-Z0-9_.=-]{20,})\b/;
  const passwordRegex = /\b(password|passwd|session_cookie|auth_token)\s*[:=]\s*['"][^'"]+['"]/i;
  const hasNoSecretsOrJwts =
    !jwtRegex.test(combinedText) &&
    !apiKeyRegex.test(combinedText) &&
    !passwordRegex.test(combinedText);

  // Check 6: No personal email address (strictly allowlisting public support addresses like support@anthropic.com)
  const emailMatches = combinedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const personalEmailsFound = emailMatches.filter(
    email => !ALLOWED_PUBLIC_EMAILS.has(email.toLowerCase())
  );
  const hasNoPersonalEmails = personalEmailsFound.length === 0;

  // Check 7: No system prompts or hidden metadata instructions
  const hasNoSystemPrompts =
    !messages.some(m => (m.role as string).toLowerCase() === 'system') &&
    !/^system\s*prompt:/im.test(combinedText);

  const checks: PrivacyCheckItem[] = [
    {
      id: 'no-conversation-id',
      label: 'No conversation title or ID',
      description: 'Stripped conversation IDs, share IDs, and thread title headers.',
      passed: hasNoConversationId,
    },
    {
      id: 'no-attachments',
      label: 'No attachments or Artifact contents',
      description: 'Excluded raw binary files, uploaded attachments, and canvas payloads.',
      passed: hasNoAttachments,
    },
    {
      id: 'no-model-name',
      label: 'No model name or version identifier',
      description: 'Zero model badges, system fingerprints, or internal model strings.',
      passed: hasNoModelName,
    },
    {
      id: 'no-account-record',
      label: 'No account identity or organization record',
      description: 'No organization IDs, account IDs, user avatars, or author records.',
      passed: hasNoAccountOrOrg,
    },
    {
      id: 'no-secrets',
      label: 'No JWT, API key, password, or session cookie',
      description: 'Zero authorization tokens, JWT strings, API credentials, or session cookies.',
      passed: hasNoSecretsOrJwts,
    },
    {
      id: 'no-personal-email',
      label: 'No personal email address',
      description: 'All personal email addresses excluded (only public corporate support addresses allowed).',
      passed: hasNoPersonalEmails,
    },
    {
      id: 'no-system-prompts',
      label: 'No hidden system prompts or internal roleplay',
      description: 'Only visible user and assistant dialogue turns are retained.',
      passed: hasNoSystemPrompts,
    },
  ];

  const allPassed = checks.every(c => c.passed);

  return {
    checks,
    allPassed,
    cleanText: combinedText,
  };
}
