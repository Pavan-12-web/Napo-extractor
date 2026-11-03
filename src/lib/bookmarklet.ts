/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the runnable bookmarklet javascript string.
 * It extracts visible user & assistant messages directly from the active browser tab
 * and copies the clean text to clipboard and/or redirects to the Napo app.
 */
export function getBookmarkletCode(appUrl: string = window.location.origin): string {
  // Self-contained minified code that can be dragged to bookmark bar or copied
  const scriptBody = `(function(){
    try {
      var url = window.location.href;
      var turns = [];
      
      // ChatGPT extraction
      var chatGptNodes = document.querySelectorAll('[data-message-author-role], article');
      if (chatGptNodes.length > 0) {
        chatGptNodes.forEach(function(node){
          var role = node.getAttribute('data-message-author-role') || (node.textContent.indexOf('ChatGPT said') !== -1 ? 'assistant' : 'user');
          var text = node.innerText || node.textContent || '';
          text = text.replace(/^Thought for \\d+.*$/im, '').replace(/Copy code/g, '').trim();
          if (text) {
            turns.push((role === 'assistant' ? 'Assistant' : 'User') + ':\\n' + text);
          }
        });
      }
      
      // Gemini extraction
      if (turns.length === 0) {
        var geminiNodes = document.querySelectorAll('.user-query, [data-test-id="user-query"], user-query-container, .model-response, [data-test-id="model-response"], .response-container, message-content');
        if (geminiNodes.length > 0) {
          geminiNodes.forEach(function(node){
            var isUser = node.className.indexOf('user-query') !== -1 || node.tagName.toLowerCase() === 'user-query-container';
            var role = isUser ? 'User' : 'Assistant';
            var text = node.innerText || node.textContent || '';
            text = text.replace(/Show drafts/g, '').replace(/Modify response/g, '').trim();
            if (text) {
              turns.push(role + ':\\n' + text);
            }
          });
        }
      }
      
      // Fallback: grab full document body text if specific elements not found
      if (turns.length === 0) {
        var bodyText = document.body.innerText || document.body.textContent || '';
        turns.push('User:\\n' + bodyText.trim());
      }
      
      var payload = turns.join('\\n\\n----------------------------------------\\n\\n');
      
      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload);
      }
      
      // Show notification banner
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:20px;right:20px;background:#0f172a;color:#60a5fa;border:1px solid #3b82f6;padding:16px 20px;border-radius:8px;font-family:sans-serif;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.5);z-index:999999;max-width:360px;';
      banner.innerHTML = '<strong style="color:#ffffff;display:block;margin-bottom:6px;">Napo Extractor</strong>Copied ' + turns.length + ' turn(s) to clipboard!<br/><a href="${appUrl}/#paste" target="_blank" style="color:#93c5fd;text-decoration:underline;display:inline-block;margin-top:8px;">Open Napo Extractor &rarr;</a>';
      document.body.appendChild(banner);
      setTimeout(function(){ if(banner.parentNode) banner.parentNode.removeChild(banner); }, 8000);
    } catch(err) {
      alert('Napo Extractor: Unable to extract text directly from this page structure.');
    }
  })();`;

  return `javascript:${encodeURIComponent(scriptBody)}`;
}
