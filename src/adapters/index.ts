/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformId } from '../types/extractor';
import { chatGptAdapter } from './chatgpt';
import { claudeAdapter } from './claude';
import { geminiAdapter } from './gemini';
import { grokAdapter } from './grok';
import { metaAdapter } from './meta';
import { perplexityAdapter } from './perplexity';
import { PlatformAdapter } from './types';

export const adapters: PlatformAdapter[] = [
  chatGptAdapter,
  geminiAdapter,
  claudeAdapter,
  grokAdapter,
  metaAdapter,
  perplexityAdapter,
];

export function getAdapterByUrl(url: string): PlatformAdapter | null {
  for (const adapter of adapters) {
    if (adapter.canHandle(url)) {
      return adapter;
    }
  }
  return null;
}

export function getAdapterById(id: PlatformId): PlatformAdapter {
  const match = adapters.find(a => a.id === id);
  if (!match) {
    return chatGptAdapter;
  }
  return match;
}

export function detectPlatformFromUrl(url: string): PlatformId | null {
  const adapter = getAdapterByUrl(url);
  return adapter ? adapter.id : null;
}
