// DOM elements
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const formatBtn = document.getElementById('formatBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const extractHighProfileBtn = document.getElementById('extractHighProfileBtn');

// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize theme
function initTheme() {
    html.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
}

// Update theme icon
function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
    themeToggle.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
}

// Toggle theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon(currentTheme);
}

// Format text function
function formatText(input) {
    if (!input.trim()) {
        return '';
    }

    const lines = input.split('\n');
    const formattedLines = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Check if this is a header line (contains "Splice Point(s):" or similar)
        if (line.includes('Splice Point(s):') || line.includes('[') && line.includes(']')) {
            formattedLines.push(line);
            continue;
        }
        
        // Check if this is a summary line
        if (line.startsWith('Summary:')) {
            // Remove "Summary:" prefix
            const summaryContent = line.substring(8).trim();
            
            // Add a blank line before the first SPLICE item
            formattedLines.push('');
            
            // Split by " / " and format each item
            const items = summaryContent.split(' / ');
            
            for (let item of items) {
                item = item.trim();
                if (item && item !== '/') {
                    // Remove trailing slash if present
                    if (item.endsWith(' /')) {
                        item = item.slice(0, -2);
                    }
                    if (item.endsWith('/')) {
                        item = item.slice(0, -1);
                    }
                    
                    if (item.trim()) {
                        formattedLines.push(item.trim());
                    }
                }
            }
        } else {
            // For other lines, just add them as-is
            formattedLines.push(line);
        }
    }
    
    return formattedLines.join('\n');
}

// Extract High Profile cases function
function extractHighProfileCases(input) {
    if (!input.trim()) {
        return '';
    }

    const lines = input.split('\n');
    const highProfileCases = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Check for Summary lines that contain High Profile cases
        if (line.startsWith('Summary:')) {
            const summaryContent = line.substring(8).trim();
            const items = summaryContent.split(' / ');
            
            for (let item of items) {
                item = item.trim();
                if (item && item !== '/') {
                    // Remove trailing slash if present
                    if (item.endsWith(' /')) {
                        item = item.slice(0, -2);
                    }
                    if (item.endsWith('/')) {
                        item = item.slice(0, -1);
                    }
                    
                    // Only extract if this SPECIFIC item contains "High Profile" in its status
                    if (item.includes('SPLICE-') && item.includes('High Profile')) {
                        const caseMatch = item.match(/SPLICE-\d+/);
                        if (caseMatch) {
                            // Double-check: "High Profile" must appear after the case number in this specific item
                            const caseNumber = caseMatch[0];
                            const itemAfterCase = item.substring(item.indexOf(caseNumber) + caseNumber.length);
                            
                            // Only add if "High Profile" is actually part of this case's description
                            if (itemAfterCase.includes('High Profile')) {
                                highProfileCases.push(caseNumber);
                            }
                        }
                    }
                }
            }
        }
    }
    
    return highProfileCases.join('\n');
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Text copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Text copied to clipboard!', 'success');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Clear all fields
function clearAll() {
    inputText.value = '';
    outputText.value = '';
    copyBtn.disabled = true;
    extractHighProfileBtn.disabled = true;
    inputText.focus();
}

// Event listeners
themeToggle.addEventListener('click', toggleTheme);

formatBtn.addEventListener('click', () => {
    const input = inputText.value;
    if (!input.trim()) {
        showNotification('Please enter some text to format.', 'error');
        return;
    }
    
    const formatted = formatText(input);
    outputText.value = formatted;
    copyBtn.disabled = false;
    extractHighProfileBtn.disabled = false;
    
    if (formatted) {
        showNotification('Text formatted successfully!', 'success');
    }
});

clearBtn.addEventListener('click', clearAll);

copyBtn.addEventListener('click', () => {
    const output = outputText.value;
    if (output.trim()) {
        copyToClipboard(output);
    }
});

extractHighProfileBtn.addEventListener('click', () => {
    const input = inputText.value;
    if (!input.trim()) {
        showNotification('Please enter some text first.', 'error');
        return;
    }
    
    const highProfileCases = extractHighProfileCases(input);
    if (highProfileCases) {
        copyToClipboard(highProfileCases);
        showNotification('High Profile cases copied to clipboard!', 'success');
    } else {
        showNotification('No High Profile cases found.', 'info');
    }
});

// Allow Enter key to format text in input field
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        formatBtn.click();
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    // Focus on input field
    inputText.focus();
    

});

// Add error notification style
const style = document.createElement('style');
style.textContent = `
    .notification-error {
        background: #dc3545 !important;
    }
`;
document.head.appendChild(style);
