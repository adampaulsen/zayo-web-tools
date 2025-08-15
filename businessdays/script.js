// Business Date Calculator - Enhanced Version
class BusinessDateCalculator {
    constructor() {
        this.initializeElements();
        this.setupHolidays();
        this.bindEvents();
        this.initializeApp();
    }

    initializeElements() {
        // Input elements
        this.startDateInput = document.getElementById('startDate');
        this.businessDaysInput = document.getElementById('businessDays');
        
        // Button elements
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.copyBtn = document.getElementById('copyBtn');
        
        // Result elements
        this.resultSection = document.getElementById('resultSection');
        this.displayStartDate = document.getElementById('displayStartDate');
        this.displayBusinessDays = document.getElementById('displayBusinessDays');
        this.displayResultDate = document.getElementById('displayResultDate');
        
        // Quick calculation elements
        this.quick5Days = document.getElementById('quick5Days');
        this.quick10Days = document.getElementById('quick10Days');
        this.quick15Days = document.getElementById('quick15Days');
        this.quick20Days = document.getElementById('quick20Days');
        
        // Current date display
        this.currentDateDisplay = document.getElementById('currentDateDisplay');
        
        // Toast notification
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        this.calculateBtn.addEventListener('click', () => this.handleCalculate());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        this.copyBtn.addEventListener('click', () => this.handleCopy());
        
        // Enter key support
        this.businessDaysInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCalculate();
        });
        
        // Input validation
        this.businessDaysInput.addEventListener('input', () => this.validateInput());
    }

    initializeApp() {
        // Set default start date to today
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        this.startDateInput.value = todayString;
        
        // Calculate quick results
        this.updateQuickCalculations();
    }

    setupHolidays() {
        // US Federal Holidays for 2024-2025
        this.holidays = new Set([
            // 2024
            '2024-01-01', // New Year's Day
            '2024-01-15', // Martin Luther King Jr. Day (3rd Monday)
            '2024-02-19', // Presidents' Day (3rd Monday)
            '2024-05-27', // Memorial Day (Last Monday)
            '2024-07-04', // Independence Day
            '2024-09-02', // Labor Day (1st Monday)
            '2024-10-14', // Columbus Day (2nd Monday)
            '2024-11-11', // Veterans Day
            '2024-11-28', // Thanksgiving Day (4th Thursday)
            '2024-12-25', // Christmas Day
            
            // 2025
            '2025-01-01', // New Year's Day
            '2025-01-20', // Martin Luther King Jr. Day
            '2025-02-17', // Presidents' Day
            '2025-05-26', // Memorial Day
            '2025-07-04', // Independence Day
            '2025-09-01', // Labor Day
            '2025-10-13', // Columbus Day
            '2025-11-11', // Veterans Day
            '2025-11-27', // Thanksgiving Day
            '2025-12-25', // Christmas Day
        ]);
    }

    validateInput() {
        const value = parseInt(this.businessDaysInput.value);
        const isValid = value >= 1 && value <= 365;
        
        this.calculateBtn.disabled = !isValid;
        
        if (!isValid && this.businessDaysInput.value !== '') {
            this.showToast('Please enter a number between 1 and 365', 'error');
        }
    }

    async handleCalculate() {
        try {
            this.setLoadingState(true);
            
            const startDate = new Date(this.startDateInput.value);
            const businessDays = parseInt(this.businessDaysInput.value);
            
            if (isNaN(startDate.getTime())) {
                throw new Error('Please select a valid start date');
            }
            
            if (isNaN(businessDays) || businessDays < 1 || businessDays > 365) {
                throw new Error('Please enter a valid number of business days (1-365)');
            }
            
            // Simulate calculation delay for better UX
            await this.delay(500);
            
            const resultDate = this.calculateBusinessDate(startDate, businessDays);
            this.displayResults(startDate, businessDays, resultDate);
            
            this.showToast('Calculation completed successfully!', 'success');
            
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    calculateBusinessDate(startDate, numBusinessDays) {
        let date = new Date(startDate.getTime());
        let businessDaysAdded = 0;
        let daysChecked = 0;
        const maxDays = numBusinessDays * 3; // Prevent infinite loops
        
        // If start date is not a business day, find the next business day
        if (!this.isBusinessDay(date)) {
            date = this.getNextBusinessDay(date);
        }
        
        while (businessDaysAdded < numBusinessDays && daysChecked < maxDays) {
            date.setDate(date.getDate() + 1);
            daysChecked++;
            
            if (this.isBusinessDay(date)) {
                businessDaysAdded++;
            }
        }
        
        if (businessDaysAdded < numBusinessDays) {
            throw new Error('Unable to calculate result. Please try a smaller number of business days.');
        }
        
        return date;
    }

    getNextBusinessDay(date) {
        let nextDate = new Date(date.getTime());
        
        // Keep moving forward until we find a business day
        while (!this.isBusinessDay(nextDate)) {
            nextDate.setDate(nextDate.getDate() + 1);
        }
        
        return nextDate;
    }

    isBusinessDay(date) {
        const dayOfWeek = date.getDay();
        
        // Check if it's a weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return false;
        }
        
        // Check if it's a holiday (with safety check)
        if (this.holidays && this.holidays.size > 0) {
            const dateString = date.toISOString().split('T')[0];
            if (this.holidays.has(dateString)) {
                return false;
            }
        }
        
        return true;
    }

    displayResults(startDate, businessDays, resultDate) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        this.displayStartDate.textContent = startDate.toLocaleDateString('en-US', options);
        this.displayBusinessDays.textContent = businessDays;
        this.displayResultDate.textContent = resultDate.toLocaleDateString('en-US', options);
        
        this.resultSection.hidden = false;
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    handleReset() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        this.startDateInput.value = todayString;
        this.businessDaysInput.value = '5';
        this.resultSection.hidden = true;
        
        this.updateQuickCalculations();
        this.showToast('Calculator reset to defaults', 'success');
    }

    async handleCopy() {
        try {
            const resultText = `Start Date: ${this.displayStartDate.textContent}\nBusiness Days: ${this.displayBusinessDays.textContent}\nResult Date: ${this.displayResultDate.textContent}`;
            
            await navigator.clipboard.writeText(resultText);
            this.showToast('Result copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = resultText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Result copied to clipboard!', 'success');
        }
    }

    updateQuickCalculations() {
        const today = new Date();
        
        // Display current date with weekend/holiday indicator
        const currentDateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        let currentDateText = today.toLocaleDateString('en-US', currentDateOptions);
        if (!this.isBusinessDay(today)) {
            const nextBusinessDay = this.getNextBusinessDay(today);
            const nextBusinessDayText = nextBusinessDay.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            currentDateText += ` (Next business day: ${nextBusinessDayText})`;
        }
        
        this.currentDateDisplay.textContent = currentDateText;
        
        // Ensure holidays are initialized
        if (!this.holidays || this.holidays.size === 0) {
            console.warn('Holidays not initialized, setting up now...');
            this.setupHolidays();
        }
        
        try {
            this.quick5Days.textContent = this.formatQuickResult(
                this.calculateBusinessDate(today, 5)
            );
            this.quick10Days.textContent = this.formatQuickResult(
                this.calculateBusinessDate(today, 10)
            );
            this.quick15Days.textContent = this.formatQuickResult(
                this.calculateBusinessDate(today, 15)
            );
            this.quick20Days.textContent = this.formatQuickResult(
                this.calculateBusinessDate(today, 20)
            );
        } catch (error) {
            console.error('Error updating quick calculations:', error);
            // Show fallback values if calculation fails
            this.quick5Days.textContent = 'Error';
            this.quick10Days.textContent = 'Error';
            this.quick15Days.textContent = 'Error';
            this.quick20Days.textContent = 'Error';
        }
    }

    formatQuickResult(date) {
        const options = { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
        };
        return date.toLocaleDateString('en-US', options);
    }

    setLoadingState(loading) {
        this.calculateBtn.disabled = loading;
        
        if (loading) {
            this.calculateBtn.classList.add('loading');
        } else {
            this.calculateBtn.classList.remove('loading');
        }
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.hidden = false;
        
        // Trigger reflow for animation
        this.toast.offsetHeight;
        this.toast.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
            setTimeout(() => {
                this.toast.hidden = true;
            }, 300);
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Utility functions
const utils = {
    // Format date for display
    formatDate(date, options = {}) {
        const defaultOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },
    
    // Check if date is today
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },
    
    // Get days between two dates
    getDaysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    }
};

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new BusinessDateCalculator();
        console.log('Business Date Calculator initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Business Date Calculator:', error);
        
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h2>Something went wrong</h2>
            <p>We're having trouble loading the calculator. Please refresh the page or try again later.</p>
            <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Service Worker registration for offline functionality (commented out for now)
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/sw.js')
//             .then(registration => {
//                 console.log('SW registered: ', registration);
//             })
//             .catch(registrationError => {
//                 console.log('SW registration failed: ', registrationError);
//             });
//     });
// }

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page loaded in ${loadTime}ms`);
    });
}
