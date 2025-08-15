// Core timezone functionality

// Base options for date formatting
const DATE_OPTIONS = {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
};

// Options for AM/PM time only (NO SECONDS)
const TIME_OPTIONS_AMPM = {
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
};

// Options for 24-hour time only (NO SECONDS)
const TIME_OPTIONS_24HR = {
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
};

// Main function to update all times
function updateTimes() {
    try {
        const centralUSTimeCombinedElement = document.getElementById('centralUSTimeCombined');
        const conusTimesDisplayElement = document.getElementById('conusTimesDisplay');
        
        if (!centralUSTimeCombinedElement || !conusTimesDisplayElement) {
            console.error('Required DOM elements not found');
            return;
        }

        const now = new Date(); // Get current date/time once for all calculations

        // --- Detect User's Local Time Zone ---
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // --- Top Display: User's Local Time (always shows user's actual time zone) ---
        const mainDisplayTimeZone = userTimeZone;
        const mainDisplayLabel = getUserTimezoneLabel(userTimeZone, now);

        const mainDateOptions = { ...DATE_OPTIONS, timeZone: mainDisplayTimeZone };
        const mainTimeAMPMOptions = { ...TIME_OPTIONS_AMPM, timeZone: mainDisplayTimeZone };
        const mainTime24hrOptions = { ...TIME_OPTIONS_24HR, timeZone: mainDisplayTimeZone };

        const mainFormattedDate = now.toLocaleString('en-US', mainDateOptions);
        const mainFormattedTimeAMPM = now.toLocaleString('en-US', mainTimeAMPMOptions);
        const mainFormattedTime24hr = now.toLocaleString('en-US', mainTime24hrOptions);
        const mainGMTOffset = getGMTOffset(mainDisplayTimeZone, now);
        const mainDSTStatus = getDSTStatus(mainDisplayTimeZone, now);

        centralUSTimeCombinedElement.innerHTML =
            `${mainDisplayLabel}: ${mainFormattedDate} ${mainFormattedTimeAMPM} (${mainFormattedTime24hr}) <span class="offset-display">${mainGMTOffset}</span> <span class="dst-status">${mainDSTStatus}</span>`;

        // Check if this is the first load (no existing timezone blocks)
        const existingBlocks = conusTimesDisplayElement.querySelectorAll('.time-zone-block');
        
        if (existingBlocks.length === 0) {
            // First load - create all timezone blocks
            createTimezoneBlocks(conusTimesDisplayElement, now);
        } else {
            // Update existing blocks with new times
            updateExistingBlocks(existingBlocks, now);
        }
    } catch (error) {
        console.error('Error updating times:', error);
        const conusTimesDisplayElement = document.getElementById('conusTimesDisplay');
        if (conusTimesDisplayElement) {
            conusTimesDisplayElement.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Error loading time zones. Please refresh the page.</div>';
        }
    }
}

// Create all timezone blocks (used on first load)
function createTimezoneBlocks(container, now) {
    const allTimeZones = getAllTimezones();
    
    allTimeZones.forEach(zone => {
        const zoneDateOptions = { ...DATE_OPTIONS, timeZone: zone.timeZone };
        const zoneTimeAMPMOptions = { ...TIME_OPTIONS_AMPM, timeZone: zone.timeZone };
        const zoneTime24hrOptions = { ...TIME_OPTIONS_24HR, timeZone: zone.timeZone };

        const formattedDate = now.toLocaleString('en-US', zoneDateOptions);
        const formattedTimeAMPM = now.toLocaleString('en-US', zoneTimeAMPMOptions);
        const formattedTime24hr = now.toLocaleString('en-US', zoneTime24hrOptions);
        const gmtOffset = getGMTOffset(zone.timeZone, now);
        const dstStatus = getDSTStatus(zone.timeZone, now);

        const div = document.createElement('div');
        div.classList.add('time-zone-block');
        div.setAttribute('data-zone', zone.timeZone);
        div.innerHTML = `
            <span class="zone-name">${zone.name}</span>
            <span class="time-display">
                ${formattedDate}<br>${formattedTimeAMPM} (${formattedTime24hr})
            </span>
            <span class="offset-display">${gmtOffset}</span>
            <span class="dst-status">${dstStatus}</span>
        `;
        container.appendChild(div);
    });
}

// Update existing timezone blocks with new times
function updateExistingBlocks(blocks, now) {
    blocks.forEach(block => {
        const timeZone = block.getAttribute('data-zone');
        if (timeZone) {
            const zoneDateOptions = { ...DATE_OPTIONS, timeZone: timeZone };
            const zoneTimeAMPMOptions = { ...TIME_OPTIONS_AMPM, timeZone: timeZone };
            const zoneTime24hrOptions = { ...TIME_OPTIONS_24HR, timeZone: timeZone };

            const formattedDate = now.toLocaleString('en-US', zoneDateOptions);
            const formattedTimeAMPM = now.toLocaleString('en-US', zoneTimeAMPMOptions);
            const formattedTime24hr = now.toLocaleString('en-US', zoneTime24hrOptions);
            const gmtOffset = getGMTOffset(timeZone, now);
            const dstStatus = getDSTStatus(timeZone, now);

            const timeDisplay = block.querySelector('.time-display');
            const offsetDisplay = block.querySelector('.offset-display');
            const dstStatusElement = block.querySelector('.dst-status');

            if (timeDisplay) {
                timeDisplay.innerHTML = `${formattedDate}<br>${formattedTimeAMPM} (${formattedTime24hr})`;
            }
            if (offsetDisplay) {
                offsetDisplay.textContent = gmtOffset;
            }
            if (dstStatusElement) {
                dstStatusElement.textContent = dstStatus;
            }
        }
    });
}

// Initialize the timezone display
function initTimezoneDisplay() {
    // Update times immediately on page load
    updateTimes();
    // Update every second
    setInterval(updateTimes, 1000);
}
