document.addEventListener('DOMContentLoaded', function() {
  const automateButton = document.getElementById('automateButton');
  const itemListTextarea = document.getElementById('itemList');
  const statusDiv = document.getElementById('status');

  automateButton.addEventListener('click', async () => {
    const items = itemListTextarea.value.trim().split('\n').filter(item => item !== '');

    // Get the selected Expected Impact value from the radio buttons
    const selectedExpectedImpact = document.querySelector('input[name="expectedImpact"]:checked');
    if (!selectedExpectedImpact) {
      statusDiv.textContent = 'Please select an Expected Impact.';
      statusDiv.className = 'error';
      return;
    }
    const expectedImpactValue = selectedExpectedImpact.value;


    if (items.length === 0) {
      statusDiv.textContent = 'Please paste a list of Service Components or Service Numbers.';
      statusDiv.className = 'error';
      return;
    }

    statusDiv.textContent = 'Starting automation...';
    statusDiv.className = '';
    automateButton.disabled = true; // Disable button to prevent multiple clicks

    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      statusDiv.textContent = 'Could not find the active tab. Please try again.';
      statusDiv.className = 'error';
      automateButton.disabled = false;
      return;
    }

    // Prepare items for storage: now each item in storage needs the associated Expected Impact
    // The format will be "ITEM_VALUE,ExpectedImpact"
    const itemsWithImpact = items.map(item => `${item.trim()},${expectedImpactValue}`);
    await chrome.storage.local.set({ remainingItems: itemsWithImpact });

    // Inform the background script which tab to monitor, PASSING THE TAB ID EXPLICITLY
    chrome.runtime.sendMessage({ action: 'startAutomationFromPopup', tabId: tab.id }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message to background:", chrome.runtime.lastError.message);
        statusDiv.textContent = `Error initiating automation: ${chrome.runtime.lastError.message}`;
        statusDiv.className = 'error';
        automateButton.disabled = false;
        return;
      }
      console.log('Message to background sent, response:', response);
    });


    // Inject content.js and tell it to start processing
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      // Check for lastError in case content script injection failed
      if (chrome.runtime.lastError) {
        console.error("Error injecting content script:", chrome.runtime.lastError.message);
        statusDiv.textContent = `Error injecting script: ${chrome.runtime.lastError.message}`;
        statusDiv.className = 'error';
        automateButton.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: 'startAutomation' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to content script:", chrome.runtime.lastError.message);
          statusDiv.textContent = `Error starting content script: ${chrome.runtime.lastError.message}`;
          statusDiv.className = 'error';
          automateButton.disabled = false;
          return;
        }

        if (response && response.status === 'started') {
          statusDiv.textContent = 'Automation initiated. Check Salesforce tab for progress.';
          statusDiv.className = '';
        } else if (response && response.status === 'error') {
          statusDiv.textContent = `Error: ${response.message}`;
          statusDiv.className = 'error';
          automateButton.disabled = false;
        } else {
          statusDiv.textContent = 'Automation failed to initiate (no response from content script).';
          statusDiv.className = 'error';
          automateButton.disabled = false;
        }
      });
    });
  });

  // Optional: Listen for messages from content.js/background.js to update popup status
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updatePopupStatus') {
      statusDiv.textContent = request.message;
      statusDiv.className = request.type === 'error' ? 'error' : '';
      if (request.completed) {
        automateButton.disabled = false;
      }
    }
  });
});