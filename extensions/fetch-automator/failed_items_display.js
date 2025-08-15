// fileName: failed_items_display.js
// failed_items_display.js

console.log("Failed Items Display: Script starting execution."); // NEW LOG

document.addEventListener('DOMContentLoaded', function() {
    console.log("Failed Items Display: DOMContentLoaded fired."); // NEW LOG
    const textarea = document.getElementById('failedItemsList');

    if (!textarea) {
        console.error("Failed Items Display: Textarea with ID 'failedItemsList' not found!"); // NEW LOG
        return;
    }

    // Retrieve data from chrome.storage.local
    console.log("Failed Items Display: Attempting to retrieve 'lastFailedItems' from chrome.storage.local."); // NEW LOG
    chrome.storage.local.get('lastFailedItems', function(data) {
        if (chrome.runtime.lastError) {
            textarea.value = `Error retrieving failed items: ${chrome.runtime.lastError.message}`;
            console.error("Error retrieving 'lastFailedItems' from chrome.storage.local:", chrome.runtime.lastError);
            return;
        }

        console.log("Failed Items Display: Data retrieved:", data); // NEW LOG

        if (data.lastFailedItems && Array.isArray(data.lastFailedItems) && data.lastFailedItems.length > 0) {
            textarea.value = data.lastFailedItems.join('\n');
            console.log("Successfully loaded and displayed failed items.");
            // Optionally clear the stored data after reading it, good practice
            chrome.storage.local.remove('lastFailedItems').then(() => {
                console.log("'lastFailedItems' cleared from storage.");
            }).catch(e => {
                console.error("Error clearing 'lastFailedItems' from storage:", e);
            });
        } else {
            textarea.value = "No failed items reported from last run, or data format invalid.";
            console.warn("No valid 'lastFailedItems' found in chrome.storage.local or it's empty or not an array."); // NEW LOG detail
        }
    });
});