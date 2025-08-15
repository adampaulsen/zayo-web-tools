// fileName: content.js

(function() {

    // Define a unique flag on the window object to prevent re-initialization.
    if (typeof window.searchAutomatorInitializedFlag === 'undefined') {
        window.searchAutomatorInitializedFlag = true;
        window.searchAutomator = {}; // Initialize namespace only on first run
    } else {
        console.warn("Search Automator content script already initialized on this page. Skipping re-initialization of setup.");
        return; // This return is legal because it's inside the IIFE.
    }

    console.log("Search Automator content script initializing for the first time in this frame...");

    // === Global State and Helper Functions (attached to window.searchAutomator or global scope) ===

    // Constants for delays and timeouts
    const TYPING_DELAY_MS = 5;
    const AFTER_TYPING_WAIT_MS = 300;
    const BEFORE_ENTER_WAIT_MS = 150;
    const AFTER_ENTER_WAIT_MS = 2500; // Time for page to load after search/enter
    const AFTER_CLEAR_INPUT_WAIT_MS = 500;
    const IFRAME_ELEMENT_RETRY_MAX = 20;
    const IFRAME_ELEMENT_RETRY_DELAY_MS = 500;
    const LOADING_INDICATOR_TIMEOUT_MS = 15000; // Increased timeout for loading
    const LOADING_INDICATOR_INTERVAL_MS = 200;
    const DROPDOWN_WAIT_TIMEOUT_MS = 15000; // Increased timeout for dropdown
    const DROPDOWN_CHECK_INTERVAL_MS = 250;

    // Helper to send status updates to the background script (via chrome.runtime.sendMessage)
    // This function will add the originatingTabId automatically.
    window.searchAutomator.sendAutomationStatus = function(statusText, itemsProcessed = null, totalItems = null) {
        // Ensure currentContentScriptTabId is set before sending status
        const currentTabIdForStatus = window.searchAutomator.currentContentScriptTabId;
        if (typeof currentTabIdForStatus !== 'number') {
            console.warn("Cannot send automation status: currentContentScriptTabId is not set.");
            return;
        }
        chrome.runtime.sendMessage({
            action: "automationStatus",
            status: statusText,
            tabId: currentTabIdForStatus,
            itemsProcessed: itemsProcessed, // Include progress
            totalItems: totalItems         // Include total
        }).catch(e => {
            console.warn("Could not send automation status to background (background likely not listening or error):", e.message);
        });
    };

    // Global flag to control automation loop execution
    window.searchAutomator.shouldStopAutomation = false;

    // A flag to indicate if automation is currently active in this specific content script instance
    // This is distinct from shouldStopAutomation, which is a command.
    window.searchAutomator.isAutomationActive = false;

    // To store the tabId this content script is running in, received from background.js
    window.searchAutomator.currentContentScriptTabId = null;

    // Helper function to normalize circuit ID for robust comparison
    function normalizeCircuitId(id) {
        return id.toUpperCase().replace(/[\s\/\-]/g, '').replace(/\/\/ZYO$/, '');
    }

    // Function to simulate typing without repeating, by setting value once then dispatching events
    async function simulateTyping(element, text) {
        if (window.searchAutomator.shouldStopAutomation) {
            console.log("Automation stopped during typing simulation (initial check).");
            throw new Error("Automation stopped by user.");
        }

        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Setting full value and simulating events for: '${text}'`);

        for (let i = 0; i < text.length; i++) {
            if (window.searchAutomator.shouldStopAutomation) {
                console.log("Automation stopped during typing simulation (mid-loop).");
                throw new Error("Automation stopped by user.");
            }
            const char = text[i];
            const charCode = char.charCodeAt(0);

            element.dispatchEvent(new KeyboardEvent('keydown', {
                key: char, code: `Key${char.toUpperCase()}`, keyCode: charCode, which: charCode, bubbles: true, cancelable: true
            }));
            element.dispatchEvent(new KeyboardEvent('keyup', {
                key: char, code: `Key${char.toUpperCase()}`, keyCode: charCode, which: charCode, bubbles: true, cancelable: true
            }));
            await new Promise(resolve => setTimeout(resolve, TYPING_DELAY_MS));
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("Finished full value set and key event simulation.");
    }

    // Function to simulate pressing Enter key
    function pressEnter(element) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
        console.log("Simulated Enter key press.");
    }

    // Function to clear and re-focus the input field
    async function clearInputAndFocus(element) {
        element.focus();
        element.select();
        await simulateTyping(element, '');
        console.log("Cleared input field and re-focused.");
    }

    // Helper to get element inside iframe with retry
    async function getIframeElementWithRetry(iframeId, elementSelector) {
        const maxRetries = IFRAME_ELEMENT_RETRY_MAX;
        const delay = IFRAME_ELEMENT_RETRY_DELAY_MS;

        for (let i = 0; i < maxRetries; i++) {
            if (window.searchAutomator.shouldStopAutomation) {
                console.log("Automation stopped during element search.");
                throw new Error("Automation stopped by user.");
            }
            const iframe = document.getElementById(iframeId);
            if (iframe && iframe.contentDocument) {
                try {
                    const element = iframe.contentDocument.querySelector(elementSelector);
                    if (element) {
                        console.log(`Element '${elementSelector}' found in iframe '${iframeId}' after ${i + 1} retries.`);
                        return element;
                    }
                } catch (e) {
                    console.warn(`Attempt ${i + 1}/${maxRetries}: Could not access iframe content or error in querySelector for '${elementSelector}':`, e.message);
                }
            } else {
                console.log(`Attempt ${i + 1}/${maxRetries}: Iframe '${iframeId}' not found or contentDocument not ready. Retrying...`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        console.error(`Element "${elementSelector}" not found inside iframe "${iframeId}" after ${maxRetries} attempts.`);
        throw new Error(`Element "${elementSelector}" not found inside iframe "${iframeId}" after ${maxRetries} attempts.`);
    }

    // Function to wait for a loading element to disappear within the iframe
    async function waitForLoadingToDisappear(iframeId, loadingSelector) {
        console.log(`Waiting for loading indicator (${loadingSelector}) to disappear...`);
        const startTime = Date.now();
        const timeout = LOADING_INDICATOR_TIMEOUT_MS;
        const interval = LOADING_INDICATOR_INTERVAL_MS;

        while (Date.now() - startTime < timeout) {
            if (window.searchAutomator.shouldStopAutomation) {
                console.log("Automation stopped during loading wait.");
                throw new Error("Automation stopped by user.");
            }

            const iframe = document.getElementById(iframeId);
            if (iframe && iframe.contentDocument) {
                const loadingElement = iframe.contentDocument.querySelector(loadingSelector);
                if (!loadingElement || loadingElement.style.display === 'none' || loadingElement.classList.contains('x-hidden') || loadingElement.offsetWidth === 0 || loadingElement.offsetHeight === 0) {
                    console.log(`Loading indicator disappeared after ${Date.now() - startTime}ms.`);
                    return true;
                }
            } else {
                console.warn("Iframe content not yet accessible while waiting for loading indicator.");
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        console.warn(`Loading indicator (${loadingSelector}) did not disappear within ${timeout}ms.`);
        throw new Error(`Timeout: Loading indicator did not disappear within ${timeout}ms.`);
    }

    // Function to wait for a specific search result to appear in the dropdown
    async function waitForSpecificResultInDropdown(iframeId, dropdownId, expectedText) {
        const normalizedExpected = normalizeCircuitId(expectedText);
        const startTime = Date.now();
        const timeout = DROPDOWN_WAIT_TIMEOUT_MS;
        const interval = DROPDOWN_CHECK_INTERVAL_MS;

        await new Promise(resolve => setTimeout(resolve, 300));

        while (Date.now() - startTime < timeout) {
            if (window.searchAutomator.shouldStopAutomation) {
                console.log("Automation stopped during dropdown wait.");
                throw new Error("Automation stopped by user.");
            }

            const iframe = document.getElementById(iframeId);
            if (iframe && iframe.contentDocument) {
                const dropdown = iframe.contentDocument.getElementById(dropdownId);

                if (dropdown && dropdown.style.display !== 'none' && dropdown.classList.contains('x-boundlist-floating') && dropdown.offsetWidth > 0 && dropdown.offsetHeight > 0) {
                    const resultItems = dropdown.querySelectorAll('.x-boundlist-item');

                    if (resultItems.length > 0) {
                        let foundMatch = false;
                        for (const item of resultItems) {
                            const itemText = item.textContent.trim();
                            const normalizedItemText = normalizeCircuitId(itemText);

                            if (normalizedItemText.includes(normalizedExpected) || normalizedExpected.includes(normalizedItemText)) {
                                console.log(`Dropdown shows expected result for '${expectedText}' (normalized: '${normalizedExpected}') in item '${itemText}' (normalized: '${normalizedItemText}') after ${Date.now() - startTime}ms.`);
                                foundMatch = true;
                                break;
                            }
                        }
                        if (foundMatch) { return true; }
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        console.warn(`Timeout: Dropdown did not show result containing (or matching) '${expectedText}' within ${timeout}ms.`);
        return false;
    }

    // --- Main Automation Logic ---
    async function automateSearch(items) {
        window.searchAutomator.shouldStopAutomation = false;
        window.searchAutomator.isAutomationActive = true;

        let itemsProcessed = 0;
        let failedItems = [];
        const totalItems = items.length;

        try {
            window.searchAutomator.sendAutomationStatus("Initializing automation...", itemsProcessed, totalItems);
            const searchInput = await getIframeElementWithRetry(
                'wiki_frame',
                'input#searchCombobox-inputEl[placeholder="search..."]'
            );

            if (!searchInput) {
                throw new Error("Search input element was not found.");
            }

            const loadingIndicatorSelector = '.x-mask-msg';
            const searchResultsDropdownId = 'boundlist-1098';

            for (let i = 0; i < items.length; i++) {
                if (window.searchAutomator.shouldStopAutomation) {
                    console.log(`Automation stopped by user after processing ${itemsProcessed} items.`);
                    window.searchAutomator.sendAutomationStatus(`Automation stopped.`, itemsProcessed, totalItems);
                    break;
                }

                const item = items[i];
                console.log(`Processing item ${i + 1}/${totalItems}: ${item}`);
                window.searchAutomator.sendAutomationStatus(`Processing item ${item}`, itemsProcessed + 1, totalItems);

                try {
                    await new Promise(resolve => setTimeout(resolve, AFTER_TYPING_WAIT_MS));
                    await simulateTyping(searchInput, item);
                    await new Promise(resolve => setTimeout(resolve, AFTER_TYPING_WAIT_MS));
                    await waitForLoadingToDisappear('wiki_frame', loadingIndicatorSelector);
                    const searchResultFound = await waitForSpecificResultInDropdown('wiki_frame', searchResultsDropdownId, item);

                    if (!searchResultFound) {
                        console.warn(`Circuit ID '${item}' did not yield a matching search result within timeout or dropdown issue. Skipping.`);
                        failedItems.push(item);
                        try { await clearInputAndFocus(searchInput); } catch(e) { console.error("Failed to clear input after no search result:", e.message); }
                        itemsProcessed++;
                        continue;
                    }

                    await new Promise(resolve => setTimeout(resolve, BEFORE_ENTER_WAIT_MS));
                    pressEnter(searchInput);
                    await new Promise(resolve => setTimeout(resolve, AFTER_ENTER_WAIT_MS));
                    await clearInputAndFocus(searchInput);
                    await new Promise(resolve => setTimeout(resolve, AFTER_CLEAR_INPUT_WAIT_MS));

                    itemsProcessed++;
                } catch (itemError) {
                    console.error(`Error processing item '${item}':`, itemError.message);
                    window.searchAutomator.sendAutomationStatus(`Error on item '${item}': ${itemError.message}`, itemsProcessed + 1, totalItems);
                    failedItems.push(item);
                    try { await clearInputAndFocus(searchInput); } catch(e) { console.error("Failed to clear input after item error:", e.message); }
                    itemsProcessed++;
                    continue;
                }
            }

            // --- Automation Completion (after loop finishes or breaks) ---
            if (failedItems.length > 0) {
                console.log(`Automation completed with ${failedItems.length} errors.`);
                window.searchAutomator.sendAutomationStatus(`Automation completed with errors (${failedItems.length} failed).`, itemsProcessed, totalItems);

                await chrome.storage.local.set({lastFailedItems: failedItems}).then(() => {
                    console.log("Failed items stored in chrome.storage.local.");
                }).catch(e => {
                    console.error("Error storing failed items in chrome.storage.local:", e);
                });

                chrome.runtime.sendMessage({ action: "displayFailedItems", tabId: window.searchAutomator.currentContentScriptTabId }).catch(e => {
                    console.error("Failed to send displayFailedItems message to background (background likely closed):", e);
                });

            } else {
                console.log("Automation sequence completed successfully!");
                window.searchAutomator.sendAutomationStatus(`Automation completed successfully!`, itemsProcessed, totalItems);
            }

        } catch (automationInitError) {
            console.error("Automation initialization error or critical failure:", automationInitError.message);
            window.searchAutomator.sendAutomationStatus(`Automation failed to start: ${automationInitError.message}`);
        } finally {
            window.searchAutomator.shouldStopAutomation = false;
            window.searchAutomator.isAutomationActive = false;
        }
    }

    // --- Message Listener from Background Script ---
    chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
        if (request.action === "startAutomation") {
            window.searchAutomator.currentContentScriptTabId = request.tabId;
            sendResponse({ status: "acknowledged" });

            if (window.searchAutomator.isAutomationActive) {
                 console.warn("Automation is already active in this tab. Ignoring new start request.");
                 window.searchAutomator.sendAutomationStatus("Automation is already active.");
                 return;
            }

            window.searchAutomator.isAutomationActive = true;
            window.searchAutomator.shouldStopAutomation = false;

            console.log("Received start automation request with items:", request.items);
            await automateSearch(request.items);

        } else if (request.action === "stopAutomation") {
            if (window.searchAutomator) {
                window.searchAutomator.shouldStopAutomation = true;
                console.log("Stop automation request received. Setting stop flag.");
                window.searchAutomator.isAutomationActive = false;
                window.searchAutomator.sendAutomationStatus("Automation stopping...");
            } else {
                console.warn("Stop request received but window.searchAutomator not initialized.");
            }
            sendResponse({ status: "stopped" });
        } else if (request.action === "pageNavigated") {
            if (window.searchAutomator.isAutomationActive) {
                console.log("Page navigated, stopping current automation.");
                window.searchAutomator.shouldStopAutomation = true;
                window.searchAutomator.isAutomationActive = false;
                window.searchAutomator.sendAutomationStatus("Automation stopped due to page navigation.");
            }
        }
        return true;
    });

    window.searchAutomator.isAutomationActive = false;

})();