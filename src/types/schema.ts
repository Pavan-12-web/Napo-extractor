/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProviderId = 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'meta' | 'perplexity';

export type ConnectorType =
  | 'structured_api'
  | 'embedded_payload'
  | 'gemini_url_context'
  | 'browser_extension'
  | 'manual_paste';

export type ExtractionStatus =
  | 'idle'
  | 'detecting_provider'
  | 'connecting'
  | 'retrieving'
  | 'waiting_rendered'
  | 'user_action_required'
  | 'parsing'
  | 'validating'
  | 'complete'
  | 'partial'
  | 'private_or_expired'
  | 'provider_unavailable'
  | 'parser_update_required'
  | 'error';

export interface Citation {
  number: number;
  title?: string;
  url?: string;
  snippet?: string;
}

export interface AttachmentReference {
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  unretrievableNotice?: string;
}

export interface ArtifactReference {
  identifier: string;
  title: string;
  type: string;
  language?: string;
  content: string;
  isInteractiveWarning?: string;
}

export interface NormalizedMessage {
  id: string;
  role: 'user' | 'assistant';
  author: string;
  content: string;
  format: 'markdown';
  createdAt: string | null;
  citations: Citation[];
  attachments: AttachmentReference[];
  artifacts: ArtifactReference[];
}

export interface NormalizedConversation {
  extractionStatus: 'complete' | 'partial' | 'error';
  platform: ProviderId | string;
  sourceUrl: string;
  shareId: string;
  title: string;
  model: string | null;
  updatedAt: string | null;
  messages: NormalizedMessage[];
  warnings: string[];
  parserVersion: string;
  connectorUsed?: ConnectorType;
  rawSourceSnippet?: string;
}

export interface ProviderCapability {
  id: ProviderId;
  name: string;
  version: string;
  health: 'healthy' | 'degraded' | 'blocked_for_direct_fetch';
  urlPatterns: RegExp[];
  exampleUrl: string;
  capabilities: {
    directFetch: boolean;
    structuredData: boolean;
    geminiUrlContext: boolean;
    browserExtension: boolean;
  };
  supportedContentTypes: string[];
  knownLimitations: string[];
}
