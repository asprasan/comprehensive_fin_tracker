// Travel Expense Tracker Application
class ExpenseTracker {
    constructor() {
        this.data = {
            trips: [],
            nextTripId: 1,
            nextExpenseId: 1,
            version: "1.0"
        };
        
        this.exchangeRates = {
            EUR_TO_INR: 95.5
        };
        
        this.categories = [
            {id: "transportation", name: "Transportation", icon: "🚗", color: "var(--color-bg-1)"},
            {id: "accommodation", name: "Accommodation", icon: "🏨", color: "var(--color-bg-2)"},
            {id: "food", name: "Food & Dining", icon: "🍽️", color: "var(--color-bg-3)"},
            {id: "attractions", name: "Attractions", icon: "🎭", color: "var(--color-bg-4)"},
            {id: "shopping", name: "Shopping", icon: "🛍️", color: "var(--color-bg-5)"},
            {id: "miscellaneous", name: "Miscellaneous", icon: "📝", color: "var(--color-bg-6)"}
        ];
        
        this.currentEditingTrip = null;
        this.currentBulkTrip = null;
        this.bulkRows = [];
        this.importedData = null;
        
        this.initializeData();
        this.bindEvents();
        this.bindKeyboardShortcuts();
        this.populateSelectors();
        this.renderTrips();
    }
    
    initializeData() {
        // Initialize with sample data
        const sampleTrips = [
            {
                id: "trip-1",
                name: "Paris Summer Vacation",
                year: 2025,
                startDate: "2025-07-15",
                endDate: "2025-07-22",
                location: "Paris, France",
                budget: 1500,
                createdAt: new Date().toISOString(),
                expenses: [
                    {
                        id: "exp-1",
                        date: "2025-07-15",
                        amount: 450,
                        currency: "EUR",
                        category: "transportation",
                        description: "Flight tickets",
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: "exp-2", 
                        date: "2025-07-16",
                        amount: 120,
                        currency: "EUR", 
                        category: "accommodation",
                        description: "Hotel night 1",
                        createdAt: new Date().toISOString()
                    }
                ]
            },
            {
                id: "trip-2",
                name: "Delhi Business Trip",
                year: 2025,
                startDate: "2025-06-10",
                endDate: "2025-06-13", 
                location: "Delhi, India",
                budget: 800,
                createdAt: new Date().toISOString(),
                expenses: [
                    {
                        id: "exp-3",
                        date: "2025-06-10",
                        amount: 35000,
                        currency: "INR",
                        category: "transportation", 
                        description: "Flight Delhi",
                        createdAt: new Date().toISOString()
                    }
                ]
            }
        ];
        
        this.data.trips = sampleTrips;
        this.data.nextTripId = 3;
        this.data.nextExpenseId = 4;
    }
    
    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Trip modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-trip-btn') {
                e.preventDefault();
                this.openTripModal();
            }
            
            if (e.target.id === 'close-trip-modal' || e.target.id === 'cancel-trip') {
                e.preventDefault();
                this.closeTripModal();
            }
            
            if (e.target.id === 'save-trip') {
                e.preventDefault();
                this.saveTrip();
            }
            
            if (e.target.id === 'close-trip-detail') {
                e.preventDefault();
                this.closeTripDetailModal();
            }
            
            if (e.target.id === 'bulk-add-btn') {
                e.preventDefault();
                this.openBulkExpenseModal();
            }
            
            if (e.target.id === 'close-bulk-modal' || e.target.id === 'cancel-bulk') {
                e.preventDefault();
                this.closeBulkExpenseModal();
            }
            
            if (e.target.id === 'add-bulk-row') {
                e.preventDefault();
                this.addBulkRow();
            }
            
            if (e.target.id === 'remove-bulk-row') {
                e.preventDefault();
                this.removeBulkRow();
            }
            
            if (e.target.id === 'save-bulk-expenses') {
                e.preventDefault();
                this.saveBulkExpenses();
            }
            
            if (e.target.id === 'close-import-modal' || e.target.id === 'cancel-import') {
                e.preventDefault();
                this.closeImportModal();
            }
            
            if (e.target.id === 'confirm-import') {
                e.preventDefault();
                this.confirmImportData();
            }
            
            if (e.target.id === 'export-btn') {
                e.preventDefault();
                this.exportData();
            }
            
            if (e.target.id === 'import-btn') {
                e.preventDefault();
                document.getElementById('file-input').click();
            }
            
            // Handle trip card clicks
            if (e.target.closest('.trip-card') && !e.target.closest('.trip-actions')) {
                const tripCard = e.target.closest('.trip-card');
                const tripId = tripCard.getAttribute('data-trip-id');
                if (tripId) {
                    this.openTripDetail(tripId);
                }
            }
            
            // Handle trip action buttons
            if (e.target.classList.contains('trip-action-btn')) {
                e.stopPropagation();
                const action = e.target.getAttribute('data-action');
                const tripId = e.target.getAttribute('data-trip-id');
                
                if (action === 'edit') {
                    const trip = this.data.trips.find(t => t.id === tripId);
                    this.openTripModal(trip);
                } else if (action === 'delete') {
                    this.deleteTrip(tripId);
                }
            }
            
            // Handle expense delete
            if (e.target.classList.contains('delete-expense-btn')) {
                const tripId = e.target.getAttribute('data-trip-id');
                const expenseId = e.target.getAttribute('data-expense-id');
                this.deleteExpense(tripId, expenseId);
            }
        });
        
        // Expense form
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.saveExpense(e));
        }
        
        const expenseAmount = document.getElementById('expense-amount');
        if (expenseAmount) {
            expenseAmount.addEventListener('input', () => this.updateCurrencyConversion());
        }
        
        const expenseCurrency = document.getElementById('expense-currency');
        if (expenseCurrency) {
            expenseCurrency.addEventListener('change', () => this.updateCurrencyConversion());
        }
        
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }
        
        // Annual view
        const yearSelector = document.getElementById('year-selector');
        if (yearSelector) {
            yearSelector.addEventListener('change', (e) => this.renderAnnualSummary(parseInt(e.target.value)));
        }
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    modal.classList.add('hidden');
                }
            });
        });
    }
    
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal:not(.hidden)');
                if (activeModal) {
                    e.preventDefault();
                    activeModal.classList.add('hidden');
                }
            }
            
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                const bulkModal = document.getElementById('bulk-expense-modal');
                if (bulkModal && !bulkModal.classList.contains('hidden')) {
                    this.saveBulkExpenses();
                }
            }
        });
    }
    
    populateSelectors() {
        // Populate category selector
        const categorySelect = document.getElementById('expense-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select category</option>';
            this.categories.forEach(cat => {
                categorySelect.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
            });
        }
        
        // Populate trip selector for expenses
        this.updateTripSelector();
    }
    
    updateTripSelector() {
        const tripSelect = document.getElementById('expense-trip');
        if (tripSelect) {
            tripSelect.innerHTML = '<option value="">Select a trip</option>';
            this.data.trips.forEach(trip => {
                tripSelect.innerHTML += `<option value="${trip.id}">${trip.name}</option>`;
            });
        }
    }
    
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
        
        // Render content based on active tab
        if (tabName === 'annual-view') {
            this.renderAnnualSummary(2025);
        }
    }
    
    openTripModal(trip = null) {
        this.currentEditingTrip = trip;
        const modal = document.getElementById('trip-modal');
        const title = document.getElementById('trip-modal-title');
        
        if (trip) {
            title.textContent = 'Edit Trip';
            document.getElementById('trip-name').value = trip.name;
            document.getElementById('trip-start-date').value = trip.startDate;
            document.getElementById('trip-end-date').value = trip.endDate;
            document.getElementById('trip-location').value = trip.location;
            document.getElementById('trip-budget').value = trip.budget || '';
        } else {
            title.textContent = 'Add New Trip';
            const form = document.getElementById('trip-form');
            if (form) form.reset();
        }
        
        modal.classList.remove('hidden');
    }
    
    closeTripModal() {
        const modal = document.getElementById('trip-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        const form = document.getElementById('trip-form');
        if (form) {
            form.reset();
        }
        this.currentEditingTrip = null;
    }
    
    saveTrip() {
        const tripData = {
            name: document.getElementById('trip-name').value,
            startDate: document.getElementById('trip-start-date').value,
            endDate: document.getElementById('trip-end-date').value,
            location: document.getElementById('trip-location').value,
            budget: parseFloat(document.getElementById('trip-budget').value) || null,
            year: new Date(document.getElementById('trip-start-date').value).getFullYear()
        };
        
        if (!tripData.name || !tripData.startDate || !tripData.endDate || !tripData.location) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        if (this.currentEditingTrip) {
            // Edit existing trip
            const tripIndex = this.data.trips.findIndex(t => t.id === this.currentEditingTrip.id);
            this.data.trips[tripIndex] = { ...this.currentEditingTrip, ...tripData };
            this.showToast('Trip updated successfully', 'success');
        } else {
            // Add new trip
            const newTrip = {
                id: `trip-${this.data.nextTripId++}`,
                ...tripData,
                createdAt: new Date().toISOString(),
                expenses: []
            };
            this.data.trips.push(newTrip);
            this.showToast('Trip added successfully', 'success');
        }
        
        this.closeTripModal();
        this.renderTrips();
        this.updateTripSelector();
    }
    
    deleteTrip(tripId) {
        if (confirm('Are you sure you want to delete this trip and all its expenses?')) {
            this.data.trips = this.data.trips.filter(t => t.id !== tripId);
            this.renderTrips();
            this.updateTripSelector();
            this.showToast('Trip deleted successfully', 'success');
        }
    }
    
    openBulkExpenseModal() {
        if (!this.currentBulkTrip) {
            this.showToast('Please select a trip first', 'error');
            return;
        }
        
        const modal = document.getElementById('bulk-expense-modal');
        this.bulkRows = [];
        this.initializeBulkRows(3); // Start with 3 empty rows
        this.renderBulkTable();
        this.updateBulkSummary();
        modal.classList.remove('hidden');
    }
    
    closeBulkExpenseModal() {
        const modal = document.getElementById('bulk-expense-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.bulkRows = [];
        this.clearBulkValidation();
    }
    
    initializeBulkRows(count) {
        for (let i = 0; i < count; i++) {
            this.bulkRows.push({
                id: `bulk-${Date.now()}-${i}`,
                date: '',
                amount: '',
                currency: 'EUR',
                category: '',
                description: ''
            });
        }
    }
    
    addBulkRow() {
        if (this.bulkRows.length >= 10) {
            this.showToast('Maximum 10 rows allowed', 'error');
            return;
        }
        
        this.bulkRows.push({
            id: `bulk-${Date.now()}-${this.bulkRows.length}`,
            date: '',
            amount: '',
            currency: 'EUR',
            category: '',
            description: ''
        });
        
        this.renderBulkTable();
        this.updateBulkSummary();
    }
    
    removeBulkRow() {
        if (this.bulkRows.length <= 1) {
            this.showToast('At least one row is required', 'error');
            return;
        }
        
        this.bulkRows.pop();
        this.renderBulkTable();
        this.updateBulkSummary();
    }
    
    deleteBulkRow(rowId) {
        if (this.bulkRows.length <= 1) {
            this.showToast('At least one row is required', 'error');
            return;
        }
        
        this.bulkRows = this.bulkRows.filter(row => row.id !== rowId);
        this.renderBulkTable();
        this.updateBulkSummary();
    }
    
    renderBulkTable() {
        const tbody = document.getElementById('bulk-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.bulkRows.map(row => this.renderBulkRow(row)).join('');
        
        // Add event listeners to inputs
        this.bulkRows.forEach(row => {
            const inputs = tbody.querySelectorAll(`[data-row="${row.id}"]`);
            inputs.forEach(input => {
                input.addEventListener('input', (e) => this.handleBulkInputChange(row.id, e.target.dataset.field, e.target.value));
                input.addEventListener('change', (e) => this.handleBulkInputChange(row.id, e.target.dataset.field, e.target.value));
            });
        });
    }
    
    renderBulkRow(row) {
        const eurAmount = this.calculateEurAmount(row.amount, row.currency);
        
        return `
            <tr>
                <td>
                    <input type="date" data-row="${row.id}" data-field="date" value="${row.date}" required>
                </td>
                <td>
                    <input type="number" data-row="${row.id}" data-field="amount" value="${row.amount}" step="0.01" placeholder="0.00" required>
                </td>
                <td>
                    <select data-row="${row.id}" data-field="currency" required>
                        <option value="EUR" ${row.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                        <option value="INR" ${row.currency === 'INR' ? 'selected' : ''}>INR</option>
                    </select>
                </td>
                <td>
                    <select data-row="${row.id}" data-field="category" required>
                        <option value="">Select</option>
                        ${this.categories.map(cat => 
                            `<option value="${cat.id}" ${row.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <input type="text" data-row="${row.id}" data-field="description" value="${row.description}" placeholder="Description" maxlength="100">
                </td>
                <td class="bulk-eur-amount">
                    €${eurAmount.toFixed(2)}
                </td>
                <td>
                    <button type="button" class="bulk-row-delete" data-row-id="${row.id}" title="Delete row">🗑️</button>
                </td>
            </tr>
        `;
    }
    
    handleBulkInputChange(rowId, field, value) {
        const row = this.bulkRows.find(r => r.id === rowId);
        if (row) {
            row[field] = value;
            
            // Update EUR amount if amount or currency changed
            if (field === 'amount' || field === 'currency') {
                this.updateBulkRowEurAmount(rowId);
            }
            
            this.updateBulkSummary();
            this.validateBulkData();
        }
    }
    
    updateBulkRowEurAmount(rowId) {
        const row = this.bulkRows.find(r => r.id === rowId);
        if (!row) return;
        
        const eurAmount = this.calculateEurAmount(row.amount, row.currency);
        const eurCell = document.querySelector(`tr:has([data-row="${rowId}"]) .bulk-eur-amount`);
        if (eurCell) {
            eurCell.textContent = `€${eurAmount.toFixed(2)}`;
        }
    }
    
    calculateEurAmount(amount, currency) {
        const numAmount = parseFloat(amount) || 0;
        return currency === 'EUR' ? numAmount : numAmount / this.exchangeRates.EUR_TO_INR;
    }
    
    updateBulkSummary() {
        const countSpan = document.getElementById('bulk-count');
        const totalSpan = document.getElementById('bulk-total');
        
        if (countSpan) {
            countSpan.textContent = `${this.bulkRows.length} rows`;
        }
        
        if (totalSpan) {
            const total = this.bulkRows.reduce((sum, row) => {
                return sum + this.calculateEurAmount(row.amount, row.currency);
            }, 0);
            totalSpan.textContent = `Total: €${total.toFixed(2)}`;
        }
    }
    
    validateBulkData() {
        const errors = [];
        const validationDiv = document.getElementById('bulk-validation');
        
        this.bulkRows.forEach((row, index) => {
            const rowNum = index + 1;
            if (!row.date) errors.push(`Row ${rowNum}: Date is required`);
            if (!row.amount || parseFloat(row.amount) <= 0) errors.push(`Row ${rowNum}: Valid amount is required`);
            if (!row.currency) errors.push(`Row ${rowNum}: Currency is required`);
            if (!row.category) errors.push(`Row ${rowNum}: Category is required`);
            if (row.description && row.description.length > 100) errors.push(`Row ${rowNum}: Description too long (max 100 chars)`);
        });
        
        if (errors.length > 0) {
            validationDiv.innerHTML = `<ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>`;
            validationDiv.classList.add('show');
        } else {
            validationDiv.classList.remove('show');
        }
        
        return errors.length === 0;
    }
    
    clearBulkValidation() {
        const validationDiv = document.getElementById('bulk-validation');
        if (validationDiv) {
            validationDiv.classList.remove('show');
        }
    }
    
    saveBulkExpenses() {
        if (!this.validateBulkData()) {
            this.showToast('Please fix validation errors before saving', 'error');
            return;
        }
        
        const trip = this.data.trips.find(t => t.id === this.currentBulkTrip);
        if (!trip) {
            this.showToast('Trip not found', 'error');
            return;
        }
        
        const validExpenses = this.bulkRows.filter(row => 
            row.date && row.amount && parseFloat(row.amount) > 0 && row.currency && row.category
        );
        
        if (validExpenses.length === 0) {
            this.showToast('No valid expenses to save', 'error');
            return;
        }
        
        // Convert bulk rows to expenses
        const newExpenses = validExpenses.map(row => ({
            id: `exp-${this.data.nextExpenseId++}`,
            date: row.date,
            amount: parseFloat(row.amount),
            currency: row.currency,
            category: row.category,
            description: row.description || '',
            createdAt: new Date().toISOString()
        }));
        
        // Add expenses to trip
        trip.expenses.push(...newExpenses);
        
        this.showToast(`Successfully added ${newExpenses.length} expenses`, 'success');
        this.closeBulkExpenseModal();
        this.renderTrips();
        
        // Refresh trip detail if open
        if (!document.getElementById('trip-detail-modal').classList.contains('hidden')) {
            this.openTripDetail(this.currentBulkTrip);
        }
    }
    
    renderTrips() {
        const container = document.getElementById('trips-container');
        
        if (this.data.trips.length === 0) {
            container.innerHTML = `
                <div class="no-trips">
                    <div class="empty-state-icon">✈️</div>
                    <h3>No trips yet</h3>
                    <p>Start tracking your travel expenses by creating your first trip!</p>
                    <button class="btn btn--primary" id="add-trip-btn">Add Your First Trip</button>
                </div>
            `;
            return;
        }
        
        // Group trips by year
        const tripsByYear = {};
        this.data.trips.forEach(trip => {
            if (!tripsByYear[trip.year]) {
                tripsByYear[trip.year] = [];
            }
            tripsByYear[trip.year].push(trip);
        });
        
        // Sort years in descending order
        const years = Object.keys(tripsByYear).sort((a, b) => b - a);
        
        container.innerHTML = years.map(year => {
            const yearTrips = tripsByYear[year];
            return `
                <div class="trips-year-section">
                    <h3 class="year-title">${year}</h3>
                    <div class="trips-grid">
                        ${yearTrips.map(trip => this.renderTripCard(trip)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderTripCard(trip) {
        const totalExpenses = this.calculateTripTotal(trip);
        const expenseCount = trip.expenses.length;
        const duration = this.calculateTripDuration(trip.startDate, trip.endDate);
        
        let budgetProgress = '';
        if (trip.budget) {
            const percentage = Math.min((totalExpenses / trip.budget) * 100, 100);
            const isOverBudget = totalExpenses > trip.budget;
            budgetProgress = `
                <div class="budget-progress">
                    <div class="budget-progress-label">
                        <span>Budget: €${trip.budget}</span>
                        <span>${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${isOverBudget ? 'over-budget' : ''}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="trip-card" data-trip-id="${trip.id}">
                <div class="trip-card-header">
                    <h3 class="trip-name">${trip.name}</h3>
                    <div class="trip-actions">
                        <button class="trip-action-btn" data-action="edit" data-trip-id="${trip.id}" title="Edit trip">✏️</button>
                        <button class="trip-action-btn" data-action="delete" data-trip-id="${trip.id}" title="Delete trip">🗑️</button>
                    </div>
                </div>
                <div class="trip-meta">
                    <div class="trip-meta-item">
                        <span>📍</span>
                        <span>${trip.location}</span>
                    </div>
                    <div class="trip-meta-item">
                        <span>📅</span>
                        <span>${this.formatDate(trip.startDate)} - ${this.formatDate(trip.endDate)} (${duration} days)</span>
                    </div>
                </div>
                <div class="trip-stats">
                    <div class="trip-total">€${totalExpenses.toFixed(2)}</div>
                    <div class="trip-expense-count">${expenseCount} expense${expenseCount !== 1 ? 's' : ''}</div>
                </div>
                ${budgetProgress}
            </div>
        `;
    }
    
    calculateTripTotal(trip) {
        return trip.expenses.reduce((total, expense) => {
            const eurAmount = expense.currency === 'EUR' ? expense.amount : expense.amount / this.exchangeRates.EUR_TO_INR;
            return total + eurAmount;
        }, 0);
    }
    
    calculateTripDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }
    
    formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    openTripDetail(tripId) {
        const trip = this.data.trips.find(t => t.id === tripId);
        if (!trip) return;
        
        this.currentBulkTrip = tripId; // Set for bulk operations
        
        const modal = document.getElementById('trip-detail-modal');
        const title = document.getElementById('trip-detail-title');
        const content = document.getElementById('trip-detail-content');
        
        title.textContent = trip.name;
        content.innerHTML = this.renderTripDetailContent(trip);
        
        modal.classList.remove('hidden');
    }
    
    closeTripDetailModal() {
        const modal = document.getElementById('trip-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentBulkTrip = null;
    }
    
    renderTripDetailContent(trip) {
        const totalExpenses = this.calculateTripTotal(trip);
        const duration = this.calculateTripDuration(trip.startDate, trip.endDate);
        const avgPerDay = totalExpenses / duration;
        
        // Category breakdown
        const categoryTotals = {};
        this.categories.forEach(cat => {
            categoryTotals[cat.id] = 0;
        });
        
        trip.expenses.forEach(expense => {
            const eurAmount = expense.currency === 'EUR' ? expense.amount : expense.amount / this.exchangeRates.EUR_TO_INR;
            categoryTotals[expense.category] += eurAmount;
        });
        
        const categoryBreakdown = this.categories
            .filter(cat => categoryTotals[cat.id] > 0)
            .map(cat => ({
                ...cat,
                total: categoryTotals[cat.id]
            }))
            .sort((a, b) => b.total - a.total);
        
        return `
            <div class="trip-detail-summary">
                <div class="summary-card">
                    <h4>Total Spent</h4>
                    <div class="summary-value">€${totalExpenses.toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <h4>Duration</h4>
                    <div class="summary-value">${duration} days</div>
                </div>
                <div class="summary-card">
                    <h4>Daily Average</h4>
                    <div class="summary-value">€${avgPerDay.toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <h4>Expenses</h4>
                    <div class="summary-value">${trip.expenses.length}</div>
                </div>
            </div>
            
            ${trip.budget ? `
                <div class="summary-card" style="margin-bottom: var(--space-24);">
                    <h4>Budget Status</h4>
                    <div class="summary-value" style="color: ${totalExpenses > trip.budget ? 'var(--color-error)' : 'var(--color-success)'}">
                        €${(trip.budget - totalExpenses).toFixed(2)} ${totalExpenses > trip.budget ? 'over' : 'remaining'}
                    </div>
                </div>
            ` : ''}
            
            <div class="category-breakdown">
                <h3>Category Breakdown</h3>
                ${categoryBreakdown.length === 0 ? '<p class="text-secondary">No expenses by category yet.</p>' :
                    categoryBreakdown.map(cat => `
                        <div class="category-item">
                            <div class="category-info">
                                <div class="category-icon" style="background: ${cat.color};">
                                    ${cat.icon}
                                </div>
                                <div class="category-name">${cat.name}</div>
                            </div>
                            <div class="category-amount">€${cat.total.toFixed(2)}</div>
                        </div>
                    `).join('')}
            </div>
            
            <div class="expenses-list">
                <h3>All Expenses</h3>
                ${trip.expenses.length === 0 ? '<p class="text-secondary">No expenses recorded yet.</p>' : 
                    trip.expenses.map(expense => this.renderExpenseItem(expense, trip.id)).join('')}
            </div>
        `;
    }
    
    renderExpenseItem(expense, tripId) {
        const category = this.categories.find(cat => cat.id === expense.category);
        const eurAmount = expense.currency === 'EUR' ? expense.amount : expense.amount / this.exchangeRates.EUR_TO_INR;
        
        return `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-description">${expense.description || 'No description'}</div>
                    <div class="expense-meta">
                        <span>${this.formatDate(expense.date)}</span>
                        <span>${category.icon} ${category.name}</span>
                        <span>${expense.amount} ${expense.currency} ${expense.currency !== 'EUR' ? `(€${eurAmount.toFixed(2)})` : ''}</span>
                    </div>
                </div>
                <div class="expense-actions">
                    <button class="delete-expense-btn" data-trip-id="${tripId}" data-expense-id="${expense.id}" title="Delete expense">🗑️</button>
                </div>
            </div>
        `;
    }
    
    updateCurrencyConversion() {
        const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
        const currency = document.getElementById('expense-currency').value;
        const conversionDiv = document.getElementById('currency-conversion');
        const convertedSpan = document.getElementById('converted-amount');
        
        if (currency === 'INR' && amount > 0) {
            const eurAmount = amount / this.exchangeRates.EUR_TO_INR;
            convertedSpan.textContent = `€${eurAmount.toFixed(2)}`;
            conversionDiv.style.display = 'block';
        } else {
            conversionDiv.style.display = 'none';
        }
    }
    
    saveExpense(e) {
        e.preventDefault();
        
        const tripId = document.getElementById('expense-trip').value;
        const date = document.getElementById('expense-date').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const currency = document.getElementById('expense-currency').value;
        const category = document.getElementById('expense-category').value;
        const description = document.getElementById('expense-description').value;
        
        if (!tripId || !date || !amount || !currency || !category) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const trip = this.data.trips.find(t => t.id === tripId);
        if (!trip) {
            this.showToast('Selected trip not found', 'error');
            return;
        }
        
        const expense = {
            id: `exp-${this.data.nextExpenseId++}`,
            date,
            amount,
            currency,
            category,
            description,
            createdAt: new Date().toISOString()
        };
        
        trip.expenses.push(expense);
        this.showToast('Expense added successfully', 'success');
        
        // Reset form
        document.getElementById('expense-form').reset();
        this.updateCurrencyConversion();
        
        // Update displays
        this.renderTrips();
    }
    
    deleteExpense(tripId, expenseId) {
        if (confirm('Are you sure you want to delete this expense?')) {
            const trip = this.data.trips.find(t => t.id === tripId);
            if (trip) {
                trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
                this.showToast('Expense deleted successfully', 'success');
                this.renderTrips();
                
                // Refresh trip detail if open
                if (!document.getElementById('trip-detail-modal').classList.contains('hidden')) {
                    this.openTripDetail(tripId);
                }
            }
        }
    }
    
    renderAnnualSummary(year) {
        const container = document.getElementById('annual-summary-container');
        const yearTrips = this.data.trips.filter(t => t.year === year);
        
        if (yearTrips.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>No trips in ${year}</h3>
                    <p>No travel data found for this year.</p>
                </div>
            `;
            return;
        }
        
        const totalSpent = yearTrips.reduce((sum, trip) => sum + this.calculateTripTotal(trip), 0);
        const totalExpenses = yearTrips.reduce((sum, trip) => sum + trip.expenses.length, 0);
        const avgTripCost = totalSpent / yearTrips.length;
        
        // Category totals across all trips
        const categoryTotals = {};
        this.categories.forEach(cat => {
            categoryTotals[cat.id] = 0;
        });
        
        yearTrips.forEach(trip => {
            trip.expenses.forEach(expense => {
                const eurAmount = expense.currency === 'EUR' ? expense.amount : expense.amount / this.exchangeRates.EUR_TO_INR;
                categoryTotals[expense.category] += eurAmount;
            });
        });
        
        const topCategories = this.categories
            .filter(cat => categoryTotals[cat.id] > 0)
            .map(cat => ({
                ...cat,
                total: categoryTotals[cat.id],
                percentage: (categoryTotals[cat.id] / totalSpent) * 100
            }))
            .sort((a, b) => b.total - a.total);
        
        container.innerHTML = `
            <div class="annual-stats">
                <div class="stat-card">
                    <div class="stat-value">€${totalSpent.toFixed(0)}</div>
                    <div class="stat-label">Total Spent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${yearTrips.length}</div>
                    <div class="stat-label">Trips Taken</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">€${avgTripCost.toFixed(0)}</div>
                    <div class="stat-label">Avg per Trip</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalExpenses}</div>
                    <div class="stat-label">Total Expenses</div>
                </div>
            </div>
            
            <div class="annual-breakdown">
                <div class="breakdown-section">
                    <h3 class="breakdown-title">Trips in ${year}</h3>
                    ${yearTrips.map(trip => {
                        const tripTotal = this.calculateTripTotal(trip);
                        const tripPercentage = (tripTotal / totalSpent) * 100;
                        return `
                            <div class="category-item" style="cursor: pointer;" data-trip-id="${trip.id}">
                                <div class="category-info">
                                    <div class="category-icon" style="background: var(--color-bg-1);">
                                        ✈️
                                    </div>
                                    <div class="category-name">${trip.name}</div>
                                </div>
                                <div class="category-amount">€${tripTotal.toFixed(2)} (${tripPercentage.toFixed(1)}%)</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="breakdown-section">
                    <h3 class="breakdown-title">Categories in ${year}</h3>
                    ${topCategories.map(cat => `
                        <div class="category-item">
                            <div class="category-info">
                                <div class="category-icon" style="background: ${cat.color};">
                                    ${cat.icon}
                                </div>
                                <div class="category-name">${cat.name}</div>
                            </div>
                            <div class="category-amount">€${cat.total.toFixed(2)} (${cat.percentage.toFixed(1)}%)</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    exportData() {
        const exportData = {
            ...this.data,
            exportInfo: {
                version: this.data.version || "1.0",
                exportedAt: new Date().toISOString(),
                totalTrips: this.data.trips.length,
                totalExpenses: this.data.trips.reduce((sum, trip) => sum + trip.expenses.length, 0)
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `travel-expenses-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
    }
    
    handleFileSelection(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                this.validateImportData(importedData);
            } catch (error) {
                this.showToast('Invalid JSON file format', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }
    
    validateImportData(data) {
        // Basic validation
        if (!data.trips || !Array.isArray(data.trips)) {
            this.showToast('Invalid data format: missing trips array', 'error');
            return;
        }
        
        // Store imported data and show preview
        this.importedData = data;
        this.showImportPreview(data);
    }
    
    showImportPreview(data) {
        const modal = document.getElementById('import-modal');
        const preview = document.getElementById('import-preview');
        
        const totalTrips = data.trips.length;
        const totalExpenses = data.trips.reduce((sum, trip) => sum + (trip.expenses ? trip.expenses.length : 0), 0);
        
        preview.innerHTML = `
            <h4>Import Preview</h4>
            <div class="import-stats">
                <div class="import-stat">
                    <div class="import-stat-value">${totalTrips}</div>
                    <div class="import-stat-label">Trips</div>
                </div>
                <div class="import-stat">
                    <div class="import-stat-value">${totalExpenses}</div>
                    <div class="import-stat-label">Expenses</div>
                </div>
                <div class="import-stat">
                    <div class="import-stat-value">${data.exportInfo ? new Date(data.exportInfo.exportedAt).toLocaleDateString() : 'Unknown'}</div>
                    <div class="import-stat-label">Export Date</div>
                </div>
            </div>
            <p><strong>Current Data:</strong> ${this.data.trips.length} trips, ${this.data.trips.reduce((sum, trip) => sum + trip.expenses.length, 0)} expenses</p>
        `;
        
        modal.classList.remove('hidden');
    }
    
    closeImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.importedData = null;
    }
    
    confirmImportData() {
        if (!this.importedData) {
            this.showToast('No import data available', 'error');
            return;
        }
        
        const importOption = document.querySelector('input[name="import-option"]:checked').value;
        
        if (importOption === 'replace') {
            if (!confirm('This will replace all your existing data. Are you sure?')) {
                return;
            }
            this.data = { ...this.importedData };
        } else {
            // Merge data
            const existingTripIds = new Set(this.data.trips.map(t => t.id));
            const newTrips = this.importedData.trips.filter(trip => !existingTripIds.has(trip.id));
            
            this.data.trips.push(...newTrips);
            
            // Update counters to prevent ID conflicts
            const allTripIds = this.data.trips.map(t => t.id).filter(id => id.startsWith('trip-')).map(id => parseInt(id.split('-')[1]));
            const allExpenseIds = this.data.trips.flatMap(t => t.expenses).map(e => e.id).filter(id => id.startsWith('exp-')).map(id => parseInt(id.split('-')[1]));
            
            this.data.nextTripId = Math.max(...allTripIds, this.data.nextTripId || 0) + 1;
            this.data.nextExpenseId = Math.max(...allExpenseIds, this.data.nextExpenseId || 0) + 1;
        }
        
        this.renderTrips();
        this.updateTripSelector();
        this.closeImportModal();
        
        const action = importOption === 'replace' ? 'replaced' : 'merged';
        this.showToast(`Data ${action} successfully`, 'success');
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ExpenseTracker();
    window.app = app; // Make app globally accessible for onclick handlers
});