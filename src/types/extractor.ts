/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlatformId = 'chatgpt' | 'gemini' | 'claude' | 'grok' | 'meta' | 'perplexity';

export type InputMode = 'link' | 'bookmarklet' | 'paste';

export type ExportFormat = 'txt' | 'md' | 'json' | 'html' | 'pdf';

export type ProgressStage = 'idle' | 'connect' | 'load' | 'extract' | 'done' | 'error';

export interface ChatMessage {
  role: 'User' | 'Assistant';
  text: string;
}

export interface DualCheckResult {
  primaryMethodChars: number;
  secondaryMethodChars: number;
  difference: number;
  isMatched: boolean;
  notes: string;
}

export interface IntegrityReport {
  status: 'Verified' | 'Partial' | 'Failed';
  failureReasons: string[];
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  characterCount: number;
  wordCount: number;
  lineCount: number;
  codeBlocksCount: number;
  tablesCount: number;
  listsCount: number;
  headingsCount: number;
  linksCount: number;
  rootSha256: string;
  messageHashes: string[];
  firstMessageSnippet: { start: string; end: string };
  lastMessageSnippet: { start: string; end: string };
  uncapturedElements: {
    images: number;
    attachments: number;
    canvases: number;
  };
  dualCheck: DualCheckResult;
  truncationDetected: boolean;
  lastMessageReached: boolean;
}

export interface ContentSummary {
  turnCount: number;
  firstUserSnippet: string;
  topKeywords: { word: string; count: number }[];
  detectedLanguages: string[];
  headingsFound: string[];
  lastAssistantConclusion: string;
}

export interface ExtractionResult {
  platform: PlatformId;
  messages: ChatMessage[];
  sourceRawText: string;
  sourceHtml?: string;
  integrity: IntegrityReport;
  summary: ContentSummary;
  privacy: import('../lib/privacyAudit').PrivacyAuditResult;
}

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  status: 'active' | 'awaiting_sample';
  supportedUrlPatterns: string[];
  exampleUrl: string;
  notes: string;
}
