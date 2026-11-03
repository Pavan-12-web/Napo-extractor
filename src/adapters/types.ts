/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, PlatformId } from '../types/extractor';

export interface ParseResult {
  messages: ChatMessage[];
  rawText: string;
  uncaptured: {
    images: number;
    attachments: number;
    canvases: number;
  };
  truncationDetected: boolean;
}

export interface PlatformAdapter {
  id: PlatformId;
  name: string;
  status: 'active' | 'awaiting_sample';
  exampleUrl: string;
  urlNotice?: string;
  canHandle(url: string): boolean;
  parseHtml(html: string): ParseResult;
  parseText(text: string): ParseResult;
}
