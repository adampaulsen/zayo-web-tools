// fileName: popup.js

document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const viewFailedButton = document.getElementById('viewFailedButton');
    const itemsListTextarea = document.getElementById('itemsList');
    const statusDiv = document.getElementById('status');
    const restoredNotification = document.getElementById('restoredNotification');
    const body = document.body;

    let currentTabId = null; // Stores the active tab ID for this popup instance

    // Establish a long-lived connection with the background script
    const backgroundPort = chrome.runtime.connect({ name: "popup-channel" });

    // Function to save circuit IDs to storage
    async function saveCircuitIds(items) {
        try {
            await chrome.storage.local.set({ 
                pendingCircuitIds: items,
                circuitIdsTimestamp: Date.now()
            });
            console.log("Popup: Circuit IDs saved to storage");
        } catch (error) {
            console.error("Popup: Error saving circuit IDs to storage:", error);
        }
    }

    // Function to load circuit IDs from storage
    async function loadCircuitIds() {
        try {
            const result = await chrome.storage.local.get(['pendingCircuitIds', 'circuitIdsTimestamp']);
            if (result.pendingCircuitIds && result.circuitIdsTimestamp) {
                // Check if the saved data is recent (within last 24 hours)
                const isRecent = (Date.now() - result.circuitIdsTimestamp) < (24 * 60 * 60 * 1000);
                if (isRecent) {
                    itemsListTextarea.value = result.pendingCircuitIds.join('\n');
                    restoredNotification.style.display = 'block';
                    console.log("Popup: Circuit IDs restored from storage");
                    return true;
                } else {
                    // Clear old data
                    await chrome.storage.local.remove(['pendingCircuitIds', 'circuitIdsTimestamp']);
                    console.log("Popup: Old circuit IDs data cleared");
                }
            }
        } catch (error) {
            console.error("Popup: Error loading circuit IDs from storage:", error);
        }
        return false;
    }

    // Function to clear circuit IDs from storage
    async function clearCircuitIds() {
        try {
            await chrome.storage.local.remove(['pendingCircuitIds', 'circuitIdsTimestamp']);
            restoredNotification.style.display = 'none';
            console.log("Popup: Circuit IDs cleared from storage");
        } catch (error) {
            console.error("Popup: Error clearing circuit IDs from storage:", error);
        }
    }

    // Function to check for failed items and show/hide the view button
    async function checkForFailedItems() {
        try {
            const result = await chrome.storage.local.get(['lastFailedItems']);
            if (result.lastFailedItems && result.lastFailedItems.length > 0) {
                viewFailedButton.style.display = 'block';
                console.log("Popup: Found failed items, showing view button");
            } else {
                viewFailedButton.style.display = 'none';
            }
        } catch (error) {
            console.error("Popup: Error checking for failed items:", error);
            viewFailedButton.style.display = 'none';
        }
    }

    // Function to display failed items
    async function displayFailedItems() {
        let failedItems = null;
        
        // First, try to get failed items from storage
        try {
            const result = await chrome.storage.local.get(['lastFailedItems']);
            failedItems = result.lastFailedItems;
        } catch (storageError) {
            console.error("Popup: Error retrieving failed items from storage:", storageError);
            return;
        }
        
        if (!failedItems || failedItems.length === 0) {
            console.log("Popup: No failed items to display");
            return;
        }
        
        // Try to open the failed items display page
        try {
            const extensionUrl = chrome.runtime.getURL('failed_items_display.html');
            await chrome.tabs.create({ url: extensionUrl });
            console.log("Popup: Opened failed items display page");
        } catch (tabError) {
            console.error("Popup: Error opening failed items tab:", tabError);
            
            // Fallback: show failed items in an alert
            try {
                alert(`Failed Items (${failedItems.length}):\n\n${failedItems.join('\n')}`);
                console.log("Popup: Displayed failed items in alert fallback");
            } catch (alertError) {
                console.error("Popup: Alert fallback also failed:", alertError);
                // Last resort: log to console
                console.log("Failed Items:", failedItems);
            }
        }
    }

    // Helper to update the UI based on a given state
    function setUIState(state, statusText, itemsProcessed = null, totalItems = null) {
        console.log(`Popup: Setting UI state to: ${state} with status: "${statusText}"`);

        body.classList.remove('ui-state-idle', 'ui-state-starting', 'ui-state-running',
                             'ui-state-stopping', 'ui-state-completed-success',
                             'ui-state-completed-errors', 'ui-state-errored-init');
        body.classList.add(`ui-state-${state}`);

        switch (state) {
            case 'idle':
            case 'errored-init':
                itemsListTextarea.disabled = false;
                break;
            case 'starting':
            case 'running':
            case 'stopping':
                stopButton.textContent = 'Stop Automation';
                itemsListTextarea.disabled = true;
                break;
            case 'completed-success':
                stopButton.textContent = 'Automation Complete!';
                itemsListTextarea.disabled = false;
                break;
            case 'completed-errors':
                stopButton.textContent = 'Completed with Errors';
                itemsListTextarea.disabled = false;
                break;
        }

        let displayStatus = statusText;
        if (typeof itemsProcessed === 'number' && typeof totalItems === 'number') {
            if (state === 'running' || state === 'starting' || statusText.includes("Processing item") || statusText.includes("Error on item")) {
                 displayStatus = `${statusText} (${itemsProcessed}/${totalItems})`;
            }
        }
        statusDiv.textContent = displayStatus;
    }

    // Listener for messages from the background script
    backgroundPort.onMessage.addListener(async function(message) {
        console.log("Popup: Received message from background:", message);

        if (message.tabId === currentTabId || currentTabId === null) {
            switch (message.action) {
                case "automationStatus":
                    if (message.status.includes("Starting automation in this tab...")) {
                        setUIState('starting', message.status);
                    } else if (message.status.includes("Automation completed successfully!")) {
                        setUIState('completed-success', message.status, message.itemsProcessed, message.totalItems);
                        currentTabId = null;
                        // Clear circuit IDs from storage when automation completes successfully
                        clearCircuitIds();
                        // Clear any failed items from previous runs
                        try {
                            await chrome.storage.local.remove(['lastFailedItems']);
                            viewFailedButton.style.display = 'none';
                        } catch (error) {
                            console.error("Popup: Error clearing failed items after successful completion:", error);
                        }
                    } else if (message.status.includes("Automation completed with errors")) {
                        setUIState('completed-errors', message.status, message.itemsProcessed, message.totalItems);
                        currentTabId = null;
                        // Clear circuit IDs from storage when automation completes with errors
                        clearCircuitIds();
                        // Check for failed items and show the view button
                        await checkForFailedItems();
                    } else if (message.status.includes("Automation stopped") || message.status.includes("Navigated away")) {
                        setUIState('idle', message.status);
                        currentTabId = null;
                        // Clear circuit IDs from storage when automation is stopped
                        clearCircuitIds();
                        // Clear any failed items when automation is stopped
                        try {
                            await chrome.storage.local.remove(['lastFailedItems']);
                            viewFailedButton.style.display = 'none';
                        } catch (error) {
                            console.error("Popup: Error clearing failed items after stop:", error);
                        }
                    } else if (message.status.includes("Automation failed to start")) {
                         setUIState('errored-init', message.status);
                         currentTabId = null;
                         // Clear circuit IDs from storage when automation fails to start
                         clearCircuitIds();
                         // Clear any failed items when automation fails to start
                         try {
                             await chrome.storage.local.remove(['lastFailedItems']);
                             viewFailedButton.style.display = 'none';
                         } catch (error) {
                             console.error("Popup: Error clearing failed items after failed start:", error);
                         }
                    } else if (message.status.includes("Processing item")) {
                        setUIState('running', message.status, message.itemsProcessed, message.totalItems);
                    } else {
                        setUIState('running', message.status, message.itemsProcessed, message.totalItems);
                    }
                    break;
            }
        }
    });

    backgroundPort.onDisconnect.addListener(() => {
        console.log("Popup: Disconnected from background script.");
    });

    // Function to initialize the popup's state and tabId with retries
    async function initializePopupState(retries = 3, delay = 100) {
        try {
            console.log(`Popup: Attempting to query active tab (retries left: ${retries})...`);
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            const activeTab = tabs[0];

            console.log("Popup: activeTab received:", activeTab);
            if (activeTab) {
                console.log("Popup: activeTab.id:", activeTab.id, "typeof id:", typeof activeTab.id);
                console.log("Popup: activeTab.url:", activeTab.url);
            }

            if (!activeTab || typeof activeTab.id !== 'number' || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('about:') || !activeTab.url.includes("resolve.zayo.us")) {
                if (retries > 0) {
                    console.warn(`Popup: Invalid active tab info on init (retries left: ${retries}). Retrying in ${delay}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                    initializePopupState(retries - 1, delay * 2);
                    return;
                } else {
                    setUIState('errored-init', "Error: Automation cannot run on this page (e.g., Chrome internal page, new tab, or incorrect domain).");
                    console.error('Popup: Failed to get valid active tab after multiple retries:', activeTab);
                    currentTabId = null;
                    return;
                }
            }

            currentTabId = activeTab.id;
            console.log(`Popup: Initialized with valid currentTabId: ${currentTabId}`);

            // Request the initial state for this tab from the background script
            // --- ADD popupPortName to this message ---
            const response = await chrome.runtime.sendMessage({
                action: "requestAutomationState",
                tabId: currentTabId,
                popupPortName: backgroundPort.name // Send the port's unique name
            });

            if (response && response.status === "success") {
                setUIState(response.uiState, response.statusText, response.itemsProcessed, response.totalItems);
                // No need to null currentTabId here; it's managed by other states now.
            } else {
                setUIState('idle', "Idle.");
            }

            // Load circuit IDs from storage if automation is not running or if automation is running (to show what's being processed)
            if (response && response.status === "success") {
                await loadCircuitIds();
            }

            // Check for failed items and show/hide the view button
            await checkForFailedItems();
        } catch (e) {
            console.error("Popup: Error during popup initialization:", e);
            setUIState('errored-init', `Error initializing popup: ${e.message}`);
            currentTabId = null;
        }
    }

    // Initialize popup state and load circuit IDs
    initializePopupState();

    // Hide restored notification when user starts typing
    itemsListTextarea.addEventListener('input', function() {
        try {
            if (restoredNotification.style.display === 'block') {
                restoredNotification.style.display = 'none';
            }
        } catch (error) {
            console.error("Popup: Error hiding restored notification:", error);
        }
    });

    // View failed items button click handler
    viewFailedButton.addEventListener('click', async function() {
        try {
            await displayFailedItems();
        } catch (error) {
            console.error("Popup: Error in view failed items button handler:", error);
            // Try to show a simple alert as last resort
            try {
                alert("Error displaying failed items. Please check the console for details.");
            } catch (alertError) {
                console.error("Popup: Even alert fallback failed:", alertError);
            }
        }
    });

    startButton.addEventListener('click', async function() {
        const items = itemsListTextarea.value.split('\n').map(item => item.trim()).filter(item => item !== '');

        if (items.length === 0) {
            setUIState('idle', 'Please enter items to search.');
            return;
        }

        if (typeof currentTabId !== 'number') {
            setUIState('errored-init', 'Error: Automation cannot start. Please open on a valid page (e.g., resolve.zayo.us).');
            console.error('Popup: Cannot start automation, currentTabId is invalid:', currentTabId);
            return;
        }

        setUIState('starting', 'Starting automation...');

        // Save circuit IDs to storage when automation starts
        await saveCircuitIds(items);

        // Clear any previous failed items when starting new automation
        try {
            await chrome.storage.local.remove(['lastFailedItems']);
            viewFailedButton.style.display = 'none';
        } catch (error) {
            console.error("Popup: Error clearing previous failed items:", error);
        }

        try {
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    action: "startAutomationRequest",
                    items: items,
                    tabId: currentTabId
                }, function(msgResponse) {
                    if (chrome.runtime.lastError) {
                        console.error('Popup: Error sending start request to background:', chrome.runtime.lastError.message);
                        resolve({ status: "error", message: chrome.runtime.lastError.message });
                    } else {
                        resolve(msgResponse);
                    }
                });
            });

            if (response && response.status === "acknowledged") {
                console.log("Popup: Start request acknowledged by background script.");
            } else if (response && response.status === "already_active") {
                setUIState('running', 'Automation already running in this tab. Please stop it first.');
            } else if (response && response.status === "error") {
                setUIState('errored-init', `Automation Error: ${response.message}`);
                currentTabId = null;
            } else {
                setUIState('errored-init', 'Unexpected response to start command.');
                currentTabId = null;
            }

        } catch (error) {
            console.error('Popup: Unexpected error in startButton click handler:', error);
            setUIState('errored-init', `An unexpected error occurred: ${error.message}`);
            currentTabId = null;
        }
    });

    stopButton.addEventListener('click', async function() {
        if (typeof currentTabId !== 'number') {
             setUIState('idle', 'Error: No active automation known to this popup to stop.');
             console.error('Popup: No valid currentTabId to send stop command.');
             return;
        }

        setUIState('stopping', 'Attempting to stop automation...');

        try {
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    action: "stopAutomationRequest",
                    tabId: currentTabId
                }, function(msgResponse) {
                    if (chrome.runtime.lastError) {
                        console.warn('Popup: Error sending stop request to background (port might be closed):', chrome.runtime.lastError.message);
                        resolve({ status: "error", message: chrome.runtime.lastError.message });
                    } else {
                        resolve(msgResponse);
                    }
                });
            });

            if (response && response.status === "stopped") {
                console.log("Popup: Stop command acknowledged by background script.");
                setUIState('idle', 'Automation successfully stopped.');
                currentTabId = null;
            } else if (response && response.status === "not_active") {
                setUIState('idle', 'Automation was not active in this tab.');
                currentTabId = null;
            } else if (response && response.status === "error") {
                setUIState('idle', `Error stopping: ${response.message}`);
                currentTabId = null;
            } else {
                setUIState('idle', 'Stop command sent (no explicit confirmation).');
                currentTabId = null;
            }

        } catch (error) {
            console.error('Popup: Unexpected error in stopButton click handler:', error);
            setUIState('idle', `An unexpected error occurred while trying to stop: ${error.message}`);
            currentTabId = null;
        }
    });
});