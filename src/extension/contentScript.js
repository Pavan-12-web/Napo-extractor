/**
 * Napo Extractor Companion Extension — Content Script
 * Executes locally within the active page DOM.
 * Strips chrome, sanitizes text, and maps into normalized schema.
 */

function extractRenderedMessages() {
  const url = window.location.href;
  const turns = [];

  // ChatGPT DOM pattern
  const chatGptNodes = document.querySelectorAll('[data-message-author-role], article');
  if (chatGptNodes.length > 0) {
    chatGptNodes.forEach((node, i) => {
      const role = node.getAttribute('data-message-author-role') || (node.textContent.includes('ChatGPT said') ? 'assistant' : 'user');
      let text = node.innerText || node.textContent || '';
      text = text.replace(/^Thought for \d+.*$/im, '').replace(/Copy code/g, '').trim();
      if (text) {
        turns.push({
          id: `ext-cg-${i + 1}`,
          role: role === 'user' ? 'user' : 'assistant',
          author: role === 'user' ? 'User' : 'ChatGPT',
          content: text,
          format: 'markdown',
          createdAt: null,
          citations: [],
          attachments: [],
          artifacts: [],
        });
      }
    });
    if (turns.length > 0) {
      return {
        platform: 'chatgpt',
        title: document.title.replace(' | ChatGPT', '').trim() || 'ChatGPT Conversation',
        messages: turns,
      };
    }
  }

  // Claude DOM pattern
  const claudeNodes = document.querySelectorAll('.font-user-message, .font-claude-message, [data-is-streaming]');
  if (claudeNodes.length > 0) {
    claudeNodes.forEach((node, i) => {
      const isUser = node.classList.contains('font-user-message') || node.querySelector('.font-user-message');
      let text = node.innerText || node.textContent || '';
      text = text.trim();
      if (text) {
        turns.push({
          id: `ext-cl-${i + 1}`,
          role: isUser ? 'user' : 'assistant',
          author: isUser ? 'User' : 'Claude',
          content: text,
          format: 'markdown',
          createdAt: null,
          citations: [],
          attachments: [],
          artifacts: [],
        });
      }
    });
    if (turns.length > 0) {
      return {
        platform: 'claude',
        title: document.title.replace(' | Claude', '').trim() || 'Claude Conversation',
        messages: turns,
      };
    }
  }

  // Gemini DOM pattern
  const geminiNodes = document.querySelectorAll('.user-query, .model-response, [data-test-id="user-query"], [data-test-id="model-response"], message-content');
  if (geminiNodes.length > 0) {
    geminiNodes.forEach((node, i) => {
      const isUser = node.className.includes('user-query') || (node.getAttribute('data-test-id') || '').includes('user-query');
      let text = node.innerText || node.textContent || '';
      text = text.replace(/Show drafts/g, '').replace(/Modify response/g, '').trim();
      if (text) {
        turns.push({
          id: `ext-gem-${i + 1}`,
          role: isUser ? 'user' : 'assistant',
          author: isUser ? 'User' : 'Gemini',
          content: text,
          format: 'markdown',
          createdAt: null,
          citations: [],
          attachments: [],
          artifacts: [],
        });
      }
    });
    if (turns.length > 0) {
      return {
        platform: 'gemini',
        title: document.title.replace(' - Gemini', '').trim() || 'Gemini Conversation',
        messages: turns,
      };
    }
  }

  // General fallback
  const main = document.querySelector('main, article, [role="main"]') || document.body;
  const rawText = (main.innerText || main.textContent || '').trim();
  if (rawText) {
    turns.push({
      id: 'ext-fallback-1',
      role: 'user',
      author: 'User',
      content: rawText,
      format: 'markdown',
      createdAt: null,
      citations: [],
      attachments: [],
      artifacts: [],
    });
  }

  return {
    platform: 'unknown',
    title: document.title || 'Conversation',
    messages: turns,
  };
}

// Listen for background tab requests
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'PARSE_DOM') {
      const result = extractRenderedMessages();
      sendResponse({ success: true, data: result });
    }
  });
}

// Also announce readiness to window in case of direct window.postMessage bridge
window.addEventListener('message', (event) => {
  if (event.data?.type === 'NAPO_EXTRACT_REQUEST') {
    const result = extractRenderedMessages();
    window.postMessage({ type: 'NAPO_EXTRACT_RESPONSE', data: result }, '*');
  }
});
