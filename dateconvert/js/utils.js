/* Utils.js - Utility Functions and Constants */

// Timezone mapping for Salesforce data
const timezoneMap = {
    'Central (SA)': 'America/Chicago',
    'Mountain (SA)': 'America/Denver',
    'Eastern (SA)': 'America/New_York',
    'Pacific (SA)': 'America/Los_Angeles',
    'Alaska (SA)': 'America/Anchorage',
    'Hawaii (SA)': 'Pacific/Honolulu',
    'GMT (SA)': 'UTC',
    'UTC (SA)': 'UTC',
    'Arizona (SA)': 'America/Phoenix',
    'Atlantic (SA)': 'America/Halifax',
    'Irish (SA)': 'Europe/Dublin',
    'CET (SA)': 'Europe/Paris',
    'IST (SA)': 'Asia/Kolkata'
};

// Get timezone offset for the current date
function getTimezoneOffset(timezone) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + (getTimezoneOffsetHours(timezone) * 3600000));
    const offset = targetTime.getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset > 0 ? '-' : '+';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Get timezone offset hours
function getTimezoneOffsetHours(timezone) {
    const offsets = {
        'UTC': 0,
        'Europe/Dublin': 0, // Irish Standard Time (GMT/BST)
        'Europe/Paris': 1, // Central European Time (CET/CEST)
        'Asia/Kolkata': 5.5, // India Standard Time
        'America/Anchorage': -9, // Alaska Time
        'America/Los_Angeles': -8, // Pacific Time
        'America/Phoenix': -7, // Arizona Time (MST - No DST)
        'America/Denver': -7, // Mountain Time
        'America/Chicago': -6, // Central Time
        'America/New_York': -5, // Eastern Time
        'America/Halifax': -4, // Atlantic Time
        'Pacific/Honolulu': -10, // Hawaii Time
        'Europe/London': 0, // GMT/BST
        'Asia/Tokyo': 9, // JST
        'Australia/Sydney': 10 // AEST/AEDT
    };
    return offsets[timezone] || 0;
}

// Format maintenance window with overnight handling
function formatMaintenanceWindow(dateStr, timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!timeMatch) return `${dateStr} ${timeStr}`;
    
    const startHour = parseInt(timeMatch[1]);
    const startMinute = parseInt(timeMatch[2]);
    const endHour = parseInt(timeMatch[3]);
    const endMinute = parseInt(timeMatch[4]);
    
    // Check if this is an overnight window (end time is before start time)
    if (endHour < startHour) {
        const startDate = new Date(dateStr);
        const endDate = new Date(dateStr);
        endDate.setDate(endDate.getDate() + 1);
        
        const startDateFormatted = startDate.toISOString().split('T')[0];
        const endDateFormatted = endDate.toISOString().split('T')[0];
        
        return `${startDateFormatted} ${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} - ${endDateFormatted} ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    } else {
        return `${dateStr} ${timeStr}`;
    }
}

// Format reference time range with overnight handling
function formatReferenceTimeRange(dateStr, timeFrom, timeTo) {
    let fromMatch = timeFrom.match(/^(\d{1,2}):(\d{2})$/);
    let toMatch = timeTo.match(/^(\d{1,2}):(\d{2})$/);
    
    // If no colon format, try HHMM format
    if (!fromMatch) {
        fromMatch = timeFrom.match(/^(\d{1,2})(\d{2})$/);
    }
    if (!toMatch) {
        toMatch = timeTo.match(/^(\d{1,2})(\d{2})$/);
    }
    
    if (!fromMatch || !toMatch) return `${timeFrom} to ${timeTo}`;
    
    const startHour = parseInt(fromMatch[1]);
    const startMinute = parseInt(fromMatch[2]);
    const endHour = parseInt(toMatch[1]);
    const endMinute = parseInt(toMatch[2]);
    
    // Check if user has explicitly marked this as before midnight
    const isBeforeMidnight = document.getElementById('beforeMidnightCheck').checked;
    
    if (isBeforeMidnight) {
        const startDate = new Date(dateStr);
        const endDate = new Date(dateStr);
        endDate.setDate(endDate.getDate() + 1);
        
        const startDateFormatted = startDate.toISOString().split('T')[0];
        const endDateFormatted = endDate.toISOString().split('T')[0];
        
        return `${startDateFormatted} ${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} to ${endDateFormatted} ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    } else {
        return `${dateStr} ${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} to ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    }
}
