/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedConversation } from '../types/schema';

export interface ExtensionBridgeStatus {
  isAvailable: boolean;
  version?: string;
}

/**
 * Handles communication between Napo Extractor web app and the installed Companion Extension.
 */
export class ExtensionBridge {
  private static isExtensionInstalled = false;

  static init() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'NAPO_EXTENSION_PING_ACK') {
        this.isExtensionInstalled = true;
      }
    });

    // Send discovery ping
    window.postMessage({ type: 'NAPO_EXTENSION_PING' }, '*');
  }

  static checkAvailability(): boolean {
    return this.isExtensionInstalled;
  }

  static async requestExtraction(url: string): Promise<NormalizedConversation | null> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'NAPO_EXTRACT_RESPONSE') {
          window.removeEventListener('message', handler);
          const raw = event.data.data;
          if (raw && raw.messages && raw.messages.length > 0) {
            resolve({
              extractionStatus: 'complete',
              platform: raw.platform || 'chat',
              sourceUrl: url,
              shareId: url.split('/').pop()?.split('?')[0] || '',
              title: raw.title || 'Extracted Conversation',
              model: null,
              updatedAt: null,
              messages: raw.messages,
              warnings: ['Extracted locally via Companion Extension from rendered session.'],
              parserVersion: '2.0.0-ext',
              connectorUsed: 'browser_extension',
            });
          } else {
            resolve(null);
          }
        }
      };

      window.addEventListener('message', handler);

      // Timeout after 8 seconds
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(null);
      }, 8000);

      window.postMessage({ type: 'NAPO_EXTRACT_REQUEST', url }, '*');
    });
  }
}
