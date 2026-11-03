/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import dns from 'dns/promises';
import { extractWithGeminiUrlContext } from './geminiUrlContext';

const ALLOWED_HOSTNAMES = new Set([
  'chatgpt.com',
  'www.chatgpt.com',
  'chat.openai.com',
  'share.gemini.google',
  'gemini.google.com',
  'bard.google.com',
  'claude.ai',
  'grok.com',
  'x.ai',
  'meta.ai',
  'www.meta.ai',
  'perplexity.ai',
  'www.perplexity.ai',
]);

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'si',
  'fbclid',
  'gclid',
  's',
];

export interface FetchResult {
  success: boolean;
  status:
    | 'ok'
    | 'bot_blocked'
    | 'js_required'
    | 'private_or_deleted'
    | 'invalid_host'
    | 'ssrf_blocked'
    | 'timeout'
    | 'error';
  statusCode?: number;
  finalUrl?: string;
  html?: string;
  jsonData?: any;
  error?: string;
  geminiExtractedData?: any;
}

function isPrivateIp(ip: string): boolean {
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:')) {
    return true;
  }
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length === 4) {
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
  }
  return false;
}

function sanitizeUrl(urlString: string): URL {
  const parsed = new URL(urlString);
  for (const p of TRACKING_PARAMS) {
    parsed.searchParams.delete(p);
  }
  return parsed;
}

async function validateHostSafe(parsedUrl: URL): Promise<{ safe: boolean; error?: string }> {
  const hostname = parsedUrl.hostname.toLowerCase();

  if (!ALLOWED_HOSTNAMES.has(hostname)) {
    return {
      safe: false,
      error: `Hostname "${hostname}" is not supported. Supported platforms: ChatGPT, Claude, Gemini, Grok, Meta AI, Perplexity.`,
    };
  }

  try {
    const lookup = await dns.lookup(hostname);
    if (isPrivateIp(lookup.address)) {
      return {
        safe: false,
        error: `Host resolved to forbidden private IP address: ${lookup.address}`,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'DNS lookup failed';
    return { safe: false, error: `DNS lookup failed for ${hostname}: ${msg}` };
  }

  return { safe: true };
}

/**
 * Executes a safe, bounded HTTP request following redirects up to 5 hops.
 */
async function executeHttpRequest(
  targetUrl: string,
  acceptHeader = 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5'
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string; finalUrl: string }> {
  let currentUrlString = targetUrl;
  const maxHops = 5;
  const timeoutMs = 8000;
  const maxBytes = 5 * 1024 * 1024; // 5 MB

  for (let hop = 0; hop < maxHops; hop++) {
    const parsedUrl = sanitizeUrl(currentUrlString);
    const hostCheck = await validateHostSafe(parsedUrl);
    if (!hostCheck.safe) {
      throw new Error(hostCheck.error);
    }

    const response = await new Promise<{
      statusCode: number;
      headers: http.IncomingHttpHeaders;
      body: string;
    }>((resolve, reject) => {
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.get(
        parsedUrl.toString(),
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NapoExtractor/2.0',
            Accept: acceptHeader,
          },
          timeout: timeoutMs,
        },
        res => {
          let receivedBytes = 0;
          const chunks: Buffer[] = [];

          res.on('data', (chunk: Buffer) => {
            receivedBytes += chunk.length;
            if (receivedBytes > maxBytes) {
              res.destroy();
              reject(new Error('Response exceeded 5MB size limit'));
              return;
            }
            chunks.push(chunk);
          });

          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 200,
              headers: res.headers,
              body: Buffer.concat(chunks).toString('utf-8'),
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
      req.on('error', err => reject(err));
    });

    // Follow redirects
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      currentUrlString = new URL(response.headers.location, parsedUrl).toString();
      continue;
    }

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
      finalUrl: parsedUrl.toString(),
    };
  }

  throw new Error('Exceeded maximum redirect limit (5 hops).');
}

/**
 * Fetches public share link through the 5-tier connector pipeline.
 */
export async function fetchShareLink(rawUrl: string): Promise<FetchResult> {
  let currentUrlString = rawUrl.trim();
  if (!currentUrlString.startsWith('http://') && !currentUrlString.startsWith('https://')) {
    currentUrlString = 'https://' + currentUrlString;
  }

  // Tier 1: Claude Chat Snapshot API check
  if (currentUrlString.includes('claude.ai/share/') || currentUrlString.includes('claude.ai/chat/')) {
    const uuidMatch = currentUrlString.match(/claude\.ai\/(share|chat)\/([0-9a-fA-F-]{36})/i);
    if (uuidMatch) {
      const uuid = uuidMatch[2];
      try {
        const snapshotUrl = `https://claude.ai/api/chat_snapshots/${uuid}`;
        const snapshotRes = await executeHttpRequest(snapshotUrl, 'application/json');
        if (snapshotRes.statusCode === 200 && snapshotRes.body.trim().startsWith('{')) {
          const json = JSON.parse(snapshotRes.body);
          if (json && (json.chat_messages || json.messages || json.conversation)) {
            return {
              success: true,
              status: 'ok',
              statusCode: 200,
              finalUrl: currentUrlString,
              jsonData: json,
            };
          }
        }
      } catch {
        // Fall through to public HTML fetch
      }
    }
  }

  // Tier 2: Public page fetch & embedded data parser
  try {
    const pageRes = await executeHttpRequest(currentUrlString);

    if (pageRes.statusCode === 404 || pageRes.statusCode === 410) {
      return {
        success: false,
        status: 'private_or_deleted',
        statusCode: pageRes.statusCode,
        error: 'This public share link appears to be deleted, expired, or private.',
      };
    }

    const bodyLower = pageRes.body.toLowerCase();

    // Check Cloudflare bot detection
    if (
      pageRes.statusCode === 403 ||
      bodyLower.includes('cf-chl-bypass') ||
      bodyLower.includes('just a moment...') ||
      bodyLower.includes('attention required! | cloudflare')
    ) {
      return {
        success: false,
        status: 'bot_blocked',
        statusCode: pageRes.statusCode,
        error: 'Cloudflare bot protection blocked automated URL fetching for this platform.',
      };
    }

    // Gemini dynamic SPA shell check
    const isGemini = pageRes.finalUrl.includes('gemini.google');
    if (isGemini) {
      const hasMessagesInHtml =
        pageRes.body.includes('user-query') ||
        pageRes.body.includes('model-response') ||
        pageRes.body.includes('data-test-id="user-query"');

      if (!hasMessagesInHtml) {
        // Try Tier 3: Gemini 3.8 Flash URL Context opportunistic extraction
        const geminiContext = await extractWithGeminiUrlContext(currentUrlString, pageRes.body);
        if (geminiContext && geminiContext.messages.length > 0) {
          return {
            success: true,
            status: 'ok',
            finalUrl: pageRes.finalUrl,
            geminiExtractedData: geminiContext,
          };
        }

        return {
          success: false,
          status: 'js_required',
          statusCode: pageRes.statusCode,
          error: 'This conversation needs to be opened through your browser. We’ll continue automatically after it loads.',
        };
      }
    }

    // Claude dynamic SPA shell check if snapshot API was not reached
    const isClaude = pageRes.finalUrl.includes('claude.ai');
    if (isClaude && !pageRes.body.includes('font-user-message') && !pageRes.body.includes('chat_messages')) {
      return {
        success: false,
        status: 'js_required',
        statusCode: pageRes.statusCode,
        error: 'This conversation needs to be opened through your browser. We’ll continue automatically after it loads.',
      };
    }

    return {
      success: true,
      status: 'ok',
      statusCode: pageRes.statusCode,
      finalUrl: pageRes.finalUrl,
      html: pageRes.body,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed';
    return {
      success: false,
      status: 'error',
      error: `Failed to retrieve public conversation: ${msg}`,
    };
  }
}
