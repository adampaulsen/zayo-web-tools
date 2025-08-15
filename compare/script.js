// Global variables to store file data
let fileDataA = null;
let fileDataB = null;
let fileDataRef = null;
let currentResults = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    setupEventListeners();
});

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadAreas = ['fileUploadA', 'fileUploadB'];
    
    uploadAreas.forEach(areaId => {
        const area = document.getElementById(areaId);
        
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
        });
        
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const listType = areaId.includes('A') ? 'A' : 'B';
                handleFile(files[0], listType);
            }
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'Enter':
                    e.preventDefault();
                    compareLists();
                    break;
                case 'r':
                    e.preventDefault();
                    clearAll();
                    break;
                case 's':
                    e.preventDefault();
                    swapLists();
                    break;
            }
        }
    });

    // Add NOR toggle functionality
    const enableNORCheckbox = document.getElementById('enableNOR');
    if (enableNORCheckbox) {
        enableNORCheckbox.addEventListener('change', function() {
            const referencePanel = document.getElementById('referencePanel');
            if (this.checked) {
                referencePanel.style.display = 'block';
            } else {
                referencePanel.style.display = 'none';
            }
        });
    }
}

// Handle file upload
function handleFileUpload(listType, input) {
    const file = input.files[0];
    if (file) {
        handleFile(file, listType);
    }
}

// Process uploaded file
function handleFile(file, listType) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        const fileName = file.name;
        
        // Store file data
        if (listType === 'A') {
            fileDataA = { content, fileName };
            document.getElementById('fileContentA').innerHTML = formatFileContent(content, fileName);
        } else if (listType === 'B') {
            fileDataB = { content, fileName };
            document.getElementById('fileContentB').innerHTML = formatFileContent(content, fileName);
        } else if (listType === 'Ref') {
            fileDataRef = { content, fileName };
            document.getElementById('fileContentRef').innerHTML = formatFileContent(content, fileName);
        }
        
        // Switch to file tab
        switchTab(listType, 'file');
        
        // Auto-populate textarea if empty
        const textarea = document.getElementById(listType === 'Ref' ? 'referenceInput' : `list${listType}Input`);
        if (!textarea.value.trim()) {
            textarea.value = content;
        }
    };
    
    reader.readAsText(file);
}

// Format file content for display
function formatFileContent(content, fileName) {
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    return `
        <div style="margin-bottom: 10px; color: #667eea; font-weight: 500;">
            <i class="fas fa-file"></i> ${fileName} (${lineCount} lines)
        </div>
        <div style="max-height: 150px; overflow-y: auto; background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 10px;">
            ${content.split('\n').slice(0, 20).map(line => 
                `<div style="font-family: monospace; font-size: 0.9rem; padding: 2px 0;">${line || ' '}</div>`
            ).join('')}
            ${lines.length > 20 ? `<div style="color: #6c757d; font-style: italic; text-align: center; padding: 10px;">... and ${lines.length - 20} more lines</div>` : ''}
        </div>
    `;
}

// Switch between text and file tabs
function switchTab(listType, tabType) {
    const textTab = document.getElementById(`textTab${listType}`);
    const fileTab = document.getElementById(`fileTab${listType}`);
    const textButton = textTab.previousElementSibling.previousElementSibling;
    const fileButton = textButton.nextElementSibling;
    
    if (tabType === 'text') {
        textTab.classList.add('active');
        fileTab.classList.remove('active');
        textButton.classList.add('active');
        fileButton.classList.remove('active');
    } else {
        fileTab.classList.add('active');
        textTab.classList.remove('active');
        fileButton.classList.add('active');
        textButton.classList.remove('active');
    }
}

// Main comparison function
function compareLists() {
    const compareBtn = document.getElementById('compareBtn');
    const originalText = compareBtn.innerHTML;
    
    // Show loading state
    compareBtn.innerHTML = '<span class="spinner"></span> Comparing...';
    compareBtn.disabled = true;
    
    // Get input values
    const listAInput = document.getElementById('listAInput').value;
    const listBInput = document.getElementById('listBInput').value;
    const referenceInput = document.getElementById('referenceInput').value;
    
    // Get options
    const caseSensitive = document.getElementById('caseSensitive').checked;
    const trimWhitespace = document.getElementById('trimWhitespace').checked;
    const ignoreEmpty = document.getElementById('ignoreEmpty').checked;
    const enableNOR = document.getElementById('enableNOR').checked;
    
    // Process lists
    const listA = processList(listAInput, caseSensitive, trimWhitespace, ignoreEmpty);
    const listB = processList(listBInput, caseSensitive, trimWhitespace, ignoreEmpty);
    const referenceList = enableNOR ? processList(referenceInput, caseSensitive, trimWhitespace, ignoreEmpty) : [];
    
    // Perform comparison
    const results = performComparison(listA, listB, referenceList, enableNOR);
    
    // Display results
    displayResults(results);
    
    // Store results for export
    currentResults = results;
    
    // Show export section
    document.getElementById('exportSection').style.display = 'block';
    
    // Reset button
    setTimeout(() => {
        compareBtn.innerHTML = originalText;
        compareBtn.disabled = false;
    }, 500);
}

// Process input list based on options
function processList(input, caseSensitive, trimWhitespace, ignoreEmpty) {
    let lines = input.split('\n');
    
    if (trimWhitespace) {
        lines = lines.map(line => line.trim());
    }
    
    if (ignoreEmpty) {
        lines = lines.filter(line => line !== '');
    }
    
    if (!caseSensitive) {
        lines = lines.map(line => line.toLowerCase());
    }
    
    return lines;
}

// Perform the actual comparison using efficient Set operations
function performComparison(listA, listB, referenceList = [], enableNOR = false) {
    const setA = new Set(listA);
    const setB = new Set(listB);
    const setRef = new Set(referenceList);
    
    // Use Set operations for efficiency
    const aOnly = [...setA].filter(item => !setB.has(item));
    const bOnly = [...setB].filter(item => !setA.has(item));
    const intersection = [...setA].filter(item => setB.has(item));
    const union = [...new Set([...listA, ...listB])]; // Preserve original order
    
    // NOR operation: items that are NOT in either list A or B
    let nor = [];
    if (enableNOR && referenceList.length > 0) {
        // NOR = Reference Set - (A OR B)
        const unionSet = new Set([...listA, ...listB]);
        nor = [...setRef].filter(item => !unionSet.has(item));
    } else if (enableNOR && referenceList.length === 0) {
        // Show warning that reference set is needed for NOR
        console.warn('NOR function enabled but no reference set provided');
    }
    
    return {
        aOnly,
        bOnly,
        intersection,
        union,
        nor,
        stats: {
            totalA: listA.length,
            totalB: listB.length,
            uniqueA: setA.size,
            uniqueB: setB.size,
            referenceSize: referenceList.length,
            norEnabled: enableNOR
        }
    };
}

    // Display results in the UI
    function displayResults(results) {
        // Update counts
        document.getElementById('aOnlyCount').textContent = results.aOnly.length;
        document.getElementById('bOnlyCount').textContent = results.bOnly.length;
        document.getElementById('aAndBCount').textContent = results.intersection.length;
        document.getElementById('aOrBCount').textContent = results.union.length;
        document.getElementById('norCount').textContent = results.nor.length;
        
        // Update content
        updateResultContent('aOnlyResults', results.aOnly, 'No items found only in List A');
        updateResultContent('bOnlyResults', results.bOnly, 'No items found only in List B');
        updateResultContent('aAndBResults', results.intersection, 'No common items found between lists');
        updateResultContent('aOrBResults', results.union, 'No items to display');
        
        // Handle NOR results with appropriate messaging
        if (results.stats.norEnabled && results.stats.referenceSize === 0) {
            updateResultContent('norResults', [], 'Please provide a reference set to enable NOR function');
        } else if (results.stats.norEnabled && results.stats.referenceSize > 0) {
            updateResultContent('norResults', results.nor, 'No items found that are neither in A nor B');
        } else {
            updateResultContent('norResults', results.nor, 'NOR function not enabled');
        }
        
                // Add summary notification
        let notificationText = `Comparison complete! Found ${results.aOnly.length} unique to A, ${results.bOnly.length} unique to B, ${results.intersection.length} common items`;
        if (results.stats.norEnabled) {
            notificationText += `, and ${results.nor.length} NOR items`;
        }
        notificationText += '.';
        showNotification(notificationText);
    }

// Update result content with proper formatting
function updateResultContent(elementId, items, emptyMessage) {
    const element = document.getElementById(elementId);
    
    if (items.length === 0) {
        element.innerHTML = `<div class="empty">${emptyMessage}</div>`;
    } else {
        element.innerHTML = items.map(item => 
            `<div class="result-item">${escapeHtml(item)}</div>`
        ).join('');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear all inputs and results
function clearAll() {
    // Clear text inputs
    document.getElementById('listAInput').value = '';
    document.getElementById('listBInput').value = '';
    document.getElementById('referenceInput').value = '';
    
    // Clear file data
    fileDataA = null;
    fileDataB = null;
    fileDataRef = null;
    
    // Reset file content displays
    document.getElementById('fileContentA').innerHTML = 'No file uploaded';
    document.getElementById('fileContentB').innerHTML = 'No file uploaded';
    document.getElementById('fileContentRef').innerHTML = 'No file uploaded';
    
    // Switch back to text tabs
    switchTab('A', 'text');
    switchTab('B', 'text');
    switchTab('Ref', 'text');
    
    // Clear results
    clearResults();
    
    // Hide export section
    document.getElementById('exportSection').style.display = 'none';
    
    // Reset options
    document.getElementById('caseSensitive').checked = false;
    document.getElementById('trimWhitespace').checked = true;
    document.getElementById('ignoreEmpty').checked = true;
    document.getElementById('enableNOR').checked = false;
    
    // Hide reference panel
    document.getElementById('referencePanel').style.display = 'none';
    
    showNotification('All data cleared successfully!');
}

// Clear results
function clearResults() {
    const resultElements = ['aOnlyResults', 'bOnlyResults', 'aAndBResults', 'aOrBResults', 'norResults'];
    const countElements = ['aOnlyCount', 'bOnlyCount', 'aAndBCount', 'aOrBCount', 'norCount'];
    
    resultElements.forEach(id => {
        document.getElementById(id).innerHTML = '<div class="empty">No comparison performed yet</div>';
    });
    
    countElements.forEach(id => {
        document.getElementById(id).textContent = '0';
    });
    
    currentResults = null;
}

// Swap the contents of both lists
function swapLists() {
    const listAInput = document.getElementById('listAInput');
    const listBInput = document.getElementById('listBInput');
    
    const tempValue = listAInput.value;
    listAInput.value = listBInput.value;
    listBInput.value = tempValue;
    
    // Swap file data
    const tempFileData = fileDataA;
    fileDataA = fileDataB;
    fileDataB = tempFileData;
    
    // Update file displays
    if (fileDataA) {
        document.getElementById('fileContentA').innerHTML = formatFileContent(fileDataA.content, fileDataA.fileName);
    } else {
        document.getElementById('fileContentA').innerHTML = 'No file uploaded';
    }
    
    if (fileDataB) {
        document.getElementById('fileContentB').innerHTML = formatFileContent(fileDataB.content, fileDataB.fileName);
    } else {
        document.getElementById('fileContentB').innerHTML = 'No file uploaded';
    }
    
    showNotification('Lists swapped successfully!');
}

// Export results in various formats
function exportResults(format) {
    if (!currentResults) {
        showNotification('No results to export. Please run a comparison first.', 'error');
        return;
    }
    
    let content, filename, mimeType;
    
    switch (format) {
        case 'csv':
            content = generateCSV();
            filename = 'list_comparison_results.csv';
            mimeType = 'text/csv';
            break;
        case 'txt':
            content = generateText();
            filename = 'list_comparison_results.txt';
            mimeType = 'text/plain';
            break;
        case 'json':
            content = generateJSON();
            filename = 'list_comparison_results.json';
            mimeType = 'application/json';
            break;
        default:
            showNotification('Invalid export format', 'error');
            return;
    }
    
    downloadFile(content, filename, mimeType);
    showNotification(`${format.toUpperCase()} export completed successfully!`);
}

// Generate CSV content
function generateCSV() {
    const headers = ['Category', 'Item'];
    const rows = [];
    
    // Add A Only items
    currentResults.aOnly.forEach(item => rows.push(['A Only', item]));
    
    // Add B Only items
    currentResults.bOnly.forEach(item => rows.push(['B Only', item]));
    
    // Add Intersection items
    currentResults.intersection.forEach(item => rows.push(['A & B (Common)', item]));
    
    // Add Union items
    currentResults.union.forEach(item => rows.push(['A OR B (Union)', item]));
    
    // Add NOR items
    currentResults.nor.forEach(item => rows.push(['NOR (Neither A nor B)', item]));
    
    return [headers, ...rows].map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

// Generate text content
function generateText() {
    let content = 'LIST COMPARISON RESULTS\n';
    content += '='.repeat(50) + '\n\n';
    
    content += `A Only (${currentResults.aOnly.length} items):\n`;
    content += currentResults.aOnly.length > 0 ? currentResults.aOnly.join('\n') : 'None\n';
    content += '\n';
    
    content += `B Only (${currentResults.bOnly.length} items):\n`;
    content += currentResults.bOnly.length > 0 ? currentResults.bOnly.join('\n') : 'None\n';
    content += '\n';
    
    content += `A & B Intersection (${currentResults.intersection.length} items):\n`;
    content += currentResults.intersection.length > 0 ? currentResults.intersection.join('\n') : 'None\n';
    content += '\n';
    
    content += `A OR B Union (${currentResults.union.length} items):\n`;
    content += currentResults.union.length > 0 ? currentResults.union.join('\n') : 'None\n';
    content += '\n';
    
    content += `NOR - Neither A nor B (${currentResults.nor.length} items):\n`;
    content += currentResults.nor.length > 0 ? currentResults.nor.join('\n') : 'None\n';
    
    return content;
}

// Generate JSON content
function generateJSON() {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        comparison: {
            aOnly: currentResults.aOnly,
            bOnly: currentResults.bOnly,
            intersection: currentResults.intersection,
            union: currentResults.union,
            nor: currentResults.nor
        },
        statistics: currentResults.stats
    }, null, 2);
}

// Download file helper
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    if (type === 'error') {
        notification.style.background = '#dc3545';
    } else {
        notification.style.background = '#28a745';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}
