// Utility functions for timezone operations

// Helper function to get GMT offset string for a given timeZone
function getGMTOffset(timeZone, date) {
    const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        timeZoneName: 'shortOffset', // e.g., "GMT-5", "GMT+5:30"
    }).format(date);

    // Extract just the offset part (e.g., "-5", "+5:30")
    const match = formatted.match(/GMT([+-]\d{1,2}(:\d{2})?)/);
    if (match && match[1]) {
        return `GMT ${match[1]}`;
    }
    // Fallback for GMT itself, or if offset extraction fails
    if (timeZone === 'Etc/GMT' || timeZone === 'UTC') {
        return 'GMT+0';
    }
    return '';
}

// Helper function to infer DST status
function getDSTStatus(timeZone, date) {
    // These time zones generally do NOT observe DST
    const noDstZones = ['Etc/GMT', 'UTC', 'America/Phoenix', 'Asia/Kolkata'];
    if (noDstZones.includes(timeZone)) {
        return '(No DST)';
    }

    // Use 'long' timeZoneName to get "Standard Time" or "Daylight Time" / "Summer Time"
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        timeZoneName: 'long' // e.g., "Central Standard Time", "Central Daylight Time", "Irish Summer Time"
    });
    const parts = formatter.formatToParts(date);
    const timeZoneNamePart = parts.find(part => part.type === 'timeZoneName');

    if (timeZoneNamePart) {
        const longName = timeZoneNamePart.value;
        if (longName.includes('Daylight') || longName.includes('Summer')) {
            return '(DST Active)';
        } else if (longName.includes('Standard')) {
            return '(Standard Time)';
        }
    }
    // Fallback for zones where 'long' name doesn't clearly indicate DST status
    return '';
}

// Get user's local timezone with a readable label
function getUserTimezoneLabel(userTimeZone, now) {
    const userTimeZoneNameFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimeZone,
        timeZoneName: 'long'
    });
    const userLongTimeZoneName = userTimeZoneNameFormatter.formatToParts(now)
                                        .find(part => part.type === 'timeZoneName')?.value || userTimeZone;

    // Determine a short, descriptive label for "Your Local Time"
    let mainDisplayLabel = "Your Local Time";
    if (userLongTimeZoneName.includes('Central')) {
        mainDisplayLabel += " (Central)";
    } else if (userLongTimeZoneName.includes('Pacific')) {
        mainDisplayLabel += " (Pacific)";
    } else if (userLongTimeZoneName.includes('Eastern')) {
        mainDisplayLabel += " (Eastern)";
    } else if (userLongTimeZoneName.includes('Mountain')) {
        mainDisplayLabel += " (Mountain)";
    } else if (userLongTimeZoneName.includes('Alaska')) {
        mainDisplayLabel += " (Alaska)";
    } else if (userLongTimeZoneName.includes('Atlantic')) {
        mainDisplayLabel += " (Atlantic)";
    } else if (userLongTimeZoneName.includes('Irish')) {
        mainDisplayLabel += " (Irish)";
    } else if (userLongTimeZoneName.includes('India')) {
        mainDisplayLabel += " (India)";
    } else if (userLongTimeZoneName.includes('Central European')) {
        mainDisplayLabel += " (Central European)";
    } else if (userLongTimeZoneName.includes('Greenwich')) {
        mainDisplayLabel += " (GMT)";
    } else {
        // Fallback for other less common zones, try to extract city/region name
        const parts = userTimeZone.split('/');
        mainDisplayLabel += ` (${parts[parts.length - 1].replace(/_/g, ' ')})`;
    }
    
    return mainDisplayLabel;
}


