/**
 * Napo Extractor Companion Extension — Background Service Worker (Manifest V3)
 * Operates strictly locally within user's authenticated browser profile.
 * Never transmits cookies, headers, or raw HTML to any external server.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_URL') {
    const targetUrl = request.url;

    // Create a background tab using user's existing authenticated session
    chrome.tabs.create({ url: targetUrl, active: false }, (tab) => {
      const tabId = tab.id;

      // Listen for tab loading completion
      const onUpdated = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);

          // Give dynamic SPA frameworks a short delay to hydrate
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'PARSE_DOM' }, (response) => {
              // Send normalized data back to caller
              sendResponse(response);

              // Close the temporary tab safely
              if (tabId) {
                chrome.tabs.remove(tabId);
              }
            });
          }, 1500);
        }
      };

      chrome.tabs.onUpdated.addListener(onUpdated);
    });

    return true; // Keep message channel open for async response
  }
});
