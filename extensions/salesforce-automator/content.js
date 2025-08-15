// Function to simulate typing into an input field
function simulateInput(element, value) {
  element.value = value;
  // Trigger input and change events for Salesforce to register the change
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

// Function to select an option from a dropdown
function selectDropdownOption(selectElement, value) {
  for (let i = 0; i < selectElement.options.length; i++) {
    if (selectElement.options[i].value === value || selectElement.options[i].textContent === value) {
      selectElement.value = selectElement.options[i].value;
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  return false;
}

// Function to send status updates to the popup
function updatePopupStatus(message, type = 'info', completed = false) {
  chrome.runtime.sendMessage({ action: 'updatePopupStatus', message: message, type: type, completed: completed });
}

// Main automation function (processes one item at a time)
async function processNextItem() {
  try {
    const data = await chrome.storage.local.get('remainingItems');
    let items = data.remainingItems || [];

    if (items.length === 0) {
      console.log("No more items to process. Automation complete.");
      updatePopupStatus('Automation completed!', 'info', true);
      chrome.runtime.sendMessage({ action: 'automationCompleted' }); // Inform background script
      return;
    }

    const itemToProcess = items[0]; // Get the first item
    const parts = itemToProcess.trim().split(','); // Split "ITEM_VALUE,ExpectedImpact"

    if (parts.length < 2) {
      const errorMessage = `Skipped item '${itemToProcess}': Invalid format. Expected 'ITEM_VALUE,ExpectedImpact'.`;
      console.error(errorMessage);
      updatePopupStatus(errorMessage, 'error');
      // Remove invalid item and try next
      items.shift();
      await chrome.storage.local.set({ remainingItems: items });
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before recursion
      return processNextItem(); // Recursively call to process the next valid item
    }

    const valueToInput = parts[0].trim();
    const expectedImpact = parts[1].trim();

    console.log(`Processing item: ${valueToInput} with Expected Impact: ${expectedImpact}`);
    updatePopupStatus(`Processing: ${valueToInput}`);

    let inputField = null;
    let fieldType = '';

    // Check if it's a Service Component (e.g., SC-123456)
    if (valueToInput.startsWith('SC-') && valueToInput.length === 9 && /SC-\d{6}/.test(valueToInput)) {
      inputField = document.getElementById('CF00N60000002gLRp'); // Service Component ID
      fieldType = 'Service Component';
    }
    // Check if it's a Service Number (e.g., 123456)
    else if (/^\d{6}$/.test(valueToInput)) {
      inputField = document.getElementById('CF00N60000002gLeF'); // Service Number ID
      fieldType = 'Service Number';
    } else {
      const errorMessage = `Skipped item '${itemToProcess}': Invalid format or unrecognized type. Expected 'SC-######' or '######'.`;
      console.error(errorMessage);
      updatePopupStatus(errorMessage, 'error');
      // Remove invalid item and try next
      items.shift();
      await chrome.storage.local.set({ remainingItems: items });
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before recursion
      return processNextItem(); // Recursively call to process the next valid item
    }

    if (!inputField) {
      throw new Error(`${fieldType} input field for '${valueToInput}' not found.`);
    }

    simulateInput(inputField, valueToInput);
    console.log(`Pasted ${fieldType}: ${valueToInput}`);

    // Find the Expected Impact dropdown by its ID
    const expectedImpactDropdown = document.getElementById('00N60000002gLee');
    if (!expectedImpactDropdown) {
      throw new Error('Expected Impact dropdown (ID: 00N60000002gLee) not found.');
    }
    if (!selectDropdownOption(expectedImpactDropdown, expectedImpact)) {
      throw new Error(`Option '${expectedImpact}' not found in Expected Impact dropdown.`);
    }
    console.log(`Selected Expected Impact: ${expectedImpact}`);

    // Find and click the "Save & New" button
    const saveAndNewButton = document.querySelector('input[name="save_new"][type="submit"][value="Save & New"]');
    if (!saveAndNewButton) {
      throw new Error('Save & New button not found.');
    }

    // Short delay before clicking to ensure all UI updates are processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // Remove the current item AFTER successfully populating fields and before clicking save.
    // This way, if the click fails, the item remains in storage for a retry (manual or programmatic).
    items.shift();
    await chrome.storage.local.set({ remainingItems: items });
    console.log(`Removed '${itemToProcess}' from list. Remaining: ${items.length}`);

    saveAndNewButton.click();
    console.log(`Clicked Save & New for item: ${itemToProcess}`);

    // Inform the background script that we've initiated a page reload
    chrome.runtime.sendMessage({ action: 'nextItemReady' });

  } catch (error) {
    const errorMessage = `Failed to process item. Error: ${error.message}`;
    console.error(errorMessage, error);
    updatePopupStatus(errorMessage, 'error', true); // Indicate failure to popup and re-enable button
    chrome.runtime.sendMessage({ action: 'automationCompleted' }); // Stop the loop if a critical error
  }
}

// Listener for messages from background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutomation' || request.action === 'continueAutomation') {
    console.log(`Content script received message to ${request.action}.`);
    processNextItem();
    sendResponse({ status: 'started' }); // Acknowledge that automation has started/continued
    return true; // Indicates an asynchronous response
  }
});

// Optional: Clear storage on initial load (only if starting fresh)
// This prevents leftover items from previous runs if the browser wasn't properly closed
// or automation didn't complete cleanly.
// This block should only run once when the content script is first loaded into a fresh page.
/*
(async () => {
  const data = await chrome.storage.local.get('remainingItems');
  if (data.remainingItems && data.remainingItems.length > 0 && !window.hasAutomationStarted) {
    // If there are items, but automation hasn't officially started (e.g., first visit to page),
    // clear them or prompt user. For simplicity, we'll assume a fresh start.
    // window.hasAutomationStarted is a simple flag to prevent this from running on every re-injection
    // if you don't want to clear.
    // await chrome.storage.local.set({ remainingItems: [] });
    // console.log("Cleared leftover items from storage on page load.");
  }
  window.hasAutomationStarted = true; // Set a flag to indicate content script has run once on this page
})();
*/