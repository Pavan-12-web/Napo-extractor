/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { NormalizedConversation } from '../types/schema';

export async function extractWithGeminiUrlContext(
  targetUrl: string,
  pageContent: string
): Promise<NormalizedConversation | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a strict, lossless conversation extractor for public AI share pages.
Extract the exact, verbatim dialogue between the user and the assistant from the provided page content.
CRITICAL EXTRACTION RULES:
1. Do NOT summarize, rewrite, correct, infer, complete, or truncate any content.
2. Extract the exact words, markdown code fences, tables, and lists.
3. Every message must have a recognized role: "user" or "assistant".
4. Maintain the strict chronological order of the turns.
5. If the page is an empty application shell, login page, or has no conversation, return an empty messages array.

Page Target URL: ${targetUrl}
Page Content to Extract:
${pageContent.slice(0, 50000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            platform: { type: Type.STRING },
            messages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ['role', 'content'],
              },
            },
          },
          required: ['messages'],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    if (!parsed.messages || !Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return null;
    }

    const messages = parsed.messages
      .filter((m: any) => m.content && (m.role === 'user' || m.role === 'assistant'))
      .map((m: any, idx: number) => ({
        id: `gemini-url-ctx-${idx + 1}`,
        role: m.role as 'user' | 'assistant',
        author: m.role === 'user' ? 'User' : 'Assistant',
        content: m.content.trim(),
        format: 'markdown' as const,
        createdAt: null,
        citations: [],
        attachments: [],
        artifacts: [],
      }));

    if (messages.length === 0) return null;

    return {
      extractionStatus: 'complete',
      platform: parsed.platform || 'ai_chat',
      sourceUrl: targetUrl,
      shareId: targetUrl.split('/').pop()?.split('?')[0] || '',
      title: parsed.title || 'Extracted Conversation',
      model: null,
      updatedAt: null,
      messages,
      warnings: ['Extracted opportunistically via Gemini URL Context. Structure validated.'],
      parserVersion: '2.5.0-ai',
      connectorUsed: 'gemini_url_context',
    };
  } catch {
    // If Gemini URL context fails or errors, return null gracefully so the pipeline continues
    return null;
  }
}
