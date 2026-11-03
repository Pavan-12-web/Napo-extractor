/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, IntegrityReport } from '../types/extractor';

/**
 * Computes standard SHA-256 hex string using Web Crypto API.
 */
export async function computeSha256(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Runs independent Secondary Extraction Method (Method B):
 * Traverses raw input via line/regex stream parser to compute independent message and character count.
 */
function runSecondaryExtractionMethod(sourceText: string): { messagesCount: number; charTotal: number } {
  const lines = sourceText.split(/\r?\n/);
  let msgCount = 0;
  let charSum = 0;
  let currentBuffer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(user|human|you|assistant|chatgpt|gemini|claude|meta|perplexity):?$/i.test(trimmed)) {
      if (currentBuffer.trim()) {
        msgCount++;
        charSum += currentBuffer.trim().length;
        currentBuffer = '';
      }
    } else {
      currentBuffer += line + '\n';
    }
  }

  if (currentBuffer.trim()) {
    msgCount++;
    charSum += currentBuffer.trim().length;
  }

  // If no structural markers matched, treat entire text as single message block
  if (msgCount === 0 && sourceText.trim()) {
    msgCount = 1;
    charSum = sourceText.trim().length;
  }

  return { messagesCount: msgCount, charTotal: charSum };
}

export async function generateIntegrityReport(
  messages: ChatMessage[],
  sourceRawText: string,
  uncaptured: { images: number; attachments: number; canvases: number },
  truncationDetected: boolean
): Promise<IntegrityReport> {
  const userMessages = messages.filter(m => m.role === 'User').length;
  const assistantMessages = messages.filter(m => m.role === 'Assistant').length;
  const totalMessages = messages.length;

  const fullCleanText = messages.map(m => `${m.role}:\n${m.text}`).join('\n\n');
  const characterCount = fullCleanText.length;
  const wordCount = fullCleanText.trim() ? fullCleanText.trim().split(/\s+/).length : 0;
  const lineCount = fullCleanText.split(/\r?\n/).length;

  // Structural element counts across all messages
  let codeBlocksCount = 0;
  let tablesCount = 0;
  let listsCount = 0;
  let headingsCount = 0;
  let linksCount = 0;

  for (const msg of messages) {
    const text = msg.text;

    // Code blocks (``` ... ```)
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    if (codeBlocks) codeBlocksCount += codeBlocks.length;

    // Tables (| col | col | \n | --- | --- |)
    const tables = text.match(/\|[^\n]+\|\r?\n\|[-:\s|]+\|/g);
    if (tables) tablesCount += tables.length;

    // Lists (- item or 1. item)
    const lists = text.match(/^(\s*[-*+]|\s*\d+\.)\s+.+/gm);
    if (lists) listsCount += lists.length;

    // Headings (# Heading)
    const headings = text.match(/^#{1,6}\s+.+/gm);
    if (headings) headingsCount += headings.length;

    // Links ([text](url))
    const links = text.match(/\[[^\]]+\]\([^)]+\)/g);
    if (links) linksCount += links.length;
  }

  // Cryptographic Hashes
  const rootSha256 = await computeSha256(fullCleanText);
  const messageHashes: string[] = [];
  for (const msg of messages) {
    const mHash = await computeSha256(`${msg.role}:\n${msg.text}`);
    messageHashes.push(mHash);
  }

  // Snippets of first and last messages (150 chars each)
  const firstMsg = messages[0]?.text || '';
  const lastMsg = messages[messages.length - 1]?.text || '';

  const firstMessageSnippet = {
    start: firstMsg.slice(0, 150),
    end: firstMsg.length > 150 ? firstMsg.slice(-150) : firstMsg,
  };

  const lastMessageSnippet = {
    start: lastMsg.slice(0, 150),
    end: lastMsg.length > 150 ? lastMsg.slice(-150) : lastMsg,
  };

  // Cross-check 2 ways:
  // Method A (Primary): Extracted messages text total
  // Method B (Secondary): Independent line/pattern stream parser on source text
  const methodB = runSecondaryExtractionMethod(sourceRawText);
  const difference = Math.abs(characterCount - methodB.charTotal);
  const isMatched = difference === 0 || (totalMessages > 0 && difference < 20); // Minor difference accounted for speaker prefix normalization

  const lastMessageReached = !truncationDetected && messages.length > 0;

  // Determine overall status and failure/warning reasons
  const failureReasons: string[] = [];

  if (totalMessages === 0) {
    failureReasons.push('No conversation messages were detected in the source.');
  }

  if (truncationDetected) {
    failureReasons.push('Truncation indicator detected (possible lazy loading or show-more pagination).');
  }

  if (uncaptured.images > 0) {
    failureReasons.push(`${uncaptured.images} embedded image(s) could not be rendered as text.`);
  }

  if (uncaptured.attachments > 0) {
    failureReasons.push(`${uncaptured.attachments} file attachment(s) could not be converted to text.`);
  }

  if (uncaptured.canvases > 0) {
    failureReasons.push(`${uncaptured.canvases} dynamic interactive canvas/artifact(s) present in source.`);
  }

  let status: 'Verified' | 'Partial' | 'Failed' = 'Verified';

  if (totalMessages === 0) {
    status = 'Failed';
  } else if (
    truncationDetected ||
    uncaptured.images > 0 ||
    uncaptured.attachments > 0 ||
    uncaptured.canvases > 0 ||
    !isMatched
  ) {
    status = 'Partial';
  }

  return {
    status,
    failureReasons,
    totalMessages,
    userMessages,
    assistantMessages,
    characterCount,
    wordCount,
    lineCount,
    codeBlocksCount,
    tablesCount,
    listsCount,
    headingsCount,
    linksCount,
    rootSha256,
    messageHashes,
    firstMessageSnippet,
    lastMessageSnippet,
    uncapturedElements: uncaptured,
    dualCheck: {
      primaryMethodChars: characterCount,
      secondaryMethodChars: methodB.charTotal,
      difference,
      isMatched,
      notes: isMatched
        ? 'Dual-method character totals align within normalization tolerance.'
        : `Primary and secondary parsers differ by ${difference} characters.`,
    },
    truncationDetected,
    lastMessageReached,
  };
}
