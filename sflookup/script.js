// SFAST - SalesForce Automation Search Tool
class SFAST {
    constructor() {
        this.baseUrl = 'https://zayo.my.salesforce.com/_ui/search/ui/UnifiedSearchResults?searchType=2&str=';
        this.generatedUrls = [];
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAccessibility();
        this.validateInitialState();
    }

    bindEvents() {
        // Button event listeners
        document.getElementById('generateBtn').addEventListener('click', () => this.generateTable());
        document.getElementById('openAllBtn').addEventListener('click', () => this.openAllUrls());
        document.getElementById('clearResultsBtn').addEventListener('click', () => this.clearResults());
        
        // Input event listeners
        document.getElementById('variables').addEventListener('input', (e) => this.handleInput(e));
        document.getElementById('variables').addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Focus management for accessibility
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    }

    setupAccessibility() {
        // Add ARIA labels and roles
        const textarea = document.getElementById('variables');
        textarea.setAttribute('aria-describedby', 'input-help');
        textarea.setAttribute('aria-label', 'Enter DFIDs or any data separated by commas or new lines');
        
        // Note: Help text is already present in the HTML, so we don't need to create it here
    }

    handleInput(event) {
        const textarea = event.target;
        const value = textarea.value.trim();
        
        // Remove error state if user starts typing
        if (value.length > 0) {
            textarea.classList.remove('error');
            this.hideError();
        }
        
        // Enable/disable generate button based on input
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = value.length === 0;
    }

    handleKeydown(event) {
        // Allow Enter key for new lines
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.generateTable();
        }
        
        // Allow Ctrl+Enter to submit
        if (event.key === 'Enter' && event.ctrlKey) {
            event.preventDefault();
            this.generateTable();
        }
    }

    handleGlobalKeydown(event) {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'Enter':
                    event.preventDefault();
                    this.generateTable();
                    break;
                case 'k':
                    event.preventDefault();
                    document.getElementById('variables').focus();
                    break;
                case 'o':
                    event.preventDefault();
                    if (!document.getElementById('openAllBtn').disabled) {
                        this.openAllUrls();
                    }
                    break;
                case 'c':
                    event.preventDefault();
                    if (!document.getElementById('clearResultsBtn').disabled) {
                        this.clearResults();
                    }
                    break;
            }
        }
    }

    validateInput(input) {
        if (!input || input.trim().length === 0) {
            return { isValid: false, message: 'Please enter at least one value.' };
        }

        const variables = this.parseInput(input);
        if (variables.length === 0) {
            return { isValid: false, message: 'No valid values found. Please check your input format.' };
        }

        if (variables.length > 100) {
            return { isValid: false, message: 'Too many values. Please limit to 100 or fewer.' };
        }

        return { isValid: true, variables };
    }

    parseInput(input) {
        return input
            .split(/[\n,]+/)
            .map(v => v.trim())
            .filter(v => v.length > 0);
    }

    showError(message) {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        const textarea = document.getElementById('variables');
        textarea.classList.add('error');
        textarea.setAttribute('aria-invalid', 'true');
    }

    hideError() {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        const textarea = document.getElementById('variables');
        textarea.classList.remove('error');
        textarea.setAttribute('aria-invalid', 'false');
    }

    showSuccess(message) {
        const successDiv = document.querySelector('.success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
    }

    setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            button.setAttribute('aria-busy', 'false');
        }
    }

    async generateTable() {
        if (this.isProcessing) return;
        
        const textarea = document.getElementById('variables');
        const input = textarea.value;
        
        // Validate input
        const validation = this.validateInput(input);
        if (!validation.isValid) {
            this.showError(validation.message);
            textarea.focus();
            return;
        }

        this.hideError();
        this.isProcessing = true;
        
        const generateBtn = document.getElementById('generateBtn');
        this.setLoading(generateBtn, true);
        
        try {
            // Simulate processing time for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const variables = validation.variables;
            this.generatedUrls = [];
            
            // Clear previous results
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '';
            
            // Create table
            const table = this.createTable(variables);
            resultDiv.appendChild(table);
            
            // Update button states
            this.updateButtonStates(true);
            
            // Show success message
            this.showSuccess(`Successfully generated ${variables.length} URL${variables.length !== 1 ? 's' : ''}`);
            
            // Announce to screen readers
            this.announceToScreenReader(`Generated ${variables.length} URL${variables.length !== 1 ? 's' : ''}`);
            
        } catch (error) {
            console.error('Error generating table:', error);
            this.showError('An error occurred while generating URLs. Please try again.');
        } finally {
            this.setLoading(generateBtn, false);
            this.isProcessing = false;
        }
    }

    createTable(variables) {
        const table = document.createElement('table');
        table.setAttribute('role', 'table');
        table.setAttribute('aria-label', 'Generated SalesForce search URLs');
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headerCell = document.createElement('th');
        headerCell.textContent = 'Generated URLs';
        headerCell.setAttribute('scope', 'col');
        headerRow.appendChild(headerCell);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        variables.forEach((variable, index) => {
            const fullUrl = this.baseUrl + encodeURIComponent(variable);
            this.generatedUrls.push(fullUrl);
            
            const row = document.createElement('tr');
            row.setAttribute('role', 'row');
            
            const cell = document.createElement('td');
            cell.setAttribute('role', 'cell');
            
            const link = document.createElement('a');
            link.href = fullUrl;
            link.textContent = fullUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', `Open SalesForce search for ${variable}`);
            link.setAttribute('title', `Click to open SalesForce search for: ${variable}`);
            
            cell.appendChild(link);
            row.appendChild(cell);
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        return table;
    }

    async openAllUrls() {
        if (this.generatedUrls.length === 0) {
            this.showError('No URLs to open. Please generate URLs first.');
            return;
        }

        const openAllBtn = document.getElementById('openAllBtn');
        this.setLoading(openAllBtn, true);
        
        try {
            // Show confirmation for large numbers
            if (this.generatedUrls.length > 10) {
                const confirmed = confirm(`You're about to open ${this.generatedUrls.length} URLs. This may open many browser tabs. Continue?`);
                if (!confirmed) {
                    this.setLoading(openAllBtn, false);
                    return;
                }
            }
            
            // Open URLs with a slight delay to prevent browser blocking
            for (let i = 0; i < this.generatedUrls.length; i++) {
                const url = this.generatedUrls[i];
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Small delay between openings
                if (i < this.generatedUrls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            this.showSuccess(`Opened ${this.generatedUrls.length} URL${this.generatedUrls.length !== 1 ? 's' : ''}`);
            this.announceToScreenReader(`Opened ${this.generatedUrls.length} URL${this.generatedUrls.length !== 1 ? 's' : ''}`);
            
        } catch (error) {
            console.error('Error opening URLs:', error);
            this.showError('An error occurred while opening URLs. Please try again.');
        } finally {
            this.setLoading(openAllBtn, false);
        }
    }

    clearResults() {
        // Clear results display
        document.getElementById('result').innerHTML = '';
        
        // Clear input
        document.getElementById('variables').value = '';
        
        // Clear stored URLs
        this.generatedUrls = [];
        
        // Update button states
        this.updateButtonStates(false);
        
        // Clear any error/success messages
        this.hideError();
        const successDiv = document.querySelector('.success-message');
        if (successDiv) {
            successDiv.style.display = 'none';
        }
        
        // Focus back to input
        document.getElementById('variables').focus();
        
        // Announce to screen readers
        this.announceToScreenReader('Results cleared');
    }

    updateButtonStates(enabled) {
        document.getElementById('openAllBtn').disabled = !enabled;
        document.getElementById('clearResultsBtn').disabled = !enabled;
        document.getElementById('generateBtn').disabled = false;
    }

    validateInitialState() {
        const textarea = document.getElementById('variables');
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = textarea.value.trim().length === 0;
    }

    announceToScreenReader(message) {
        // Create a live region for screen reader announcements
        let liveRegion = document.getElementById('screen-reader-announcement');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'screen-reader-announcement';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = message;
        
        // Clear after a short delay
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SFAST();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SFAST;
}
