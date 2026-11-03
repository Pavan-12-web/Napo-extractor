/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a DOM node into clean Markdown while stripping chrome, icons, and metadata.
 */
export function nodeToCleanMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tagName = el.tagName.toLowerCase();

  // Strip chrome, buttons, tooltips, and thought indicators
  if (
    tagName === 'button' ||
    tagName === 'svg' ||
    tagName === 'path' ||
    tagName === 'style' ||
    tagName === 'script' ||
    tagName === 'noscript' ||
    el.getAttribute('aria-hidden') === 'true' ||
    el.classList.contains('copy-button') ||
    el.classList.contains('sr-only')
  ) {
    return '';
  }

  // Detect and strip "Thought for X seconds" or thinking indicators
  const textContent = el.textContent?.trim() || '';
  if (/^thought for \d+/i.test(textContent) || /^thinking(\.\.\.)?$/i.test(textContent)) {
    return '';
  }

  // Code blocks
  if (tagName === 'pre') {
    const codeEl = el.querySelector('code');
    const lang = codeEl?.className?.match(/language-([a-zA-Z0-9_-]+)/)?.[1] || '';
    const codeText = (codeEl ? codeEl.textContent : el.textContent) || '';
    return `\n\`\`\`${lang}\n${codeText.replace(/\r\n/g, '\n').trimEnd()}\n\`\`\`\n\n`;
  }

  if (tagName === 'code') {
    // If not inside a pre, inline code
    if (el.parentElement?.tagName.toLowerCase() !== 'pre') {
      return `\`${el.textContent || ''}\``;
    }
    return el.textContent || '';
  }

  // Headings
  if (/^h[1-6]$/.test(tagName)) {
    const level = parseInt(tagName[1], 10);
    const prefix = '#'.repeat(level);
    const inner = Array.from(el.childNodes).map(nodeToCleanMarkdown).join('').trim();
    return inner ? `\n\n${prefix} ${inner}\n\n` : '';
  }

  // Paragraphs & Divs
  if (tagName === 'p') {
    const inner = Array.from(el.childNodes).map(nodeToCleanMarkdown).join('').trim();
    return inner ? `${inner}\n\n` : '';
  }

  if (tagName === 'blockquote') {
    const inner = Array.from(el.childNodes).map(nodeToCleanMarkdown).join('').trim();
    return inner ? inner.split('\n').map(l => `> ${l}`).join('\n') + '\n\n' : '';
  }

  // Lists
  if (tagName === 'ul') {
    const items = Array.from(el.children).filter(c => c.tagName.toLowerCase() === 'li');
    return items.map(li => `- ${Array.from(li.childNodes).map(nodeToCleanMarkdown).join('').trim()}`).join('\n') + '\n\n';
  }

  if (tagName === 'ol') {
    const items = Array.from(el.children).filter(c => c.tagName.toLowerCase() === 'li');
    return items.map((li, idx) => `${idx + 1}. ${Array.from(li.childNodes).map(nodeToCleanMarkdown).join('').trim()}`).join('\n') + '\n\n';
  }

  // Tables
  if (tagName === 'table') {
    const rows = Array.from(el.querySelectorAll('tr'));
    if (rows.length === 0) return '';
    const tableMd: string[] = [];

    rows.forEach((tr, rIdx) => {
      const cells = Array.from(tr.querySelectorAll('th, td')).map(td =>
        Array.from(td.childNodes).map(nodeToCleanMarkdown).join('').replace(/\|/g, '\\|').trim()
      );
      tableMd.push(`| ${cells.join(' | ')} |`);

      // Add separator after header row
      if (rIdx === 0) {
        tableMd.push(`| ${cells.map(() => '---').join(' | ')} |`);
      }
    });

    return '\n' + tableMd.join('\n') + '\n\n';
  }

  // Inline formatting
  if (tagName === 'strong' || tagName === 'b') {
    const inner = Array.from(el.childNodes).map(nodeToCleanMarkdown).join('');
    return inner ? `**${inner}**` : '';
  }

  if (tagName === 'em' || tagName === 'i') {
    const inner = Array.from(el.childNodes).map(nodeToCleanMarkdown).join('');
    return inner ? `*${inner}*` : '';
  }

  if (tagName === 'a') {
    const href = el.getAttribute('href') || '';
    const text = Array.from(el.childNodes).map(nodeToCleanMarkdown).join('').trim();
    if (!text) return '';
    return href ? `[${text}](${href})` : text;
  }

  if (tagName === 'br') {
    return '\n';
  }

  if (tagName === 'hr') {
    return '\n---\n\n';
  }

  // Default: recursively map child nodes
  return nodeToCleanMarkdownChildren(el);
}

function nodeToCleanMarkdownChildren(el: HTMLElement): string {
  let result = '';
  for (const child of Array.from(el.childNodes)) {
    result += nodeToCleanMarkdown(child);
  }
  return result;
}

/**
 * Cleans extracted text to ensure no lingering system metadata or buttons remained.
 */
export function sanitizeCleanText(text: string): string {
  let cleaned = text;

  // Remove trailing multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // Strip common web chrome phrases if caught at line starts
  const chromePatterns = [
    /^Copy code$/gim,
    /^ChatGPT said:$/gim,
    /^You said:$/gim,
    /^Gemini said:$/gim,
    /^Show drafts$/gim,
    /^Modify response$/gim,
    /^Was this response helpful\?$/gim,
    /^Report issue$/gim
  ];

  for (const pattern of chromePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}
