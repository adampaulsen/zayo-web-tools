/* UI.js - User Interface and Form Handling */

// Initialize custom time inputs with validation and formatting
function initializeCustomTimeInputs() {
    const timeInputs = document.querySelectorAll('input[type="text"][pattern*="[0-9]:[0-5][0-9]"]');
    
    timeInputs.forEach(input => {
        // Auto-format time input
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/[^0-9:]/g, ''); // Only allow numbers and colon
            
            // Auto-insert colon after 2 digits
            if (value.length === 2 && !value.includes(':')) {
                value = value + ':';
            }
            
            // Limit to HH:MM format
            if (value.length > 5) {
                value = value.substring(0, 5);
            }
            
            this.value = value;
        });
        
        // Validate and format on blur
        input.addEventListener('blur', function() {
            let value = this.value;
            
            // Check if it matches HH:MM format
            const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                let minutes = parseInt(timeMatch[2]);
                
                // Validate ranges
                if (hours < 0) hours = 0;
                if (hours > 23) hours = 23;
                if (minutes < 0) minutes = 0;
                if (minutes > 59) minutes = 59;
                
                // Format with leading zeros
                this.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            } else if (value && value.length > 0) {
                // Try to fix common input patterns
                const fixMatch = value.match(/^(\d{1,2})(\d{2})$/);
                if (fixMatch) {
                    let hours = parseInt(fixMatch[1]);
                    let minutes = parseInt(fixMatch[2]);
                    
                    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                        this.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    } else {
                        this.value = ''; // Clear invalid input
                    }
                } else {
                    this.value = ''; // Clear invalid input
                }
            }
        });
    });
    
    // Add smart checkbox behavior for overnight detection
    const timeFromInput = document.getElementById('referenceTimeFrom1');
    const timeToInput = document.getElementById('referenceTimeTo1');
    const beforeMidnightCheck = document.getElementById('beforeMidnightCheck');
    
    function checkOvernight() {
        const fromValue = timeFromInput.value;
        const toValue = timeToInput.value;
        
        if (fromValue && toValue) {
            const fromMatch = fromValue.match(/^(\d{1,2}):(\d{2})$/);
            const toMatch = toValue.match(/^(\d{1,2}):(\d{2})$/);
            
            if (fromMatch && toMatch) {
                const fromHour = parseInt(fromMatch[1]);
                const toHour = parseInt(toMatch[1]);
                
                // Auto-check if end time is before start time (typical overnight pattern)
                // Only auto-check if user hasn't manually overridden
                if (toHour < fromHour && !beforeMidnightCheck.dataset.manualOverride) {
                    beforeMidnightCheck.checked = true;
                    document.getElementById('autoCheckIndicator').style.display = 'inline';
                }
            }
        }
    }
    
    // Allow manual override of the checkbox
    beforeMidnightCheck.addEventListener('change', function() {
        // User manually changed the checkbox, don't auto-override
        this.dataset.manualOverride = 'true';
        
        // Hide auto-detection indicator if manually unchecked
        if (!this.checked) {
            document.getElementById('autoCheckIndicator').style.display = 'none';
        }
    });
    
    // Check on both inputs
    timeFromInput.addEventListener('blur', checkOvernight);
    timeToInput.addEventListener('blur', checkOvernight);
    
    // Reset manual override when inputs are cleared
    timeFromInput.addEventListener('input', function() {
        if (!this.value) {
            beforeMidnightCheck.dataset.manualOverride = 'false';
        }
    });
    
    timeToInput.addEventListener('input', function() {
        if (!this.value) {
            beforeMidnightCheck.dataset.manualOverride = 'false';
        }
    });
}

// Display comparison results
function displayResults(results, beforeCount, duringCount, afterCount) {
    const resultsDiv = document.getElementById('results');
    const resultsHeader = resultsDiv.querySelector('.results-header');
    const resultsListDiv = document.getElementById('resultsList');

    // Restore the header structure and display summary statistics
    resultsHeader.innerHTML = `
        <h3>Comparison Results</h3>
        <div id="summaryStats">
            <div class="summary-stats">
                <div class="stat-card">
                    <div class="stat-number before">${beforeCount}</div>
                    <div class="stat-label">Before</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number during">${duringCount}</div>
                    <div class="stat-label">During</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number after">${afterCount}</div>
                    <div class="stat-label">After</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${results.length}</div>
                    <div class="stat-label">Total</div>
                </div>
            </div>
        </div>
    `;

    // Sort results: "during" first, then "before", then "after"
    const sortedResults = results.sort((a, b) => {
        const typeOrder = { 'during': 0, 'before': 1, 'after': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
    });

    // Display results list
    if (results.length === 0) {
        resultsListDiv.innerHTML = `
            <div class="no-results">
                <p>No valid maintenance schedules found in the data.</p>
                <p>Please check the format and try again.</p>
            </div>
        `;
    } else {
        let html = '<div class="results-list">';
        
        for (let result of sortedResults) {
            html += `
                <div class="result-item ${result.type}">
                    <div class="result-header">
                        <div class="result-date">${result.date}</div>
                        <div class="result-status ${result.type}">${result.type.toUpperCase()}</div>
                    </div>
                    <div class="result-details">
                        <div class="detail-item">
                            <div class="detail-label">Ticket Number</div>
                            <div class="detail-value">${result.ttn}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Maintenance Time</div>
                            <div class="detail-value">${result.time}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Maintenance Window</div>
                            <div class="detail-value">${formatMaintenanceWindow(result.date, result.time)}${result.dateType && result.totalDates > 1 ? ` (${result.dateType})` : ''}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Reference Time Range</div>
                            <div class="detail-value">${result.referenceName || 'Primary'}: ${formatReferenceTimeRange(result.referenceDate || result.date, result.referenceTimeFrom || result.referenceTimeFrom, result.referenceTimeTo || result.referenceTimeTo)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Maintenance Timezone</div>
                            <div class="detail-value">${result.timezone}</div>
                        </div>
                    </div>
                    <div class="result-comparison">${result.comparison}</div>
                    <div class="timezone-info">
                        <strong>Note:</strong> Times are converted to the maintenance timezone for comparison
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        resultsListDiv.innerHTML = html;
    }

    resultsDiv.style.display = 'block';
}

// Main comparison function
function compareDates() {
    // Get primary reference (mandatory)
    const referenceDate1 = document.getElementById('referenceDate1').value;
    const referenceTimeFrom1 = document.getElementById('referenceTimeFrom1').value;
    const referenceTimeTo1 = document.getElementById('referenceTimeTo1').value;
    
    // Get secondary references (optional) - use primary reference times
    const referenceDate2 = document.getElementById('referenceDate2').value;
    const referenceDate3 = document.getElementById('referenceDate3').value;
    const referenceDate4 = document.getElementById('referenceDate4').value;
    
    const referenceTimezone = document.getElementById('referenceTimezone').value;
    const dataInput = document.getElementById('dataInput').value;
    const resultsDiv = document.getElementById('results');

    if (!referenceDate1 || !referenceTimeFrom1 || !referenceTimeTo1) {
        alert('Please enter the primary reference date and both start and end times.');
        return;
    }

    if (!dataInput.trim()) {
        alert('Please paste some maintenance schedule data.');
        return;
    }

    // Show loading
    resultsDiv.style.display = 'block';
    const resultsHeader = resultsDiv.querySelector('.results-header');
    const resultsList = resultsDiv.querySelector('#resultsList');
    
    if (resultsHeader) {
        resultsHeader.innerHTML = `
            <h3>Comparison Results</h3>
            <div class="loading">
                <div class="spinner"></div>
                <p>Processing maintenance schedules...</p>
            </div>
        `;
    }
    
    if (resultsList) {
        resultsList.innerHTML = '';
    }

    // Process data
    setTimeout(() => {
        processMultipleReferences(
            referenceDate1, referenceTimeFrom1, referenceTimeTo1,
            referenceDate2, referenceTimeFrom1, referenceTimeTo1,
            referenceDate3, referenceTimeFrom1, referenceTimeTo1,
            referenceDate4, referenceTimeFrom1, referenceTimeTo1,
            referenceTimezone, dataInput
        );
    }, 100);
}
