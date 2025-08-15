// Timezone data configuration
const TIMEZONE_DATA = {
    // Global zones
    global: [
        { name: 'GMT', timeZone: 'Etc/GMT' },
        { name: 'Irish Standard Time', timeZone: 'Europe/Dublin' },
        { name: 'Central European Time', timeZone: 'Europe/Berlin' },
        { name: 'India (IST)', timeZone: 'Asia/Kolkata' }
    ],
    
    // US zones
    us: [
        { name: 'Alaska', timeZone: 'America/Anchorage' },
        { name: 'Pacific', timeZone: 'America/Los_Angeles' },
        { name: 'Arizona (MST)', timeZone: 'America/Phoenix' },
        { name: 'Mountain', timeZone: 'America/Denver' },
        { name: 'Central', timeZone: 'America/Chicago' },
        { name: 'Eastern', timeZone: 'America/New_York' },
        { name: 'Atlantic', timeZone: 'America/Halifax' },
        { name: 'Newfoundland', timeZone: 'America/St_Johns' }
    ]
};

// Get all timezones combined
function getAllTimezones() {
    return [...TIMEZONE_DATA.global, ...TIMEZONE_DATA.us];
}

// Get timezones by category
function getTimezonesByCategory(category) {
    return TIMEZONE_DATA[category] || [];
}
