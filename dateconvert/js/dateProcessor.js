/* DateProcessor.js - Date Parsing and Comparison Logic */

// Extract date and time from a line of data
function extractDateTime(line) {
    // Look for date patterns like YYYY-MM-DD
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return null;

    // Look for time patterns like "22:00 - 10:00 Central (SA)"
    const timeMatch = line.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+([^(]+?)\s*\([^)]+\)/);
    if (!timeMatch) return null;

    return {
        date: dateMatch[1],
        time: `${timeMatch[1]} - ${timeMatch[2]} ${timeMatch[3].trim()}`,
        timezone: timeMatch[3].trim(),
        fullLine: line
    };
}

// Process raw table data from Salesforce
function processRawTableData(dataInput) {
    const lines = dataInput.split('\n').filter(line => line.trim());
    const extractedData = [];
    
    for (let line of lines) {
        // Split by tabs or multiple spaces to handle table columns
        const columns = line.split(/\t|\s{2,}/).filter(col => col.trim());
        
        if (columns.length >= 2) {
            // Look for all dates in the line
            let allDates = [];
            let timeFound = null;
            let timezoneFound = null;
            let ttnFound = null;
            
            for (let column of columns) {
                // Look for all date patterns in this column
                const dateMatches = column.match(/(\d{4}-\d{2}-\d{2})/g);
                if (dateMatches) {
                    allDates.push(...dateMatches);
                }
                
                // Look for time pattern
                const timeMatch = column.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+([^(]+?)\s*\([^)]+\)/);
                if (timeMatch && !timeFound) {
                    timeFound = `${timeMatch[1]} - ${timeMatch[2]} ${timeMatch[3].trim()}`;
                    timezoneFound = timeMatch[3].trim();
                }
                
                // Look for TTN pattern (TTN-XXXXXXXXXX)
                const ttnMatch = column.match(/TTN-(\d+)/);
                if (ttnMatch && !ttnFound) {
                    ttnFound = `TTN-${ttnMatch[1]}`;
                }
            }
            
            // Remove duplicate dates and sort them
            allDates = [...new Set(allDates)].sort();
            
            // If we found time and at least one date, add to extracted data
            if (timeFound && allDates.length > 0) {
                // Create a separate maintenance window for each date
                allDates.forEach((date, index) => {
                    let dateType = 'Primary';
                    if (allDates.length > 1) {
                        if (index === 0) dateType = 'Primary';
                        else if (index === 1) dateType = 'Secondary';
                        else if (index === 2) dateType = 'Tertiary';
                        else dateType = `Backup ${index - 2}`;
                    }
                    
                    extractedData.push({
                        date: date,
                        time: timeFound,
                        timezone: timezoneFound,
                        ttn: ttnFound || 'N/A',
                        fullLine: line.trim(),
                        dateType: dateType,
                        totalDates: allDates.length
                    });
                });
            }
        }
    }
    
    return extractedData;
}

// Parse date and time into Date objects
function parseDateTime(dateStr, timeStr, timezoneStr) {
    try {
        // Map timezone string to IANA timezone
        const timezone = timezoneMap[timezoneStr] || 'UTC';
        
        // Extract start and end times
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (!timeMatch) return null;

        const startHour = parseInt(timeMatch[1]);
        const startMinute = parseInt(timeMatch[2]);
        const endHour = parseInt(timeMatch[3]);
        const endMinute = parseInt(timeMatch[4]);

        // Create start and end dates in the maintenance timezone
        const timezoneOffset = getTimezoneOffset(timezone);
        const startDate = new Date(`${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00${timezoneOffset}`);
        let endDate = new Date(`${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00${timezoneOffset}`);

        // Handle overnight maintenance (end time is before start time)
        if (endHour < startHour) {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        // Handle zero-duration maintenance (same start and end time) - treat as 24-hour maintenance
        if (startHour === endHour && startMinute === endMinute) {
            endDate.setDate(endDate.getDate() + 1);
        }

        return {
            start: startDate,
            end: endDate,
            timezone: timezone,
            originalTimezone: timezoneStr
        };
    } catch (e) {
        console.error('Error parsing datetime:', e);
        return null;
    }
}

// Process data with single reference
function processData(referenceDate, referenceTimeFrom, referenceTimeTo, referenceTimezone, dataInput) {
    const results = [];
    let beforeCount = 0, duringCount = 0, afterCount = 0;

    // Create reference datetime range
    const referenceDateTimeFrom = new Date(`${referenceDate}T${referenceTimeFrom}`);
    const referenceDateTimeTo = new Date(`${referenceDate}T${referenceTimeTo}`);
    
    // Handle overnight reference time based on checkbox
    const isBeforeMidnight = document.getElementById('beforeMidnightCheck').checked;
    if (isBeforeMidnight) {
        referenceDateTimeTo.setDate(referenceDateTimeTo.getDate() + 1);
    }
    
    const referenceInUTCFrom = new Date(referenceDateTimeFrom.toLocaleString('en-US', { timeZone: referenceTimezone }));
    const referenceInUTCTo = new Date(referenceDateTimeTo.toLocaleString('en-US', { timeZone: referenceTimezone }));

    // Process raw table data
    const extractedData = processRawTableData(dataInput);

    for (let extracted of extractedData) {
        const parsed = parseDateTime(extracted.date, extracted.time, extracted.timezone);
        if (parsed) {
            // Convert reference time range to maintenance timezone for comparison
            const referenceInMaintenanceTZFrom = new Date(referenceInUTCFrom.toLocaleString('en-US', {
                timeZone: parsed.timezone
            }));
            const referenceInMaintenanceTZTo = new Date(referenceInUTCTo.toLocaleString('en-US', {
                timeZone: parsed.timezone
            }));

            let comparison = '';
            let type = '';

            // Check for overlap between reference time range and maintenance window
            const referenceEndsBeforeMaintenance = referenceInMaintenanceTZTo < parsed.start;
            const referenceStartsAfterMaintenance = referenceInMaintenanceTZFrom > parsed.end;
            
            if (referenceEndsBeforeMaintenance) {
                comparison = `Reference time range is BEFORE the maintenance window`;
                type = 'before';
                beforeCount++;
            } else if (referenceStartsAfterMaintenance) {
                comparison = `Reference time range is AFTER the maintenance window`;
                type = 'after';
                afterCount++;
            } else {
                comparison = `Reference time range OVERLAPS with the maintenance window`;
                type = 'during';
                duringCount++;
            }

            results.push({
                type: type,
                date: extracted.date,
                time: extracted.time,
                timezone: extracted.timezone,
                ttn: extracted.ttn,
                start: parsed.start.toLocaleString('en-US', { timeZone: parsed.timezone }),
                end: parsed.end.toLocaleString('en-US', { timeZone: parsed.timezone }),
                comparison: comparison,
                fullLine: extracted.fullLine,
                referenceTimezone: referenceTimezone,
                referenceTimeFrom: referenceTimeFrom,
                referenceTimeTo: referenceTimeTo
            });
        }
    }

    displayResults(results, beforeCount, duringCount, afterCount);
}

// Process data with multiple references
function processMultipleReferences(
    referenceDate1, referenceTimeFrom1, referenceTimeTo1,
    referenceDate2, referenceTimeFrom2, referenceTimeTo2,
    referenceDate3, referenceTimeFrom3, referenceTimeTo3,
    referenceDate4, referenceTimeFrom4, referenceTimeTo4,
    referenceTimezone, dataInput
) {
    const allResults = [];
    let totalBeforeCount = 0, totalDuringCount = 0, totalAfterCount = 0;

    // Create array of reference time ranges
    const references = [
        { date: referenceDate1, from: referenceTimeFrom1, to: referenceTimeTo1, name: 'Primary Reference' },
        { date: referenceDate2, from: referenceTimeFrom2, to: referenceTimeTo2, name: 'Reference 2' },
        { date: referenceDate3, from: referenceTimeFrom3, to: referenceTimeTo3, name: 'Reference 3' },
        { date: referenceDate4, from: referenceTimeFrom4, to: referenceTimeTo4, name: 'Reference 4' }
    ];

    // Debug: Log which references are being used
    console.log('References being processed:', references.map(ref => ({
        name: ref.name,
        date: ref.date,
        hasDate: !!ref.date
    })));

    // Process raw table data
    const extractedData = processRawTableData(dataInput);

    for (let extracted of extractedData) {
        const parsed = parseDateTime(extracted.date, extracted.time, extracted.timezone);
        if (parsed) {
            let bestResult = null;
            let hasConflict = false;

            // Check each reference against this maintenance window
            let allConflicts = [];
            
            for (let i = 0; i < references.length; i++) {
                const ref = references[i];
                
                // Skip if reference is not filled out (except primary)
                if (i > 0 && !ref.date) {
                    continue;
                }
                
                // Parse times for comparison - handle both HH:MM and HHMM formats
                let refStartHour, refStartMin, refEndHour, refEndMin;
                
                // Parse reference start time
                if (ref.from.includes(':')) {
                    refStartHour = parseInt(ref.from.split(':')[0]);
                    refStartMin = parseInt(ref.from.split(':')[1]);
                } else {
                    // Handle HHMM format
                    refStartHour = parseInt(ref.from.substring(0, 2));
                    refStartMin = parseInt(ref.from.substring(2, 4));
                }
                
                // Parse reference end time
                if (ref.to.includes(':')) {
                    refEndHour = parseInt(ref.to.split(':')[0]);
                    refEndMin = parseInt(ref.to.split(':')[1]);
                } else {
                    // Handle HHMM format
                    refEndHour = parseInt(ref.to.substring(0, 2));
                    refEndMin = parseInt(ref.to.substring(2, 4));
                }
                
                const maintStartHour = parseInt(extracted.time.split(' - ')[0].split(':')[0]);
                const maintStartMin = parseInt(extracted.time.split(' - ')[0].split(':')[1]);
                const maintEndHour = parseInt(extracted.time.split(' - ')[1].split(' ')[0].split(':')[0]);
                const maintEndMin = parseInt(extracted.time.split(' - ')[1].split(' ')[0].split(':')[1]);
                
                // Convert to minutes for easier comparison
                const refStartMinutes = refStartHour * 60 + refStartMin;
                const refEndMinutes = refEndHour * 60 + refEndMin;
                const maintStartMinutes = maintStartHour * 60 + maintStartMin;
                const maintEndMinutes = maintEndHour * 60 + maintEndMin;
                
                // Check if user has explicitly marked this as before midnight
                const isRefOvernight = document.getElementById('beforeMidnightCheck').checked;
                const isMaintOvernight = maintEndMinutes < maintStartMinutes;
                
                let comparison = '';
                let type = '';
                
                // Create date objects for comparison
                const refStartDate = new Date(ref.date);
                const refEndDate = new Date(ref.date);
                if (isRefOvernight) {
                    refEndDate.setDate(refEndDate.getDate() + 1);
                }
                
                const maintStartDate = new Date(extracted.date);
                const maintEndDate = new Date(extracted.date);
                if (isMaintOvernight) {
                    maintEndDate.setDate(maintEndDate.getDate() + 1);
                }
                
                // Check if date ranges overlap
                const refStart = refStartDate.getTime() + refStartMinutes * 60000;
                const refEnd = refEndDate.getTime() + refEndMinutes * 60000;
                const maintStart = maintStartDate.getTime() + maintStartMinutes * 60000;
                const maintEnd = maintEndDate.getTime() + maintEndMinutes * 60000;
                
                // Compare the full datetime ranges
                if (refEnd <= maintStart) {
                    comparison = `${ref.name} time range is BEFORE the maintenance window`;
                    type = 'before';
                } else if (refStart >= maintEnd) {
                    comparison = `${ref.name} time range is AFTER the maintenance window`;
                    type = 'after';
                } else {
                    comparison = `${ref.name} time range OVERLAPS with the maintenance window`;
                    type = 'during';
                    hasConflict = true;
                }
                
                // Debug logging for comparison
                console.log('Comparison Debug:', {
                    reference: {
                        date: ref.date,
                        time: `${ref.from} - ${ref.to}`,
                        startDateTime: new Date(refStart),
                        endDateTime: new Date(refEnd),
                        isOvernight: isRefOvernight
                    },
                    maintenance: {
                        date: extracted.date,
                        time: extracted.time,
                        startDateTime: new Date(maintStart),
                        endDateTime: new Date(maintEnd),
                        isOvernight: isMaintOvernight
                    },
                    result: {
                        comparison: comparison,
                        type: type
                    }
                });

                // Store the result for this reference
                const result = {
                    type: type,
                    date: extracted.date,
                    time: extracted.time,
                    timezone: extracted.timezone,
                    ttn: extracted.ttn,
                    start: parsed.start.toLocaleString('en-US', { timeZone: parsed.timezone }),
                    end: parsed.end.toLocaleString('en-US', { timeZone: parsed.timezone }),
                    comparison: comparison,
                    fullLine: extracted.fullLine,
                    referenceTimezone: referenceTimezone,
                    referenceDate: ref.date,
                    referenceTimeFrom: ref.from,
                    referenceTimeTo: ref.to,
                    referenceName: ref.name
                };

                // Collect all conflicts
                if (type === 'during') {
                    allConflicts.push(result);
                } else if (!bestResult) {
                    bestResult = result;
                }
            }

            // Add results to overall results
            if (allConflicts.length > 0) {
                // If there are conflicts, add all of them
                allConflicts.forEach(conflict => {
                    allResults.push(conflict);
                    totalDuringCount++;
                });
            } else if (bestResult) {
                // If no conflicts, add the best non-conflict result
                allResults.push(bestResult);
                
                if (bestResult.type === 'before') {
                    totalBeforeCount++;
                } else if (bestResult.type === 'during') {
                    totalDuringCount++;
                } else {
                    totalAfterCount++;
                }
            }
        }
    }

    displayResults(allResults, totalBeforeCount, totalDuringCount, totalAfterCount);
}
