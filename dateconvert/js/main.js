/* Main.js - Application Initialization and Setup */

// Set default values on page load
window.onload = function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Set primary reference defaults
    document.getElementById('referenceDate1').value = `${year}-${month}-${day}`;
    document.getElementById('referenceTimeFrom1').value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    document.getElementById('referenceTimeTo1').value = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    // Initialize custom time input functionality
    initializeCustomTimeInputs();
    
    // Set secondary reference defaults (optional) - start empty
    document.getElementById('referenceDate2').value = '';
    document.getElementById('referenceDate3').value = '';
    document.getElementById('referenceDate4').value = '';

    // Try to detect user's timezone
    try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneSelect = document.getElementById('referenceTimezone');
        
        // Find matching option
        for (let option of timezoneSelect.options) {
            if (option.value === userTimezone) {
                timezoneSelect.value = userTimezone;
                break;
            }
        }
    } catch (e) {
        console.log('Could not detect timezone');
    }
};
