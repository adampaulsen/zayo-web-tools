let automationTabId = null; // To keep track of the tab where automation is running

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutomationFromPopup') {
    // Use the tabId passed in the request object
    automationTabId = request.tabId;
    console.log(`Automation started in tab: ${automationTabId}`);
    sendResponse({ status: 'received' });
  } else if (request.action === 'automationCompleted') {
    // Automation finished
    automationTabId = null;
    console.log('Automation completed across all items.');
    sendResponse({ status: 'acknowledged' });
  } else if (request.action === 'nextItemReady') {
    // Content script processed one item and clicked "Save & New"
    // Now waiting for the page reload, then background script will re-inject
    console.log(`Content script processed one item. Waiting for page reload in tab: ${automationTabId}`);
    sendResponse({ status: 'acknowledged' });
  }
});

// Listen for tab updates (especially "complete" status, which means page finished loading)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only proceed if it's the automation tab and the status is 'complete'
  // Also ensure tab.url is not undefined before checking includes
  if (tabId === automationTabId && changeInfo.status === 'complete' && tab.url && tab.url.includes('salesforce.com/a4j/e')) {
    console.log(`Page reloaded in automation tab (${tabId}). Checking for remaining items...`);

    const { remainingItems } = await chrome.storage.local.get('remainingItems');

    if (remainingItems && remainingItems.length > 0) {
      console.log(`Remaining items found: ${remainingItems.length}. Re-injecting content script.`);
      try {
        // Ensure content.js is registered (if not already from previous injection)
        // We only inject if it's not already running or just to be safe.
        // For MV3 service workers, `executeScript` handles re-injection well.
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        // Send message to re-injected content script to continue
        chrome.tabs.sendMessage(tabId, { action: 'continueAutomation' });
      } catch (e) {
        console.error("Failed to re-inject content script:", e);
        // Inform popup of critical error
        updatePopupStatus('Automation stopped: Failed to re-inject script after page reload.', 'error', true);
        automationTabId = null; // Reset automationTabId if re-injection fails critically
      }
    } else {
      console.log('No remaining items. Automation finished.');
      updatePopupStatus('Automation completed!', 'info', true); // Inform popup
      automationTabId = null; // Reset tab ID as automation is done
      await chrome.storage.local.remove('remainingItems'); // Clean up storage
    }
  }
});

// Helper to send messages to the popup, if it's open.
// This function needs to be defined in background.js
function updatePopupStatus(message, type = 'info', completed = false) {
  chrome.runtime.sendMessage({ action: 'updatePopupStatus', message: message, type: type, completed: completed })
    .catch(error => {
      // Ignore errors if popup is closed
      if (error.message && !error.message.includes('Receiving end does not exist')) {
        console.warn("Could not send update to popup:", error);
      }
    });
}