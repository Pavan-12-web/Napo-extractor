/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, ContentSummary } from '../types/extractor';

// Standard common English stopwords to exclude from frequency ranking
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t',
  'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having',
  'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its',
  'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d',
  'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'code', 'example', 'like', 'using', 'also', 'will', 'just', 'get', 'use', 'one', 'two'
]);

export function generateContentSummary(messages: ChatMessage[]): ContentSummary {
  const turnCount = messages.length;

  if (turnCount === 0) {
    return {
      turnCount: 0,
      firstUserSnippet: '',
      topKeywords: [],
      detectedLanguages: [],
      headingsFound: [],
      lastAssistantConclusion: '',
    };
  }

  // First User Message opening
  const firstUserMsg = messages.find(m => m.role === 'User') || messages[0];
  const firstUserSnippet = firstUserMsg ? firstUserMsg.text.slice(0, 180).trim() + (firstUserMsg.text.length > 180 ? '...' : '') : '';

  // Detected Code Languages from fences (```ts, ```python, etc.)
  const detectedLanguagesSet = new Set<string>();
  const headingsSet = new Set<string>();
  const wordFrequencyMap: Record<string, number> = {};

  for (const msg of messages) {
    const text = msg.text;

    // Code languages
    const fenceMatches = text.matchAll(/```([a-zA-Z0-9#+_-]+)/g);
    for (const match of fenceMatches) {
      if (match[1] && match[1].toLowerCase() !== 'text') {
        detectedLanguagesSet.add(match[1].toLowerCase());
      }
    }

    // Headings
    const headingMatches = text.matchAll(/^#{1,6}\s+(.+)$/gm);
    for (const match of headingMatches) {
      if (match[1]) {
        headingsSet.add(match[1].trim());
      }
    }

    // Word tokenization for keywords
    // Strip markdown formatting symbols before tokenizing
    const stripped = text
      .replace(/```[\s\S]*?```/g, '') // omit code blocks
      .replace(/`[^`]+`/g, '')
      .replace(/\[[^\]]+\]\([^)]+\)/g, '')
      .replace(/[#*_~>|\\-]/g, ' ')
      .toLowerCase();

    const tokens = stripped.match(/[a-z]{3,}/g) || [];
    for (const token of tokens) {
      if (!STOPWORDS.has(token)) {
        wordFrequencyMap[token] = (wordFrequencyMap[token] || 0) + 1;
      }
    }
  }

  // Top keywords sorted by frequency
  const topKeywords = Object.entries(wordFrequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  // Last Assistant Message conclusion
  const assistantMsgs = messages.filter(m => m.role === 'Assistant');
  const lastAssistant = assistantMsgs.length > 0 ? assistantMsgs[assistantMsgs.length - 1] : messages[messages.length - 1];
  let lastAssistantConclusion = '';
  if (lastAssistant) {
    const lines = lastAssistant.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Take the last 2-3 non-empty lines
    lastAssistantConclusion = lines.slice(-3).join(' ');
    if (lastAssistantConclusion.length > 240) {
      lastAssistantConclusion = lastAssistantConclusion.slice(-240);
    }
  }

  return {
    turnCount,
    firstUserSnippet,
    topKeywords,
    detectedLanguages: Array.from(detectedLanguagesSet).slice(0, 10),
    headingsFound: Array.from(headingsSet).slice(0, 8),
    lastAssistantConclusion,
  };
}
