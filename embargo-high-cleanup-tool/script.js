// Embargo High Cleanup Tool - JavaScript Implementation
// Modified from HP CSV Cleanup Tool to focus on Dark Fiber items with FSB report enhancement

class EmbargoHighCleaner {
    constructor() {
        this.originalData = [];
        this.processedData = [];
        this.reportData = null;
        this.originalFilenames = []; // Track original filenames for unique download names
        this.stats = {
            originalRows: 0,
            filteredRows: 0,
            removedDuplicates: 0,
            finalRows: 0
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const clearBtn = document.getElementById('clearBtn');
        const reportUploadArea = document.getElementById('reportUploadArea');
        const reportFileInput = document.getElementById('reportFileInput');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processMultipleFiles(Array.from(e.target.files));
            }
        });

        // Drag and drop for main files
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#3b82f6';
            uploadArea.style.backgroundColor = '#eff6ff';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#d1d5db';
            uploadArea.style.backgroundColor = '#ffffff';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#d1d5db';
            uploadArea.style.backgroundColor = '#ffffff';
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
            if (files.length > 0) {
                this.processMultipleFiles(files);
            }
        });

        // Click to upload report file
        reportUploadArea.addEventListener('click', () => reportFileInput.click());
        
        // Report file input change
        reportFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadReportFile(e.target.files[0]);
            }
        });

        // Drag and drop for report file
        reportUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            reportUploadArea.style.borderColor = '#0ea5e9';
            reportUploadArea.style.backgroundColor = '#f0f9ff';
        });

        reportUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            reportUploadArea.style.borderColor = '#0ea5e9';
            reportUploadArea.style.backgroundColor = '#f8fafc';
        });

        reportUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            reportUploadArea.style.borderColor = '#0ea5e9';
            reportUploadArea.style.backgroundColor = '#f8fafc';
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
            if (files.length > 0) {
                this.loadReportFile(files[0]);
            }
        });

        // Download button
        downloadBtn.addEventListener('click', () => this.downloadCSV());

        // Clear Results button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearResults());
        }
    }

    async processMultipleFiles(files) {
        try {
            // Check if FSB report is loaded
            if (!this.reportData) {
                alert('Please upload an FSB report file first before processing CSV files.');
                return;
            }

            this.showProcessing();
            this.updateProgress(5, `Reading ${files.length} file(s)...`);
            this.originalData = [];
            this.originalFilenames = []; // Reset filenames
            let allProcessed = [];
            let totalOriginalRows = 0;
            let totalRemovedDuplicates = 0;
            let emptyFiles = [];

            for (let i = 0; i < files.length; i++) {
                this.updateProgress(5 + Math.floor(80 * i / files.length), `Processing file ${i+1} of ${files.length}...`);
                const text = await this.readFileAsText(files[i]);
                const data = this.parseCSV(text);
                console.log(`File ${i+1} (${files[i].name}): ${data.length} rows parsed`);
                console.log(`File ${i+1} first 3 rows:`, data.slice(0, 3));
                totalOriginalRows += data.length;
                const cleaned = this.applyTransformations(data);
                console.log(`File ${i+1} after transformations: ${cleaned.length} rows`);
                totalRemovedDuplicates += this.stats.removedDuplicates;
                allProcessed = allProcessed.concat(cleaned);
                
                // Store original filename (without extension)
                const filename = files[i].name.replace(/\.csv$/i, '');
                this.originalFilenames.push(filename);
                
                if (cleaned.length === 0) {
                    // Extract SPLICE-XXXXXX from file name
                    const match = files[i].name.match(/SPLICE-\d{6}/i);
                    if (match) {
                        emptyFiles.push(match[0].toUpperCase());
                    } else {
                        emptyFiles.push(files[i].name);
                    }
                }
            }

            // Remove duplicates across all files based on column 3 (now index 2 after inserting D)
            const seen = new Set();
            const uniqueRows = [];
            for (const row of allProcessed) {
                if (row.length > 2) {
                    const key = row[2];
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueRows.push(row);
                    }
                }
            }
            this.processedData = uniqueRows;
            this.stats.originalRows = totalOriginalRows;
            this.stats.filteredRows = allProcessed.length;
            this.stats.removedDuplicates = totalRemovedDuplicates + (allProcessed.length - uniqueRows.length);
            this.stats.finalRows = uniqueRows.length;

            // Enhance Network Facility column with report data if available
            this.processedData = this.enhanceNetworkFacilityColumn(this.processedData);
            
            // Sort by Network Facility column (empty values at bottom)
            this.processedData.sort((a, b) => {
                const aValue = (a[5] || '').trim(); // Network Facility column (index 5)
                const bValue = (b[5] || '').trim();
                
                // If both are empty, maintain original order
                if (!aValue && !bValue) return 0;
                // If only a is empty, put it at the bottom
                if (!aValue) return 1;
                // If only b is empty, put it at the bottom
                if (!bValue) return -1;
                // Both have values, sort alphabetically
                return aValue.localeCompare(bValue, undefined, {numeric: true, sensitivity: 'base'});
            });

            this.updateProgress(95, 'Finalizing...');
            this.updateStats();
            this.updateProgress(100, 'Complete!');
            setTimeout(() => {
                this.showResults();
                this.displayPreview();
                this.displayEmptyFiles(emptyFiles);
            }, 500);
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files: ' + error.message);
            this.hideProcessing();
        }
    }

    async processFile(file) {
        try {
            this.showProcessing();
            this.updateProgress(10, 'Reading file...');
            
            // Read the file
            const text = await this.readFileAsText(file);
            this.updateProgress(20, 'Parsing CSV...');
            
            // Parse CSV
            this.originalData = this.parseCSV(text);
            this.stats.originalRows = this.originalData.length;
            this.updateProgress(40, 'Applying filters...');
            
            // Apply the same transformations as the Excel macro
            this.processedData = this.applyTransformations(this.originalData);
            this.updateProgress(80, 'Finalizing...');
            
            // Update stats
            this.updateStats();
            this.updateProgress(100, 'Complete!');
            
            // Show results
            setTimeout(() => {
                this.showResults();
                this.displayPreview();
            }, 500);
            
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file: ' + error.message);
            this.hideProcessing();
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseCSV(text) {
        const lines = text.split('\n');
        console.log('Raw text split into', lines.length, 'lines');
        console.log('First few raw lines:', lines.slice(0, 5));
        
        const data = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log(`Line ${i}: "${line}" (length: ${line.length})`);
            if (line) {
                // Simple CSV parsing - split by comma but handle quoted values
                const row = this.parseCSVLine(line);
                data.push(row);
            }
        }
        
        console.log('Parsed CSV data:', data.length, 'rows');
        console.log('First parsed row:', data[0]);
        return data;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    applyTransformations(data) {
        let processed = [...data];
        
        // Step 1: Remove first row (equivalent to Rows("1:1").Select and Delete)
        console.log('Before header removal:', processed.length, 'rows');
        console.log('First row before removal:', processed[0]);
        
        // More robust header removal - check if first row looks like headers
        if (processed.length > 0) {
            console.log('=== HEADER DETECTION DEBUG ===');
            console.log('Total rows to process:', processed.length);
            
            // Check first few rows to see what we're dealing with
            for (let i = 0; i < Math.min(5, processed.length); i++) {
                console.log(`Row ${i}:`, processed[i]);
            }
            
            const firstRow = processed[0];
            console.log('Analyzing first row for header detection:');
            console.log('First row content:', firstRow);
            console.log('First row cell types:', firstRow.map(cell => typeof cell));
            
            const isHeaderRow = firstRow.some(cell => 
                typeof cell === 'string' && 
                (cell.toLowerCase().includes('sheath') || 
                 cell.toLowerCase().includes('fiber') || 
                 cell.toLowerCase().includes('dfid') ||
                 cell.toLowerCase().includes('network') ||
                 cell.toLowerCase().includes('product') ||
                 cell.toLowerCase().includes('customer'))
            );
            
            console.log('Header detection result:', isHeaderRow);
            
            if (isHeaderRow) {
                console.log('First row appears to be headers, removing...');
                processed = processed.slice(1);
                console.log('Rows after header removal:', processed.length);
            } else {
                console.log('First row does not appear to be headers, keeping...');
            }
            console.log('=== END HEADER DETECTION DEBUG ===');
        }
        
        console.log('After header removal:', processed.length, 'rows');
        console.log('First row after removal:', processed[0]);
        this.updateProgress(50, 'Removing header row...');
        
        // Step 2: Delete columns F and G (indices 5 and 6 in 0-based)
        console.log('=== COLUMN REMOVAL DEBUG ===');
        console.log('Before column removal - first row:', processed[0]);
        console.log('Before column removal - first row length:', processed[0] ? processed[0].length : 'N/A');
        
        processed = processed.map(row => {
            const newRow = [...row];
            newRow.splice(5, 2); // Remove columns F and G
            return newRow;
        });
        
        console.log('After column removal - first row:', processed[0]);
        console.log('After column removal - first row length:', processed[0] ? processed[0].length : 'N/A');
        console.log('=== END COLUMN REMOVAL DEBUG ===');
        
        this.updateProgress(60, 'Removing columns F and G...');

        // Normalize all fields: trim whitespace and tabs
        processed = processed.map(row => row.map(cell => (cell || '').replace(/\t/g, '').trim()));

        // Step 3: Keep all rows, but identify Dark Fiber items for later SC/Service extraction
        // We'll mark Dark Fiber rows for special processing
        let darkFiberCount = 0;
        let totalRows = 0;
        processed = processed.map(row => {
            if (row.length > 5) {
                const fiberType = (row[5] || '').toLowerCase();
                const isDarkFiber = fiberType.includes('dark fiber');
                // Add a flag to identify Dark Fiber rows
                row.isDarkFiber = isDarkFiber;
                if (isDarkFiber) darkFiberCount++;
                totalRows++;
            }
            return row;
        });
        console.log(`Identified ${darkFiberCount} Dark Fiber rows out of ${totalRows} total rows`);
        this.updateProgress(65, 'Identifying Dark Fiber items...');

        // Step 4: Insert new column D (insert at index 3)
        processed = processed.map(row => {
            const newRow = [...row];
            newRow.splice(3, 0, ''); // Insert empty column D
            // Preserve the isDarkFiber flag
            newRow.isDarkFiber = row.isDarkFiber;
            return newRow;
        });
        this.updateProgress(70, 'Inserting column D...');
        
        // Step 5: Insert new column "SC or Service" between Network Facility and Product Group
        // After inserting column D, Network Facility is at index 5, Product Group at index 6
        // We'll insert the new column at index 6, shifting Product Group to index 7
        processed = processed.map(row => {
            const newRow = [...row];
            newRow.splice(6, 0, ''); // Insert empty "SC or Service" column
            // Preserve the isDarkFiber flag
            newRow.isDarkFiber = row.isDarkFiber;
            return newRow;
        });
        this.updateProgress(75, 'Inserting SC or Service column...');
        
        // Step 6: Remove duplicates based on column 3 (now index 2 after inserting D)
        const seen = new Set();
        const uniqueRows = [];
        
        for (const row of processed) {
            if (row.length > 2) {
                const key = row[2]; // Column 3 (0-based index 2)
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueRows.push(row);
                }
            }
        }
        
        this.stats.removedDuplicates = processed.length - uniqueRows.length;
        processed = uniqueRows;
        
        return processed;
    }

    updateStats() {
        this.stats.filteredRows = this.processedData.length;
        this.stats.finalRows = this.processedData.length;
        
        document.getElementById('originalRows').textContent = this.stats.originalRows;
        document.getElementById('filteredRows').textContent = this.stats.filteredRows;
        document.getElementById('removedDuplicates').textContent = this.stats.removedDuplicates;
        document.getElementById('finalRows').textContent = this.stats.finalRows;
    }

    displayPreview() {
        const header = document.getElementById('previewHeader');
        const body = document.getElementById('previewBody');
        
        // Clear previous content
        header.innerHTML = '';
        body.innerHTML = '';
        
        if (this.processedData.length === 0) {
            body.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No data matches the filters</td></tr>';
            return;
        }
        
        // Create header
        const headerRow = document.createElement('tr');
        const csvHeaders = [
            'Sheath',
            'Fiber',
            'DFID',
            '', // Untitled column
            'SO Facility/Circuit ID',
            'Network Facility',
            'SC or Service',
            'Product Group',
            'Customer'
        ];
        for (let i = 0; i < csvHeaders.length; i++) {
            const th = document.createElement('th');
            th.textContent = csvHeaders[i];
            headerRow.appendChild(th);
        }
        header.appendChild(headerRow);
        
        // Create preview rows (show first 10 rows)
        const previewRows = this.processedData.slice(0, 10);
        const numCols = 9; // Now 9 columns with the new SC or Service column
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            for (let i = 0; i < numCols; i++) {
                const td = document.createElement('td');
                td.textContent = row[i] || '';
                tr.appendChild(td);
            }
            body.appendChild(tr);
        });
        
        if (this.processedData.length > 10) {
            const moreRow = document.createElement('tr');
            const moreCell = document.createElement('td');
            moreCell.colSpan = numCols;
            moreCell.textContent = `... and ${this.processedData.length - 10} more rows`;
            moreCell.style.textAlign = 'center';
            moreCell.style.fontStyle = 'italic';
            moreCell.style.color = '#6b7280';
            moreRow.appendChild(moreCell);
            body.appendChild(moreRow);
        }
    }

    generateUniqueFilename() {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
        
        if (this.originalFilenames.length === 0) {
            return `embargo_high_cleaned_${timestamp}.csv`;
        }
        
        if (this.originalFilenames.length === 1) {
            const baseName = this.originalFilenames[0];
            return `embargo_high_cleaned_${baseName}_${timestamp}.csv`;
        }
        
        // Multiple files - create a combined name
        const baseNames = this.originalFilenames.map(name => {
            // Extract SPLICE-XXXXXX if present
            const match = name.match(/SPLICE-\d{6}/i);
            return match ? match[0].toUpperCase() : name.substring(0, 10);
        });
        
        const combinedName = baseNames.join('_');
        return `embargo_high_cleaned_${combinedName}_${timestamp}.csv`;
    }

    downloadCSV() {
        if (this.processedData.length === 0) {
            alert('No data to download');
            return;
        }
        
        console.log('Downloading CSV with', this.processedData.length, 'rows');
        console.log('First few rows of processed data:', this.processedData.slice(0, 3));
        
        // Add header row
        const header = [
            'Sheath',
            'Fiber',
            'DFID',
            'SO Facility/Circuit ID | DFID',
            'SO Facility/Circuit ID',
            'Network Facility',
            'SC or Service',
            'Product Group',
            'Customer'
        ];
        // Convert data back to CSV format, with header and Excel formulas in column D
        const dataWithFormulas = this.processedData.map((row, index) => {
            const newRow = [...row];
            // Add Excel formula to column D (index 3)
            const rowNumber = index + 2; // Excel rows start at 2 (after header)
            newRow[3] = `=IF(C${rowNumber}="","",CONCATENATE(E${rowNumber}," | ",C${rowNumber}))`;
            return newRow;
        });
        
        console.log('Data with formulas (first few rows):', dataWithFormulas.slice(0, 3));
        const csvContent = this.convertToCSV([header, ...dataWithFormulas]);
        
        // Generate unique filename
        const filename = this.generateUniqueFilename();
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    convertToCSV(data) {
        return data.map(row => 
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma or quote
                const escaped = String(cell).replace(/"/g, '""');
                if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
                    return `"${escaped}"`;
                }
                return escaped;
            }).join(',')
        ).join('\n');
    }

    showProcessing() {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('processingSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
    }

    hideProcessing() {
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('processingSection').style.display = 'none';
    }

    showResults() {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
    }

    updateProgress(percentage, text) {
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = text;
    }

    displayEmptyFiles(emptyFiles) {
        const listDiv = document.getElementById('emptyFilesList');
        const ul = document.getElementById('emptyFilesUl');
        if (emptyFiles && emptyFiles.length > 0) {
            listDiv.style.display = 'block';
            ul.innerHTML = '';
            emptyFiles.forEach(id => {
                const li = document.createElement('li');
                li.textContent = id;
                ul.appendChild(li);
            });
        } else {
            listDiv.style.display = 'none';
            ul.innerHTML = '';
        }
    }

    clearResults() {
        // Reset all data and stats
        this.originalData = [];
        this.processedData = [];
        this.originalFilenames = []; // Reset filenames
        this.stats = {
            originalRows: 0,
            filteredRows: 0,
            removedDuplicates: 0,
            finalRows: 0
        };
        // Reset UI
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        // Reset stats display
        document.getElementById('originalRows').textContent = '0';
        document.getElementById('filteredRows').textContent = '0';
        document.getElementById('removedDuplicates').textContent = '0';
        document.getElementById('finalRows').textContent = '0';
        // Clear preview table
        document.getElementById('previewHeader').innerHTML = '';
        document.getElementById('previewBody').innerHTML = '';
        // Also clear file input value so the same file can be re-uploaded
        document.getElementById('fileInput').value = '';
        // Clear empty files list
        this.displayEmptyFiles([]);
    }

    async loadReportFile(file) {
        try {
            const text = await this.readFileAsText(file);
            const data = this.parseCSV(text);
            
            if (data.length < 2) {
                alert('Report file must have at least a header and one data row');
                return;
            }
            
            // Validate expected columns
            const header = data[0];
            if (header.length < 9) {
                alert('Report file must have at least 9 columns');
                return;
            }
            
            // Store report data for use during processing
            this.reportData = data;
            
            // Update UI to show report is loaded
            const reportUploadArea = document.getElementById('reportUploadArea');
            reportUploadArea.style.borderColor = '#10b981';
            reportUploadArea.style.backgroundColor = '#f0fdf4';
            reportUploadArea.querySelector('.report-upload-content p').textContent = `Report loaded: ${file.name}`;
            
            console.log('Report file loaded successfully:', data.length, 'rows');
        } catch (error) {
            console.error('Error loading report file:', error);
            alert('Error loading report file: ' + error.message);
        }
    }

    enhanceNetworkFacilityColumn(processedData) {
        if (!this.reportData || this.reportData.length < 2) {
            return processedData; // No report data to enhance with
        }
        
        const reportMap = new Map();
        
        // Build lookup map from report data
        console.log('Building report lookup map...');
        console.log('Report data sample:', this.reportData.slice(0, 3));
        
        for (let i = 1; i < this.reportData.length; i++) {
            const row = this.reportData[i];
            if (row.length >= 9) {
                const darkFiberId = (row[1] || '').trim(); // Column B (index 1) - Dark Fiber ID
                const customerService = (row[3] || '').trim(); // Column D (index 3) - Customer Service
                const serviceComponent = (row[4] || '').trim(); // Column E (index 4) - Service Component
                const status = (row[8] || '').trim(); // Column I (index 8) - Status
                
                if (darkFiberId) {
                    let scOrServiceValue = '';
                    
                    const statusLower = status.toLowerCase();
                    
                    if (statusLower === 'cancelled') {
                        scOrServiceValue = 'Cancelled';
                    } else if (statusLower.includes('disco') || statusLower.includes('disconnect')) {
                        scOrServiceValue = 'disco\'d';
                    } else if (statusLower !== 'cancelled' && !statusLower.includes('disco') && !statusLower.includes('disconnect')) {
                        // Extract SC number or use Customer Service as fallback
                        const scMatch = serviceComponent.match(/SC-(\d{6})/i);
                        if (scMatch) {
                            scOrServiceValue = `SC-${scMatch[1]}`;
                        } else if (customerService) {
                            // Extract text content from HTML links in Customer Service field
                            let csText = customerService;
                            const linkMatch = customerService.match(/<a[^>]*>([^<]*)<\/a>/i);
                            if (linkMatch) {
                                csText = linkMatch[1]; // Extract text content from between <a> tags
                            }
                            // Extract 6-digit number from the text content
                            const csMatch = csText.match(/(\d{6})/);
                            if (csMatch) {
                                scOrServiceValue = csMatch[1]; // Just the 6-digit number
                            }
                        }
                    }
                    
                    if (scOrServiceValue) {
                        reportMap.set(darkFiberId, scOrServiceValue);
                        console.log(`Mapped DFID ${darkFiberId} to ${scOrServiceValue}`);
                    }
                }
            }
        }
        
        console.log(`Built lookup map with ${reportMap.size} entries`);
        
        // Enhance the processed data with report information
        let enhancedCount = 0;
        let totalProcessed = 0;
        
        const result = processedData.map(row => {
            if (row.length > 2) {
                const dfid = (row[2] || '').trim(); // Column C (DFID) in processed data
                totalProcessed++;
                
                // Always create a new row to avoid mutating the original
                const newRow = [...row];
                
                // Only populate SC or Service column for Dark Fiber rows
                if (row.isDarkFiber && dfid && reportMap.has(dfid)) {
                    newRow[6] = reportMap.get(dfid); // Column G (SC or Service) in processed data
                    enhancedCount++;
                    console.log(`Enhanced Dark Fiber row with DFID ${dfid}: ${newRow[6]}`);
                }
                // For non-Dark Fiber rows, leave column 6 empty (which it already is)
                
                return newRow;
            }
            return row;
        });
        
        console.log(`Enhanced ${enhancedCount} Dark Fiber rows out of ${totalProcessed} total processed rows`);
        return result;
    }
}

// Function to toggle the info section
function toggleInfoSection() {
    const infoList = document.getElementById('infoList');
    const triangle = document.getElementById('infoTriangle');
    
    if (infoList.style.display === 'none') {
        infoList.style.display = 'block';
        triangle.style.transform = 'rotate(90deg)';
        triangle.textContent = '▼';
    } else {
        infoList.style.display = 'none';
        triangle.style.transform = 'rotate(0deg)';
        triangle.textContent = '▶';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EmbargoHighCleaner();
});
