// fileName: background.js

// Map to store {tabId: {isRunning: boolean, popupPort: Port|null, lastStatus: string, uiState: string, itemsProcessed: number|null, totalItems: number|null}}
let activeAutomationState = new Map();

// Temporary map to hold unlinked ports by their name until their associated tabId is known
let pendingPopupPorts = new Map(); // Map: port.name -> Port object

// Helper to update extension icon badge (No changes)
function updateBadge(tabId, text = '', color = '#000000') {
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
            return;
        }
        chrome.action.setBadgeText({ tabId: tabId, text: text });
        chrome.action.setBadgeBackgroundColor({ color: color, tabId: tabId });
    });
}

// Helper to send status to relevant popup
function sendStatusToPopup(targetTabId, statusText, uiState, itemsProcessed = null, totalItems = null) {
    const state = activeAutomationState.get(targetTabId);
    if (state && state.popupPort) {
        try { // Add try-catch around postMessage for robustness
            state.popupPort.postMessage({
                action: "automationStatus",
                status: statusText,
                uiState: uiState, // Explicit UI state for popup
                tabId: targetTabId,
                itemsProcessed: itemsProcessed,
                totalItems: totalItems
            });
            console.log(`Background: Status SENT to popup for tab ${targetTabId}: Action=automationStatus, Status="${statusText}", UIState="${uiState}"`);
        } catch (e) {
            console.error(`Background: Error posting message to popup port for tab ${targetTabId}:`, e);
            state.popupPort = null; // Clear invalid port reference
            console.warn(`Background: Cleared invalid popupPort for tab ${targetTabId}.`);
        }
    } else {
        console.warn(`Background: FAILED to send status to popup for tab ${targetTabId}. No popup port connected or port invalid.`);
    }
}

// Initialize or update tab state with full details (No changes)
function updateTabState(tabId, { isRunning, popupPort, lastStatus, uiState, itemsProcessed = null, totalItems = null }) {
    let currentState = activeAutomationState.get(tabId) || { isRunning: false, popupPort: null, lastStatus: "Idle", uiState: "idle", itemsProcessed: null, totalItems: null };

    activeAutomationState.set(tabId, {
        isRunning: isRunning !== undefined ? isRunning : currentState.isRunning,
        popupPort: popupPort !== undefined ? popupPort : currentState.popupPort,
        lastStatus: lastStatus !== undefined ? lastStatus : currentState.lastStatus,
        uiState: uiState !== undefined ? uiState : currentState.uiState,
        itemsProcessed: itemsProcessed !== undefined ? itemsProcessed : currentState.itemsProcessed,
        totalItems: totalItems !== undefined ? totalItems : currentState.totalItems
    });
}


// Listener for ALL messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // message.tabId is passed explicitly by content/popup scripts
    // Fallback to sender.tab.id if message.tabId is absent (less reliable for popup init)
    const messageTabId = message.tabId || (sender.tab ? sender.tab.id : null);

    // Ensure tabState exists for the specific messageTabId BEFORE processing
    if (typeof messageTabId === 'number' && !activeAutomationState.has(messageTabId)) {
        updateTabState(messageTabId, {}); // Initialize with defaults
    }
    const tabState = typeof messageTabId === 'number' ? activeAutomationState.get(messageTabId) : null;

    console.log(`Background: Message received - Action: '${message.action}', From Tab: ${messageTabId || 'N/A'}`);


    switch (message.action) {
        case "requestAutomationState":
            // This is the first message from popup.js where the *correct* tabId is known by popup.js
            if (typeof messageTabId === 'number' && message.popupPortName) { // popupPortName added to popup.js request
                const portFromConnect = pendingPopupPorts.get(message.popupPortName);
                if (portFromConnect && tabState) {
                    tabState.popupPort = portFromConnect; // Associate the actual Port object
                    pendingPopupPorts.delete(message.popupPortName); // Clear from pending
                    console.log(`Background: Successfully linked popup port '${message.popupPortName}' to tab ${messageTabId}.`);
                } else {
                    console.warn(`Background: No pending port found for '${message.popupPortName}' or tabState not found for ${messageTabId}.`);
                    // If no pending port, and tabState exists, maybe there's an existing port that's just null?
                    // We can attempt to refresh the popup's state directly even if port wasn't linked via pendingPorts
                }
            }

            if (tabState) {
                sendResponse({
                    status: "success",
                    isRunning: tabState.isRunning,
                    uiState: tabState.uiState,
                    statusText: tabState.lastStatus,
                    itemsProcessed: tabState.itemsProcessed,
                    totalItems: tabState.totalItems
                });
            } else {
                sendResponse({ status: "not_found", isRunning: false, uiState: "idle", statusText: "Idle." });
            }
            return true; // Asynchronous response

        case "startAutomationRequest":
            if (!tabState) { // Should not happen if messageTabId is number.
                sendResponse({ status: "error", message: "Tab state not found for start request." });
                return false;
            }
            if (tabState.isRunning) {
                sendResponse({ status: "already_active" });
                console.warn(`Background: Automation already active in tab ${messageTabId}. Ignoring new start request.`);
                if(tabState.popupPort) {
                    sendStatusToPopup(messageTabId, tabState.lastStatus, tabState.uiState, tabState.itemsProcessed, tabState.totalItems);
                }
                return false;
            }

            updateTabState(messageTabId, { isRunning: true, lastStatus: "Starting automation in this tab...", uiState: "starting", itemsProcessed: 0, totalItems: message.items.length });
            updateBadge(messageTabId, 'RUN', '#008000');
            sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);

            chrome.scripting.executeScript({
                target: { tabId: messageTabId },
                files: ['content.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`Background: Error injecting content.js into tab ${messageTabId}:`, chrome.runtime.lastError.message);
                    updateTabState(messageTabId, { isRunning: false, lastStatus: `Automation failed to start: ${chrome.runtime.lastError.message}`, uiState: "errored-init" });
                    updateBadge(messageTabId, 'ERR', '#FF0000');
                    sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                    sendResponse({ status: "error", message: `Failed to inject script: ${chrome.runtime.lastError.message}` });
                    return;
                }
                chrome.tabs.sendMessage(messageTabId, { action: "startAutomation", items: message.items, tabId: messageTabId })
                    .then(response => {
                        if (response && response.status === "acknowledged") {
                            console.log(`Background: Content script in tab ${messageTabId} acknowledged start.`);
                            sendResponse({ status: "acknowledged" });
                        } else {
                            console.error(`Background: Unexpected acknowledgment from content script in tab ${messageTabId}:`, response);
                            updateTabState(messageTabId, { isRunning: false, lastStatus: "Automation failed to start: Content script error.", uiState: "errored-init" });
                            updateBadge(messageTabId, 'ERR', '#FF0000');
                            sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                            sendResponse({ status: "error", message: "Content script did not acknowledge start correctly." });
                        }
                    })
                    .catch(error => {
                        console.error(`Background: Error sending start message to content script in tab ${messageTabId} via sendMessage:`, error);
                        updateTabState(messageTabId, { isRunning: false, lastStatus: `Automation failed to start: ${error.message}`, uiState: "errored-init" });
                        updateBadge(messageTabId, 'ERR', '#FF0000');
                        sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                        sendResponse({ status: "error", message: `Failed to send start command to tab: ${error.message}` });
                    });
            });
            return true;

        case "stopAutomationRequest":
            if (tabState && tabState.isRunning) {
                updateTabState(messageTabId, { isRunning: false, lastStatus: "Automation stopping...", uiState: "stopping" });
                sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);

                chrome.tabs.sendMessage(messageTabId, { action: "stopAutomation" })
                    .then(response => {
                        if (response && response.status === "stopped") {
                            console.log(`Background: Content script in tab ${messageTabId} acknowledged stop.`);
                            updateTabState(messageTabId, { lastStatus: "Automation stopped.", uiState: "idle" });
                            updateBadge(messageTabId, 'STOP', '#FFA500');
                            sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                            sendResponse({ status: "stopped" });
                        } else {
                            console.error(`Background: Unexpected response from content script in tab ${messageTabId} for stop:`, response);
                            updateTabState(messageTabId, { lastStatus: "Error: Content script did not acknowledge stop correctly.", uiState: "idle" });
                            sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                            sendResponse({ status: "error", message: "Content script did not acknowledge stop correctly." });
                        }
                    })
                    .catch(error => {
                        console.error(`Background: Error sending stop message to content script in tab ${messageTabId} via sendMessage:`, error);
                        updateTabState(messageTabId, { lastStatus: `Error stopping: ${error.message}`, uiState: "idle" });
                        updateBadge(messageTabId, 'ERR', '#FF0000');
                        sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                        sendResponse({ status: "error", message: `Failed to send stop command to tab: ${error.message}` });
                    });
            } else {
                console.warn(`Background: Stop request for inactive or unknown tab ${messageTabId}.`);
                updateTabState(messageTabId, { lastStatus: "Automation was not active in this tab.", uiState: "idle" });
                updateBadge(messageTabId, '', '#808080');
                sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                sendResponse({ status: "not_active" });
            }
            return true;

        case "automationStatus":
            if (tabState) {
                let currentUiState = "running";
                let receivedStatus = message.status;

                if (receivedStatus.includes("Automation completed successfully!")) {
                    currentUiState = "completed-success";
                    updateBadge(messageTabId, 'DONE', '#0000FF');
                } else if (receivedStatus.includes("Automation completed with errors")) {
                    currentUiState = "completed-errors";
                    updateBadge(messageTabId, 'DONE', '#0000FF');
                } else if (receivedStatus.includes("Automation failed to start")) {
                    currentUiState = "errored-init";
                    updateBadge(messageTabId, 'ERR', '#FF0000');
                }

                updateTabState(messageTabId, {
                    isRunning: !(currentUiState.includes("completed") || currentUiState === "errored-init" || currentUiState === "idle"),
                    lastStatus: receivedStatus,
                    uiState: currentUiState,
                    itemsProcessed: message.itemsProcessed,
                    totalItems: message.totalItems
                });

                const updatedTabState = activeAutomationState.get(messageTabId);
                sendStatusToPopup(messageTabId, updatedTabState.lastStatus, updatedTabState.uiState, updatedTabState.itemsProcessed, updatedTabState.totalItems);
            } else {
                console.warn(`Background: Received automationStatus for unknown tabId: ${messageTabId}`);
            }
            break;

        case "displayFailedItems":
            if (tabState) {
                const extensionUrl = chrome.runtime.getURL(`failed_items_display.html`);
                
                // Try to open the tab with focus
                chrome.tabs.create({ 
                    url: extensionUrl, 
                    openerTabId: messageTabId,
                    active: true // Ensure the new tab gets focus
                })
                .then(newTab => {
                    console.log(`Background: Opened new tab ${newTab.id} for failed items from tab ${messageTabId}.`);
                    // Update the status to indicate failed items are available
                    updateTabState(messageTabId, { 
                        lastStatus: `Automation completed with errors. Failed items available in new tab.`, 
                        uiState: "completed-errors" 
                    });
                    updateBadge(messageTabId, 'FAIL', '#FF9800');
                    sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                })
                .catch(e => {
                    console.error("Background: Failed to open new tab for failed items:", e);
                    // Don't mark this as an error state, just inform the user that failed items are stored
                    updateTabState(messageTabId, { 
                        lastStatus: `Automation completed with errors. Failed items saved - use 'View Failed Items' button to access them.`, 
                        uiState: "completed-errors" 
                    });
                    updateBadge(messageTabId, 'FAIL', '#FF9800');
                    sendStatusToPopup(messageTabId, activeAutomationState.get(messageTabId).lastStatus, activeAutomationState.get(messageTabId).uiState, activeAutomationState.get(messageTabId).itemsProcessed, activeAutomationState.get(messageTabId).totalItems);
                });
            } else {
                console.warn(`Background: Received displayFailedItems for unknown tabId: ${messageTabId}`);
            }
            break;

        default:
            console.warn("Background: Unhandled message action:", message.action);
    }
    return false;
});

// Port connection from popup: This listener establishes the long-lived connection
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup-channel") {
        const popupTabIdFromSender = port.sender.tab ? port.sender.tab.id : null;
        console.log(`Background: Popup connected via port. Initial sender.tab.id: ${popupTabIdFromSender || 'null'}.`);

        // Store the port reference directly into `pendingPopupPorts` keyed by its unique `port.name`.
        // This ensures the port object is not lost, even if `sender.tab.id` is null.
        pendingPopupPorts.set(port.name, port);
        console.log(`Background: Stored pending port '${port.name}'.`);

        // Handle popup disconnection: Crucial for cleaning up `pendingPopupPorts` and `activeAutomationState`
        port.onDisconnect.addListener(() => {
            console.log(`Background: Popup disconnected from port '${port.name}'.`);
            pendingPopupPorts.delete(port.name); // Remove from pending list

            // Find and clear this specific port from any tab's state
            activeAutomationState.forEach((state, tabId) => {
                if (state.popupPort === port) {
                    state.popupPort = null;
                    console.log(`Background: Cleared port reference for tab ${tabId}.`);
                }
            });
        });
    }
});

// Listener for tab closing (cleanup state)
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (activeAutomationState.has(tabId)) {
        console.log(`Background: Tab ${tabId} closed. Removing automation state.`);
        activeAutomationState.delete(tabId);
        chrome.action.setBadgeText({ tabId: tabId, text: '' });
    }
});

// Listener for page navigation within a tab (cleanup state for new page)
chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0 && details.url.startsWith("http")) { // Ensure it's a main frame navigation to http/https
        if (activeAutomationState.has(details.tabId)) {
            const tabState = activeAutomationState.get(details.tabId);
            if (tabState.isRunning) {
                console.log(`Background: Tab ${details.tabId} navigated to new URL (${details.url}). Marking automation as inactive.`);
                updateTabState(details.tabId, {
                    isRunning: false,
                    lastStatus: "Navigated away, automation stopped.",
                    uiState: "idle"
                });
                updateBadge(details.tabId, 'NAV', '#808080');
                chrome.tabs.sendMessage(details.tabId, { action: "pageNavigated" }).catch(() => {});
            } else if (tabState.uiState !== "idle" || tabState.lastStatus !== "Idle") { // If it was in some non-idle state
                console.log(`Background: Tab ${details.tabId} navigated to new URL (${details.url}). Resetting state to idle.`);
                updateTabState(details.tabId, { lastStatus: "Idle (page navigated).", uiState: "idle" });
                updateBadge(details.tabId, '', '#808080');
            }
            // Always send status to popup if it's connected, even for idle updates post-navigation
            const updatedTabState = activeAutomationState.get(details.tabId);
            sendStatusToPopup(details.tabId, updatedTabState.lastStatus, updatedTabState.uiState, updatedTabState.itemsProcessed, updatedTabState.totalItems);
        }
    }
}, { url: [{ schemes: ["http", "https"] }] });