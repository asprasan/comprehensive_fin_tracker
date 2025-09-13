// Enhanced Expense Tracker Application
class ExpenseTracker {
    constructor() {
        // Application state
        this.currentView = 'monthly';
        this.currentMonth = 8; // September (0-indexed)
        this.currentYear = 2025;
        this.annualYear = 2025;
        this.expenses = [];
        this.budgets = {
            groceries: 250,
            lifestyle: 150,
            'once-in-a-while': 0,
            unexpected: 0
        };
        this.currencySettings = {
            eurToInrRate: 90,
            defaultCurrency: 'EUR',
            lastUpdated: new Date().toISOString()
        };
        this.nextExpenseId = 1;
        this.editingExpenseId = null;
        this.bulkRows = [];
        
        // Chart instances
        this.monthlyChart = null;
        this.categoryChart = null;

        // Categories configuration
        this.categories = {
            groceries: {
                id: 'groceries',
                name: 'Groceries',
                icon: '🛒',
                color: '#4CAF50'
            },
            lifestyle: {
                id: 'lifestyle',
                name: 'Lifestyle',
                icon: '🎉',
                color: '#2196F3'
            },
            'once-in-a-while': {
                id: 'once-in-a-while',
                name: 'Once-in-a-while Items',
                icon: '⏰',
                color: '#FF9800'
            },
            unexpected: {
                id: 'unexpected',
                name: 'Unexpected',
                icon: '❗',
                color: '#F44336'
            }
        };

        // Currency configuration
        this.currencies = {
            EUR: { symbol: '€', name: 'Euro' },
            INR: { symbol: '₹', name: 'Indian Rupee' }
        };
    }

    init() {
        this.setupEventListeners();
        this.setCurrentDate();
        this.renderCategories();
        this.updateTotals();
        
        // Add sample data for demonstration
        this.expenses = [
            {
                id: 1,
                category: 'groceries',
                date: '2025-09-03',
                store: 'Aldi',
                item: 'Milk (3.5% fat)',
                quantity: 1,
                unit: 'Litre',
                price: 1.09,
                currency: 'EUR'
            },
            {
                id: 2,
                category: 'lifestyle',
                date: '2025-09-05',
                store: 'Indian Restaurant',
                item: 'Dinner',
                quantity: 2,
                unit: 'person',
                price: 1800,
                currency: 'INR'
            }
        ];
        this.nextExpenseId = 3;
        
        // Re-render with sample data
        this.renderCategories();
        this.updateTotals();
    }

    setupEventListeners() {
        // Navigation tabs
        document.getElementById('monthlyViewTab').addEventListener('click', () => this.switchView('monthly'));
        document.getElementById('annualSummaryTab').addEventListener('click', () => this.switchView('annual'));
        document.getElementById('currencySettingsTab').addEventListener('click', () => this.openCurrencySettings());

        // Month/Year selection
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');
        const annualYearSelect = document.getElementById('annualYearSelect');
        
        if (monthSelect) {
            monthSelect.addEventListener('change', (e) => {
                this.currentMonth = parseInt(e.target.value);
                this.renderCategories();
                this.updateTotals();
            });
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = parseInt(e.target.value);
                this.renderCategories();
                this.updateTotals();
            });
        }

        if (annualYearSelect) {
            annualYearSelect.addEventListener('change', (e) => {
                this.annualYear = parseInt(e.target.value);
                this.renderAnnualSummary();
            });
        }

        // Bulk expense modal
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openBulkExpenseModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeBulkExpenseModal());
        document.getElementById('cancelBulkBtn').addEventListener('click', () => this.closeBulkExpenseModal());
        document.getElementById('addRowBtn').addEventListener('click', () => this.addBulkRow());
        document.getElementById('saveAllExpensesBtn').addEventListener('click', () => this.saveAllExpenses());

        // Currency settings modal
        document.getElementById('closeCurrencyModal').addEventListener('click', () => this.closeCurrencyModal());
        document.getElementById('cancelCurrencyBtn').addEventListener('click', () => this.closeCurrencyModal());
        document.getElementById('saveCurrencyBtn').addEventListener('click', () => this.saveCurrencySettings());

        // Budget modal
        document.getElementById('closeBudgetModal').addEventListener('click', () => this.closeBudgetModal());
        document.getElementById('cancelBudgetBtn').addEventListener('click', () => this.closeBudgetModal());
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudgets();
        });

        // Data export/import
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('exportAnnualBtn').addEventListener('click', () => this.exportAnnualData());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.closest('.modal').classList.add('hidden');
                }
            });
        });

        // Global event delegation for dynamically created buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const expenseId = parseInt(e.target.dataset.expenseId);
                this.editExpense(expenseId);
            }
            
            if (e.target.classList.contains('delete-btn')) {
                const expenseId = parseInt(e.target.dataset.expenseId);
                this.deleteExpense(expenseId);
            }
            
            if (e.target.classList.contains('budget-settings-btn')) {
                const categoryId = e.target.dataset.category;
                this.openBudgetModal(categoryId);
                e.stopPropagation();
            }
            
            if (e.target.classList.contains('add-category-expense')) {
                const categoryId = e.target.dataset.category;
                this.openBulkExpenseModal(categoryId);
            }
            
            if (e.target.classList.contains('remove-row-btn')) {
                const rowIndex = parseInt(e.target.dataset.rowIndex);
                this.removeBulkRow(rowIndex);
            }
            
            if (e.target.closest('.category-header') && !e.target.closest('.category-actions')) {
                const header = e.target.closest('.category-header');
                const card = header.closest('.category-card');
                const content = card.querySelector('.category-content');
                const expandIcon = card.querySelector('.expand-icon');
                
                content.classList.toggle('expanded');
                expandIcon.classList.toggle('rotated');
            }
        });
    }

    switchView(view) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        
        if (view === 'monthly') {
            document.getElementById('monthlyViewTab').classList.add('active');
            document.getElementById('monthlyView').classList.remove('hidden');
            document.getElementById('annualView').classList.add('hidden');
            document.getElementById('monthlyControls').classList.remove('hidden');
            document.getElementById('annualControls').classList.add('hidden');
            this.currentView = 'monthly';
        } else if (view === 'annual') {
            document.getElementById('annualSummaryTab').classList.add('active');
            document.getElementById('monthlyView').classList.add('hidden');
            document.getElementById('annualView').classList.remove('hidden');
            document.getElementById('monthlyControls').classList.add('hidden');
            document.getElementById('annualControls').classList.remove('hidden');
            this.currentView = 'annual';
            this.renderAnnualSummary();
        }
    }

    openCurrencySettings() {
        const modal = document.getElementById('currencyModal');
        document.getElementById('conversionRate').value = this.currencySettings.eurToInrRate;
        document.getElementById('defaultCurrency').value = this.currencySettings.defaultCurrency;
        document.getElementById('lastUpdated').value = new Date(this.currencySettings.lastUpdated).toLocaleString();
        modal.classList.remove('hidden');
    }

    closeCurrencyModal() {
        document.getElementById('currencyModal').classList.add('hidden');
    }

    saveCurrencySettings() {
        this.currencySettings.eurToInrRate = parseFloat(document.getElementById('conversionRate').value) || 90;
        this.currencySettings.defaultCurrency = document.getElementById('defaultCurrency').value;
        this.currencySettings.lastUpdated = new Date().toISOString();
        
        this.closeCurrencyModal();
        this.renderCategories();
        this.updateTotals();
        if (this.currentView === 'annual') {
            this.renderAnnualSummary();
        }
        this.showMessage('Currency settings updated successfully!', 'success');
    }

    convertToEur(amount, currency) {
        if (currency === 'EUR') return amount;
        if (currency === 'INR') return amount / this.currencySettings.eurToInrRate;
        return amount;
    }

    formatCurrency(amount, currency) {
        const symbol = this.currencies[currency]?.symbol || '€';
        return `${symbol}${amount.toFixed(2)}`;
    }

    openBulkExpenseModal(categoryId = null) {
        const modal = document.getElementById('expenseModal');
        this.bulkRows = [];
        
        // Initialize with 3 empty rows
        for (let i = 0; i < 3; i++) {
            this.addBulkRow(categoryId);
        }
        
        modal.classList.remove('hidden');
    }

    closeBulkExpenseModal() {
        document.getElementById('expenseModal').classList.add('hidden');
        this.bulkRows = [];
    }

    addBulkRow(categoryId = null) {
        const today = new Date().toISOString().split('T')[0];
        const newRow = {
            date: today,
            category: categoryId || '',
            store: '',
            item: '',
            quantity: '',
            unit: '',
            price: '',
            currency: this.currencySettings.defaultCurrency
        };
        
        this.bulkRows.push(newRow);
        this.renderBulkRows();
    }

    removeBulkRow(index) {
        if (this.bulkRows.length > 1) {
            this.bulkRows.splice(index, 1);
            this.renderBulkRows();
        }
    }

    renderBulkRows() {
        const tbody = document.getElementById('bulkExpenseRows');
        tbody.innerHTML = '';
        
        this.bulkRows.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <input type="date" class="form-control date-input" 
                           value="${row.date}" 
                           onchange="expenseTracker.updateBulkRow(${index}, 'date', this.value)" required>
                </td>
                <td>
                    <select class="form-control category-input" 
                            onchange="expenseTracker.updateBulkRow(${index}, 'category', this.value)">
                        <option value="">Select...</option>
                        ${Object.values(this.categories).map(cat => 
                            `<option value="${cat.id}" ${row.category === cat.id ? 'selected' : ''}>
                                ${cat.icon} ${cat.name}
                            </option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control" 
                           value="${row.store}" 
                           placeholder="Store/Location"
                           onchange="expenseTracker.updateBulkRow(${index}, 'store', this.value)">
                </td>
                <td>
                    <input type="text" class="form-control" 
                           value="${row.item}" 
                           placeholder="Item name"
                           onchange="expenseTracker.updateBulkRow(${index}, 'item', this.value)">
                </td>
                <td>
                    <input type="number" class="form-control" 
                           value="${row.quantity}" 
                           placeholder="Qty" step="0.01" min="0"
                           onchange="expenseTracker.updateBulkRow(${index}, 'quantity', this.value)">
                </td>
                <td>
                    <input type="text" class="form-control" 
                           value="${row.unit}" 
                           placeholder="Unit"
                           onchange="expenseTracker.updateBulkRow(${index}, 'unit', this.value)">
                </td>
                <td>
                    <input type="number" class="form-control price-input" 
                           value="${row.price}" 
                           placeholder="0.00" step="0.01" min="0" 
                           onchange="expenseTracker.updateBulkRow(${index}, 'price', this.value)" required>
                </td>
                <td>
                    <select class="form-control currency-input" 
                            onchange="expenseTracker.updateBulkRow(${index}, 'currency', this.value)">
                        ${Object.entries(this.currencies).map(([code, info]) => 
                            `<option value="${code}" ${row.currency === code ? 'selected' : ''}>
                                ${code}
                            </option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <div class="bulk-row-actions">
                        <button type="button" class="remove-row-btn" data-row-index="${index}"
                                ${this.bulkRows.length <= 1 ? 'disabled' : ''}>
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateBulkRow(index, field, value) {
        if (this.bulkRows[index]) {
            this.bulkRows[index][field] = value;
        }
    }

    saveAllExpenses() {
        const validRows = this.bulkRows.filter(row => row.date && row.price && parseFloat(row.price) > 0);
        
        if (validRows.length === 0) {
            this.showMessage('Please fill in at least one expense with date and price.', 'error');
            return;
        }

        this.showLoading();
        
        setTimeout(() => {
            validRows.forEach(row => {
                const newExpense = {
                    id: this.nextExpenseId++,
                    category: row.category || 'unexpected',
                    date: row.date,
                    store: row.store || 'Unknown',
                    item: row.item || 'Unknown Item',
                    quantity: parseFloat(row.quantity) || 1,
                    unit: row.unit || 'unit',
                    price: parseFloat(row.price),
                    currency: row.currency
                };
                this.expenses.push(newExpense);
            });

            this.hideLoading();
            this.closeBulkExpenseModal();
            this.renderCategories();
            this.updateTotals();
            
            const count = validRows.length;
            this.showMessage(`${count} expense${count > 1 ? 's' : ''} added successfully!`, 'success');
        }, 500);
    }

    renderAnnualSummary() {
        const year = this.annualYear;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
        
        let totalYearExpenses = 0;
        let highestMonth = { month: '', amount: 0 };
        let monthlyData = [];
        const monthlyBudget = this.getMonthlyBudget();
        
        // Calculate monthly data with cumulative overshoot/undershoot
        let cumulativeBudget = 0;
        let cumulativeExpenses = 0;
        
        for (let month = 0; month < 12; month++) {
            const monthTotal = this.getMonthlyTotal(year, month);
            totalYearExpenses += monthTotal;
            
            cumulativeBudget += monthlyBudget;
            cumulativeExpenses += monthTotal;
            const cumulativeOvershoot = cumulativeExpenses - cumulativeBudget;
            
            if (monthTotal > highestMonth.amount) {
                highestMonth = { month: monthNames[month], amount: monthTotal };
            }
            
            monthlyData.push({
                month: monthNames[month],
                total: monthTotal,
                budget: monthlyBudget,
                difference: monthTotal - monthlyBudget,
                cumulativeOvershoot: cumulativeOvershoot
            });
        }

        // Calculate category totals
        const categoryTotals = {};
        let topCategory = { name: '', amount: 0 };
        
        Object.keys(this.categories).forEach(categoryId => {
            let categoryTotal = 0;
            for (let month = 0; month < 12; month++) {
                categoryTotal += this.getCategoryTotal(categoryId, year, month);
            }
            categoryTotals[categoryId] = categoryTotal;
            
            if (categoryTotal > topCategory.amount) {
                topCategory = { name: this.categories[categoryId].name, amount: categoryTotal };
            }
        });

        // Update summary cards
        document.getElementById('totalSpent').textContent = this.formatCurrency(totalYearExpenses);
        document.getElementById('averageMonthly').textContent = this.formatCurrency(totalYearExpenses / 12);
        document.getElementById('highestMonth').textContent = `${highestMonth.month} (${this.formatCurrency(highestMonth.amount)})`;
        document.getElementById('topCategory').textContent = `${topCategory.name} (${this.formatCurrency(topCategory.amount)})`;

        // Render monthly breakdown table with cumulative column
        const tableBody = document.getElementById('monthlyBreakdownBody');
        tableBody.innerHTML = '';
        
        monthlyData.forEach(data => {
            const isOverBudget = data.difference > 0;
            const isCumulativeOver = data.cumulativeOvershoot > 0;
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${data.month}</td>
                <td>${this.formatCurrency(data.total)}</td>
                <td>${this.formatCurrency(data.budget)}</td>
                <td class="${isOverBudget ? 'over-budget-text' : 'under-budget-text'}">
                    ${isOverBudget ? '+' : ''}${this.formatCurrency(data.difference)}
                </td>
                <td class="${isCumulativeOver ? 'over-budget-text' : 'under-budget-text'}">
                    ${isCumulativeOver ? '+' : ''}${this.formatCurrency(data.cumulativeOvershoot)}
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Render category breakdown table (unchanged)
        const categoryTableBody = document.getElementById('categoryBreakdownBody');
        categoryTableBody.innerHTML = '';
        
        Object.keys(this.categories).forEach(categoryId => {
            const category = this.categories[categoryId];
            const total = categoryTotals[categoryId];
            const annualBudget = this.budgets[categoryId] * 12;
            const difference = total - annualBudget;
            const isOverBudget = difference > 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="category-icon">${category.icon}</span>
                    ${category.name}
                </td>
                <td>${this.formatCurrency(total)}</td>
                <td>${this.formatCurrency(annualBudget)}</td>
                <td class="${isOverBudget ? 'over-budget-text' : 'under-budget-text'}">
                    ${isOverBudget ? '+' : ''}${this.formatCurrency(difference)}
                </td>
            `;
            
            categoryTableBody.appendChild(row);
        });

        // Render charts (unchanged)
        this.renderMonthlyChart(monthlyData);
        this.renderCategoryChart(categoryTotals);
    }

    renderMonthlyChart(monthlyTotals) {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
        
        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Expenses (EUR)',
                    data: monthlyTotals,
                    borderColor: colors[0],
                    backgroundColor: colors[0] + '20',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '€' + value.toFixed(0);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderCategoryChart(categoryTotals) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'];
        const data = Object.values(categoryTotals);
        const labels = Object.keys(categoryTotals).map(id => this.categories[id]?.name || id);

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderAnnualTable(monthlyTotals, categoryTotals) {
        const tbody = document.getElementById('annualTableBody');
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        let html = '';
        
        monthlyTotals.forEach((total, index) => {
            const monthExpenses = this.expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === this.annualYear && 
                       expenseDate.getMonth() === index;
            });

            const monthlyCategoryTotals = {};
            Object.keys(this.categories).forEach(cat => monthlyCategoryTotals[cat] = 0);
            
            monthExpenses.forEach(expense => {
                const eurAmount = this.convertToEur(expense.price, expense.currency);
                monthlyCategoryTotals[expense.category] += eurAmount;
            });

            html += `
                <tr>
                    <td>${months[index]}</td>
                    <td>€${monthlyCategoryTotals.groceries.toFixed(2)}</td>
                    <td>€${monthlyCategoryTotals.lifestyle.toFixed(2)}</td>
                    <td>€${monthlyCategoryTotals['once-in-a-while'].toFixed(2)}</td>
                    <td>€${monthlyCategoryTotals.unexpected.toFixed(2)}</td>
                    <td><strong>€${total.toFixed(2)}</strong></td>
                </tr>
            `;
        });

        // Add total row
        const yearTotal = monthlyTotals.reduce((sum, total) => sum + total, 0);
        html += `
            <tr class="total-row">
                <td><strong>Total</strong></td>
                <td><strong>€${categoryTotals.groceries.toFixed(2)}</strong></td>
                <td><strong>€${categoryTotals.lifestyle.toFixed(2)}</strong></td>
                <td><strong>€${categoryTotals['once-in-a-while'].toFixed(2)}</strong></td>
                <td><strong>€${categoryTotals.unexpected.toFixed(2)}</strong></td>
                <td><strong>€${yearTotal.toFixed(2)}</strong></td>
            </tr>
        `;

        tbody.innerHTML = html;
    }

    setCurrentDate() {
        // This method is called but we don't have dateInput anymore for single expense
        // It's handled in bulk rows initialization
    }

    renderCategories() {
        const container = document.getElementById('categoriesGrid');
        if (!container) return;
        
        container.innerHTML = '';

        Object.values(this.categories).forEach(category => {
            const categoryCard = this.createCategoryCard(category);
            container.appendChild(categoryCard);
        });
    }

    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';

        const expenses = this.getExpensesForCategory(category.id);
        const totalSpent = this.calculateCategoryTotal(expenses);
        const budget = this.budgets[category.id] || 0;
        const remaining = budget - totalSpent;
        const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

        let progressClass = '';
        if (totalSpent > budget && budget > 0) {
            progressClass = 'over-budget';
        } else if (percentage > 80) {
            progressClass = 'warning';
        }

        card.innerHTML = `
            <div class="category-header ${category.id}">
                <div class="category-info">
                    <span class="category-icon">${category.icon}</span>
                    <div class="category-details">
                        <h3>${category.name}</h3>
                        <div class="budget-info">
                            <span>Budget: €${budget.toFixed(2)}</span>
                            <span>Spent: €${totalSpent.toFixed(2)}</span>
                            <span style="color: ${remaining >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">
                                Remaining: €${remaining.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn btn--sm btn--outline budget-settings-btn" data-category="${category.id}">
                        ⚙️
                    </button>
                    <span class="expand-icon">▼</span>
                </div>
            </div>
            
            ${budget > 0 ? `
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-stats">
                    <span>${percentage.toFixed(1)}% used</span>
                    <span>${expenses.length} expenses</span>
                </div>
            </div>
            ` : ''}

            <div class="category-content">
                ${expenses.length > 0 ? `
                    <table class="expenses-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Store</th>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(expense => {
                                const eurAmount = this.convertToEur(expense.price, expense.currency);
                                return `
                                <tr>
                                    <td>${this.formatDate(expense.date)}</td>
                                    <td>${expense.store}</td>
                                    <td>${expense.item}</td>
                                    <td>${expense.quantity} ${expense.unit}</td>
                                    <td>
                                        <div class="currency-info">
                                            <div>€${eurAmount.toFixed(2)}</div>
                                            ${expense.currency !== 'EUR' ? 
                                                `<div class="original-amount">${this.formatCurrency(expense.price, expense.currency)}</div>` : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="expense-actions">
                                            <button class="edit-btn" data-expense-id="${expense.id}" title="Edit expense">✏️</button>
                                            <button class="delete-btn" data-expense-id="${expense.id}" title="Delete expense">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-expenses">
                        No expenses recorded for this category this month.
                        <br><br>
                        <button class="btn btn--sm btn--primary add-category-expense" data-category="${category.id}">
                            Add First Expense
                        </button>
                    </div>
                `}
            </div>
        `;

        return card;
    }

    getExpensesForCategory(categoryId) {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expense.category === categoryId &&
                   expenseDate.getMonth() === this.currentMonth &&
                   expenseDate.getFullYear() === this.currentYear;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    calculateCategoryTotal(expenses) {
        return expenses.reduce((total, expense) => 
            total + this.convertToEur(expense.price, expense.currency), 0);
    }

    editExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) return;

        // For editing, open bulk modal with single row
        this.bulkRows = [{ ...expense }];
        this.editingExpenseId = expenseId;
        
        const modal = document.getElementById('expenseModal');
        modal.querySelector('h2').textContent = 'Edit Expense';
        this.renderBulkRows();
        modal.classList.remove('hidden');

        // Change save button text
        document.getElementById('saveAllExpensesBtn').textContent = 'Update Expense';
    }

    deleteExpense(expenseId) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(e => e.id !== expenseId);
            this.renderCategories();
            this.updateTotals();
            this.showMessage('Expense deleted successfully!', 'success');
        }
    }

    openBudgetModal(categoryId = null) {
        const modal = document.getElementById('budgetModal');
        const container = document.getElementById('budgetInputs');
        
        if (!modal || !container) return;
        
        container.innerHTML = '';
        
        Object.values(this.categories).forEach(category => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'form-group';
            inputGroup.innerHTML = `
                <label class="form-label">${category.icon} ${category.name}</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>€</span>
                    <input type="number" id="budget-${category.id}" class="form-control" 
                           value="${this.budgets[category.id] || 0}" step="0.01" min="0">
                </div>
            `;
            container.appendChild(inputGroup);
        });

        modal.classList.remove('hidden');
        
        if (categoryId) {
            setTimeout(() => {
                const input = document.getElementById(`budget-${categoryId}`);
                if (input) input.focus();
            }, 100);
        }
    }

    closeBudgetModal() {
        document.getElementById('budgetModal').classList.add('hidden');
    }

    saveBudgets() {
        Object.keys(this.categories).forEach(categoryId => {
            const input = document.getElementById(`budget-${categoryId}`);
            if (input) {
                this.budgets[categoryId] = parseFloat(input.value) || 0;
            }
        });

        this.closeBudgetModal();
        this.renderCategories();
        this.updateTotals();
        this.showMessage('Budgets updated successfully!', 'success');
    }

    updateTotals() {
        const totalBudget = Object.values(this.budgets).reduce((sum, budget) => sum + budget, 0);
        const totalSpent = this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === this.currentMonth &&
                       expenseDate.getFullYear() === this.currentYear;
            })
            .reduce((sum, expense) => sum + this.convertToEur(expense.price, expense.currency), 0);
        const totalRemaining = totalBudget - totalSpent;

        const totalBudgetEl = document.getElementById('totalBudget');
        const totalSpentEl = document.getElementById('totalSpent');
        const totalRemainingEl = document.getElementById('totalRemaining');

        if (totalBudgetEl) totalBudgetEl.textContent = `€${totalBudget.toFixed(2)}`;
        if (totalSpentEl) totalSpentEl.textContent = `€${totalSpent.toFixed(2)}`;
        if (totalRemainingEl) {
            totalRemainingEl.textContent = `€${totalRemaining.toFixed(2)}`;
            totalRemainingEl.style.color = 
                totalRemaining >= 0 ? 'var(--color-success)' : 'var(--color-error)';
        }
    }

    exportData() {
        const data = {
            expenses: this.expenses,
            budgets: this.budgets,
            currencySettings: this.currencySettings,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };

        this.downloadJSON(data, `expense-tracker-${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, '0')}.json`);
        this.showMessage('Data exported successfully!', 'success');
    }

    exportAnnualData() {
        const yearExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === this.annualYear;
        });

        const data = {
            year: this.annualYear,
            expenses: yearExpenses,
            budgets: this.budgets,
            currencySettings: this.currencySettings,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };

        this.downloadJSON(data, `annual-expenses-${this.annualYear}.json`);
        this.showMessage('Annual data exported successfully!', 'success');
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.expenses && Array.isArray(data.expenses)) {
                    const existingIds = new Set(this.expenses.map(e => e.id));
                    const newExpenses = data.expenses.filter(e => !existingIds.has(e.id));
                    this.expenses = [...this.expenses, ...newExpenses];
                    this.nextExpenseId = Math.max(...this.expenses.map(e => e.id), this.nextExpenseId - 1) + 1;
                }
                
                if (data.budgets && typeof data.budgets === 'object') {
                    this.budgets = { ...this.budgets, ...data.budgets };
                }

                if (data.currencySettings && typeof data.currencySettings === 'object') {
                    this.currencySettings = { ...this.currencySettings, ...data.currencySettings };
                }

                this.renderCategories();
                this.updateTotals();
                this.showMessage('Data imported successfully!', 'success');
                
            } catch (error) {
                this.showMessage('Error importing data. Please check the file format.', 'error');
                console.error('Import error:', error);
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    }

    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        const messageElement = document.getElementById('messageContent');
        
        if (!container || !messageElement) return;
        
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        container.classList.remove('hidden');
        
        setTimeout(() => {
            container.classList.add('hidden');
        }, 3000);
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
}

// Initialize the application
let expenseTracker;

document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
    expenseTracker.init();
});