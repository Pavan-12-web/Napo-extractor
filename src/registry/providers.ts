/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProviderCapability, ProviderId } from '../types/schema';

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderCapability> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT (OpenAI)',
    version: '2.4.0',
    health: 'blocked_for_direct_fetch',
    urlPatterns: [
      /^https?:\/\/(www\.)?chatgpt\.com\/share\/[a-zA-Z0-9_-]+/i,
      /^https?:\/\/(www\.)?chatgpt\.com\/s\/cx_[a-zA-Z0-9_-]+/i,
      /^https?:\/\/(www\.)?chatgpt\.com\/s\/[a-zA-Z0-9_-]+/i,
      /^https?:\/\/chat\.openai\.com\/share\/[a-zA-Z0-9_-]+/i,
    ],
    exampleUrl: 'https://chatgpt.com/s/cx_6ae88f2e4ab08191a6ef4ecf15378398',
    capabilities: {
      directFetch: false,
      structuredData: true,
      browserExtension: true,
    },
    supportedContentTypes: ['markdown', 'code_blocks', 'tables', 'citations', 'attachments'],
    knownLimitations: [
      'Cloudflare blocks automated direct curl/fetch; requires extension or paste.',
      'Raw images and binary attachments are referenced but cannot be downloaded without authenticated session.',
      'Internal reasoning ("Thought for X seconds") and system prompts are excluded by default.',
    ],
  },

  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    version: '2.2.0',
    health: 'healthy',
    urlPatterns: [
      /^https?:\/\/(www\.)?claude\.ai\/share\/[0-9a-fA-F-]{36}/i,
      /^https?:\/\/(www\.)?claude\.ai\/chat\/[0-9a-fA-F-]{36}/i,
    ],
    exampleUrl: 'https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874',
    capabilities: {
      directFetch: true,
      structuredData: true,
      browserExtension: true,
    },
    supportedContentTypes: ['markdown', 'artifacts', 'code_blocks', 'tables', 'extracted_documents'],
    knownLimitations: [
      'HTML share pages are client-side SPA shells; public snapshot API is used when accessible.',
      'Interactive Artifacts are exported as clean source code, not executable applications.',
      'Images require user authentication and cannot be retrieved over public unauthenticated endpoints.',
    ],
  },

  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    version: '2.1.0',
    health: 'blocked_for_direct_fetch',
    urlPatterns: [
      /^https?:\/\/share\.gemini\.google\/[a-zA-Z0-9_-]+/i,
      /^https?:\/\/gemini\.google\.com\/share\/[a-zA-Z0-9_-]+/i,
      /^https?:\/\/bard\.google\.com\/share\/[a-zA-Z0-9_-]+/i,
    ],
    exampleUrl: 'https://share.gemini.google/D96t5BUjuFVg',
    capabilities: {
      directFetch: false,
      structuredData: true,
      browserExtension: true,
    },
    supportedContentTypes: ['markdown', 'code_blocks', 'tables', 'lists'],
    knownLimitations: [
      'HTTP response is an empty application shell without rendered DOM messages.',
      'Surrounding image context is preserved, but the image asset is not included unless separately provided.',
    ],
  },

  grok: {
    id: 'grok',
    name: 'Grok (xAI)',
    version: '1.2.0',
    health: 'blocked_for_direct_fetch',
    urlPatterns: [
      /^https?:\/\/(www\.)?grok\.com\/share\/[a-zA-Z0-9_-]+/i,
      /^https?:\/\/(www\.)?x\.ai\/share\/[a-zA-Z0-9_-]+/i,
    ],
    exampleUrl: 'https://grok.com/share/grok_sample_link',
    capabilities: {
      directFetch: false,
      structuredData: false,
      browserExtension: true,
    },
    supportedContentTypes: ['markdown', 'code_blocks', 'tables'],
    knownLimitations: [
      'Protected by strict JavaScript challenges; requires in-browser extension or paste.',
    ],
  },

  meta: {
    id: 'meta',
    name: 'Meta AI',
    version: '1.1.0',
    health: 'blocked_for_direct_fetch',
    urlPatterns: [
      /^https?:\/\/(www\.)?meta\.ai\/share\/[a-zA-Z0-9_-]+/i,
      /^https?:\/\/(www\.)?meta\.ai\/c\/[a-zA-Z0-9_-]+/i,
    ],
    exampleUrl: 'https://meta.ai/share/meta_sample_link',
    capabilities: {
      directFetch: false,
      structuredData: false,
      browserExtension: true,
    },
    supportedContentTypes: ['markdown', 'code_blocks'],
    knownLimitations: [
      'URL extraction is unavailable without authenticated session; use browser extension or paste.',
    ],
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity AI',
    version: '1.3.0',
    health: 'degraded',
    urlPatterns: [
      /^https?:\/\/(www\.)?perplexity\.ai\/search\/[a-zA-Z0-9_-]+/i,
      /^https?:\/\/(www\.)?perplexity\.ai\/page\/[a-zA-Z0-9_-]+/i,
    ],
    exampleUrl: 'https://perplexity.ai/search/sample_query',
    capabilities: {
      directFetch: false,
      structuredData: true,
      browserExtension: true,
    },
    supportedContentTypes: ['markdown', 'citations', 'sources'],
    knownLimitations: [
      'Source URLs and clickable citations may be stripped or truncated if DOM citation attributes are incomplete.',
    ],
  },
};

export function detectProvider(url: string): ProviderCapability | null {
  const trimmed = url.trim();
  for (const provider of Object.values(PROVIDER_REGISTRY)) {
    for (const pattern of provider.urlPatterns) {
      if (pattern.test(trimmed)) {
        return provider;
      }
    }
  }
  return null;
}
