// Complete Expense Tracker Application
class ExpenseTracker {
    constructor() {
        // Application state
        this.currentMonth = 8; // September (0-indexed)
        this.currentYear = 2025;
        this.currentTab = 'monthly';
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

        // Categories configuration
        this.categories = {
            groceries: { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#4CAF50' },
            lifestyle: { id: 'lifestyle', name: 'Lifestyle', icon: '🎉', color: '#2196F3' },
            'once-in-a-while': { id: 'once-in-a-while', name: 'Once-in-a-while Items', icon: '⏰', color: '#FF9800' },
            unexpected: { id: 'unexpected', name: 'Unexpected', icon: '❗', color: '#F44336' }
        };

        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        this.charts = { monthly: null, category: null };
    }

    init() {
        this.loadData();
        this.loadSampleData();
        this.setupEventListeners();
        this.setCurrentDate();
        this.renderCurrentTab();
        this.updateTotals();
        this.updateCurrencyDisplay();
    }

    loadData() {
        try {
            const savedData = localStorage.getItem('expenseTrackerData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.expenses = data.expenses || [];
                this.budgets = { ...this.budgets, ...(data.budgets || {}) };
                this.currencySettings = { ...this.currencySettings, ...(data.currencySettings || {}) };
                this.nextExpenseId = Math.max(...this.expenses.map(e => e.id), 0) + 1;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    saveData() {
        try {
            const data = {
                expenses: this.expenses,
                budgets: this.budgets,
                currencySettings: this.currencySettings,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('expenseTrackerData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadSampleData() {
        if (this.expenses.length === 0) {
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
                },
                {
                    id: 3,
                    category: 'groceries',
                    date: '2025-08-15',
                    store: 'Rewe',
                    item: 'Weekly groceries',
                    quantity: 1,
                    unit: 'trip',
                    price: 45.30,
                    currency: 'EUR'
                },
                {
                    id: 4,
                    category: 'unexpected',
                    date: '2025-07-22',
                    store: 'Car Repair Shop',
                    item: 'Car maintenance',
                    quantity: 1,
                    unit: 'service',
                    price: 8500,
                    currency: 'INR'
                }
            ];
            this.nextExpenseId = 5;
            this.saveData();
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Month/Year selection
        document.getElementById('monthSelect').addEventListener('change', (e) => {
            this.currentMonth = parseInt(e.target.value);
            this.renderCurrentTab();
        });

        document.getElementById('yearSelect').addEventListener('change', (e) => {
            this.currentYear = parseInt(e.target.value);
            this.renderCurrentTab();
        });

        // Monthly view buttons
        document.getElementById('totalBudget').addEventListener('click', () => this.openBudgetModal());
        document.getElementById('setBudgetsBtn').addEventListener('click', () => this.openBudgetModal());
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openExpenseModal());
        document.getElementById('bulkAddBtn').addEventListener('click', () => this.openBulkExpenseModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportMonthlyData());

        // Import
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        // Annual view
        document.getElementById('exportAnnualBtn').addEventListener('click', () => this.exportAnnualData());

        // Currency settings
        document.getElementById('saveCurrencyBtn').addEventListener('click', () => this.saveCurrencySettings());
        document.getElementById('converterAmount').addEventListener('input', () => this.updateConverter());
        document.getElementById('converterFrom').addEventListener('change', () => this.updateConverter());
        document.getElementById('converterTo').addEventListener('change', () => this.updateConverter());

        // Modal event listeners
        this.setupModalListeners();
    }

    setupModalListeners() {
        // Expense modal
        document.getElementById('closeExpenseModal').addEventListener('click', () => this.closeExpenseModal());
        document.getElementById('cancelExpense').addEventListener('click', () => this.closeExpenseModal());
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.saveExpense(e));

        // Bulk expense modal
        document.getElementById('closeBulkModal').addEventListener('click', () => this.closeBulkExpenseModal());
        document.getElementById('cancelBulk').addEventListener('click', () => this.closeBulkExpenseModal());
        document.getElementById('addRowBtn').addEventListener('click', () => this.addBulkRow());
        document.getElementById('removeRowBtn').addEventListener('click', () => this.removeBulkRow());
        document.getElementById('saveBulkExpenses').addEventListener('click', () => this.saveBulkExpenses());

        // Budget modal
        document.getElementById('closeBudgetModal').addEventListener('click', () => this.closeBudgetModal());
        document.getElementById('cancelBudget').addEventListener('click', () => this.closeBudgetModal());
        document.getElementById('budgetForm').addEventListener('submit', (e) => this.saveBudgets(e));

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    const modal = overlay.closest('.modal');
                    if (modal) modal.classList.add('hidden');
                }
            });
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        this.renderCurrentTab();
    }

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'monthly':
                this.renderMonthlyView();
                break;
            case 'annual':
                this.renderAnnualSummary();
                break;
            case 'currency':
                this.renderCurrencySettings();
                break;
        }
        this.updateTotals();
    }

    renderMonthlyView() {
        this.renderCategories();
    }

    renderCategories() {
        const container = document.getElementById('categoriesGrid');
        if (!container) return;
        
        container.innerHTML = '';

        Object.values(this.categories).forEach(category => {
            const categoryCard = this.createCategoryCard(category);
            container.appendChild(categoryCard);
        });

        this.setupCategoryEventListeners();
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
                            Budget: <span class="budget-amount" data-category="${category.id}">€${budget.toFixed(2)}</span><br>
                            Spent: €${totalSpent.toFixed(2)}<br>
                            <span style="color: ${remaining >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">
                                Remaining: €${remaining.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="edit-budget-btn" data-category="${category.id}">✏️ Edit Budget</button>
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
                                <th>Unit</th>
                                <th>Price (EUR)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(expense => `
                                <tr>
                                    <td>${this.formatDate(expense.date)}</td>
                                    <td>${expense.store || 'N/A'}</td>
                                    <td>${expense.item || 'N/A'}</td>
                                    <td>${expense.quantity || 'N/A'}</td>
                                    <td>${expense.unit || 'N/A'}</td>
                                    <td>€${this.convertToEur(expense.price, expense.currency).toFixed(2)}</td>
                                    <td>
                                        <div class="expense-actions">
                                            <button class="edit-btn" data-expense-id="${expense.id}">✏️</button>
                                            <button class="delete-btn" data-expense-id="${expense.id}">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-expenses">
                        No expenses recorded for this category this month.
                    </div>
                `}
            </div>
        `;

        return card;
    }

    setupCategoryEventListeners() {
        // Category header toggles
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.category-actions') || e.target.classList.contains('budget-amount')) {
                    return;
                }
                
                const card = header.closest('.category-card');
                const content = card.querySelector('.category-content');
                const expandIcon = card.querySelector('.expand-icon');
                
                content.classList.toggle('expanded');
                expandIcon.classList.toggle('rotated');
            });
        });

        // Budget amounts
        document.querySelectorAll('.budget-amount').forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryId = element.dataset.category;
                this.openBudgetModal(categoryId);
            });
        });

        // Edit budget buttons
        document.querySelectorAll('.edit-budget-btn').forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryId = element.dataset.category;
                this.openBudgetModal(categoryId);
            });
        });

        // Expense actions
        document.querySelectorAll('.edit-btn').forEach(element => {
            element.addEventListener('click', () => {
                const expenseId = parseInt(element.dataset.expenseId);
                this.editExpense(expenseId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(element => {
            element.addEventListener('click', () => {
                const expenseId = parseInt(element.dataset.expenseId);
                this.deleteExpense(expenseId);
            });
        });
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
        return expenses.reduce((total, expense) => {
            return total + this.convertToEur(expense.price, expense.currency);
        }, 0);
    }

    convertToEur(amount, currency) {
        if (currency === 'INR') {
            return amount / this.currencySettings.eurToInrRate;
        }
        return amount;
    }

    convertFromEur(amount, targetCurrency) {
        if (targetCurrency === 'INR') {
            return amount * this.currencySettings.eurToInrRate;
        }
        return amount;
    }

    // Modal Management
    openExpenseModal(categoryId = null) {
        const modal = document.getElementById('expenseModal');
        const form = document.getElementById('expenseForm');
        const title = document.getElementById('expenseModalTitle');
        
        form.reset();
        this.setCurrentDate();
        
        if (this.editingExpenseId) {
            title.textContent = 'Edit Expense';
            const expense = this.expenses.find(e => e.id === this.editingExpenseId);
            if (expense) {
                document.getElementById('categorySelect').value = expense.category;
                document.getElementById('dateInput').value = expense.date;
                document.getElementById('storeInput').value = expense.store || '';
                document.getElementById('itemInput').value = expense.item || '';
                document.getElementById('quantityInput').value = expense.quantity || '';
                document.getElementById('unitInput').value = expense.unit || '';
                document.getElementById('priceInput').value = expense.price;
                document.getElementById('currencySelect').value = expense.currency || 'EUR';
            }
        } else {
            title.textContent = 'Add New Expense';
            document.getElementById('currencySelect').value = this.currencySettings.defaultCurrency;
            if (categoryId) {
                document.getElementById('categorySelect').value = categoryId;
            }
        }
        
        modal.classList.remove('hidden');
    }

    closeExpenseModal() {
        document.getElementById('expenseModal').classList.add('hidden');
        this.editingExpenseId = null;
    }

    saveExpense(e) {
        e.preventDefault();
        
        const formData = {
            category: document.getElementById('categorySelect').value,
            date: document.getElementById('dateInput').value,
            store: document.getElementById('storeInput').value,
            item: document.getElementById('itemInput').value,
            quantity: parseFloat(document.getElementById('quantityInput').value) || null,
            unit: document.getElementById('unitInput').value,
            price: parseFloat(document.getElementById('priceInput').value),
            currency: document.getElementById('currencySelect').value
        };

        if (!formData.category || !formData.date || !formData.price) {
            this.showMessage('Please fill in required fields (Category, Date, Price).', 'error');
            return;
        }

        if (this.editingExpenseId) {
            const index = this.expenses.findIndex(e => e.id === this.editingExpenseId);
            if (index !== -1) {
                this.expenses[index] = { ...formData, id: this.editingExpenseId };
                this.showMessage('Expense updated successfully!', 'success');
            }
        } else {
            const newExpense = { ...formData, id: this.nextExpenseId++ };
            this.expenses.push(newExpense);
            this.showMessage('Expense added successfully!', 'success');
        }

        this.closeExpenseModal();
        this.renderCurrentTab();
        this.saveData();
    }

    editExpense(expenseId) {
        this.editingExpenseId = expenseId;
        this.openExpenseModal();
    }

    deleteExpense(expenseId) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(e => e.id !== expenseId);
            this.renderCurrentTab();
            this.saveData();
            this.showMessage('Expense deleted successfully!', 'success');
        }
    }

    // Bulk Expense Management
    openBulkExpenseModal() {
        const modal = document.getElementById('bulkExpenseModal');
        this.renderBulkExpenseTable();
        modal.classList.remove('hidden');
    }

    closeBulkExpenseModal() {
        document.getElementById('bulkExpenseModal').classList.add('hidden');
    }

    renderBulkExpenseTable() {
        const tbody = document.getElementById('bulkTableBody');
        tbody.innerHTML = '';
        
        // Start with 3 empty rows
        for (let i = 0; i < 3; i++) {
            this.addBulkRow();
        }
    }

    addBulkRow() {
        const tbody = document.getElementById('bulkTableBody');
        const row = document.createElement('tr');
        const today = new Date().toISOString().split('T')[0];
        
        row.innerHTML = `
            <td class="date-col">
                <input type="date" value="${today}" required>
            </td>
            <td class="price-col">
                <input type="number" step="0.01" min="0" placeholder="0.00" required>
            </td>
            <td class="currency-col">
                <select>
                    <option value="EUR" ${this.currencySettings.defaultCurrency === 'EUR' ? 'selected' : ''}>EUR</option>
                    <option value="INR" ${this.currencySettings.defaultCurrency === 'INR' ? 'selected' : ''}>INR</option>
                </select>
            </td>
            <td class="category-col">
                <select>
                    <option value="">Select...</option>
                    <option value="groceries">🛒 Groceries</option>
                    <option value="lifestyle">🎉 Lifestyle</option>
                    <option value="once-in-a-while">⏰ Once-in-a-while Items</option>
                    <option value="unexpected">❗ Unexpected</option>
                </select>
            </td>
            <td class="store-col">
                <input type="text" placeholder="Store">
            </td>
            <td class="item-col">
                <input type="text" placeholder="Item">
            </td>
            <td class="qty-col">
                <input type="number" step="0.01" min="0" placeholder="1">
            </td>
            <td class="unit-col">
                <input type="text" placeholder="unit">
            </td>
            <td class="action-col">
                <button type="button" class="remove-row-btn" onclick="this.closest('tr').remove()">×</button>
            </td>
        `;
        
        tbody.appendChild(row);
    }

    removeBulkRow() {
        const tbody = document.getElementById('bulkTableBody');
        if (tbody.children.length > 1) {
            tbody.removeChild(tbody.lastElementChild);
        }
    }

    saveBulkExpenses() {
        const tbody = document.getElementById('bulkTableBody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const newExpenses = [];
        let hasErrors = false;

        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input, select');
            const date = inputs[0].value;
            const price = parseFloat(inputs[1].value);
            const currency = inputs[2].value;
            const category = inputs[3].value;
            const store = inputs[4].value;
            const item = inputs[5].value;
            const quantity = parseFloat(inputs[6].value) || null;
            const unit = inputs[7].value;

            // Check required fields
            if (date && price > 0) {
                newExpenses.push({
                    id: this.nextExpenseId++,
                    date,
                    price,
                    currency,
                    category: category || 'groceries', // Default to groceries if not specified
                    store,
                    item,
                    quantity,
                    unit
                });
            } else if (date || price || category || store || item) {
                // If any field is filled but required fields are missing
                hasErrors = true;
                row.style.backgroundColor = 'rgba(255, 84, 89, 0.1)';
            }
        });

        if (hasErrors) {
            this.showMessage('Some rows have missing required fields (Date* and Price*).', 'error');
            return;
        }

        if (newExpenses.length === 0) {
            this.showMessage('Please add at least one expense.', 'error');
            return;
        }

        this.expenses = [...this.expenses, ...newExpenses];
        this.closeBulkExpenseModal();
        this.renderCurrentTab();
        this.saveData();
        this.showMessage(`${newExpenses.length} expenses added successfully!`, 'success');
    }

    // Budget Management
    openBudgetModal(categoryId = null) {
        const modal = document.getElementById('budgetModal');
        const container = document.getElementById('budgetInputs');
        
        container.innerHTML = '';
        
        Object.values(this.categories).forEach(category => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'form-group';
            inputGroup.innerHTML = `
                <label class="form-label">${category.icon} ${category.name}</label>
                <div class="budget-input-group">
                    <span class="currency">€</span>
                    <input type="number" id="budget-${category.id}" step="0.01" min="0" 
                           value="${this.budgets[category.id] || 0}" placeholder="0.00">
                </div>
            `;
            container.appendChild(inputGroup);
        });

        modal.classList.remove('hidden');
        
        if (categoryId) {
            setTimeout(() => {
                const input = document.getElementById(`budget-${categoryId}`);
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);
        }
    }

    closeBudgetModal() {
        document.getElementById('budgetModal').classList.add('hidden');
    }

    saveBudgets(e) {
        e.preventDefault();
        
        Object.keys(this.categories).forEach(categoryId => {
            const input = document.getElementById(`budget-${categoryId}`);
            if (input) {
                this.budgets[categoryId] = parseFloat(input.value) || 0;
            }
        });

        this.closeBudgetModal();
        this.renderCurrentTab();
        this.saveData();
        this.showMessage('Budgets updated successfully!', 'success');
    }

    // Annual Summary
    renderAnnualSummary() {
        document.getElementById('currentYear').textContent = this.currentYear;
        
        const yearlyExpenses = this.getYearlyExpenses();
        const monthlyTotals = this.calculateMonthlyTotals(yearlyExpenses);
        const categoryTotals = this.calculateCategoryTotals(yearlyExpenses);
        
        this.updateAnnualSummaryCards(yearlyExpenses);
        this.renderMonthlyBreakdownTable(monthlyTotals);
        this.renderCategoryBreakdownTable(categoryTotals);
        this.renderAnnualCharts(monthlyTotals, categoryTotals);
    }

    getYearlyExpenses() {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === this.currentYear;
        });
    }

    calculateMonthlyTotals(yearlyExpenses) {
        const monthlyTotals = Array(12).fill(0);
        const monthlyBudgets = Array(12).fill(0).map(() => Object.values(this.budgets).reduce((sum, b) => sum + b, 0));
        
        yearlyExpenses.forEach(expense => {
            const month = new Date(expense.date).getMonth();
            monthlyTotals[month] += this.convertToEur(expense.price, expense.currency);
        });

        return monthlyTotals.map((total, index) => ({
            month: index,
            total: total,
            budget: monthlyBudgets[index],
            overUnder: total - monthlyBudgets[index]
        }));
    }

    calculateCategoryTotals(yearlyExpenses) {
        const categoryTotals = {};
        
        Object.keys(this.categories).forEach(categoryId => {
            const categoryExpenses = yearlyExpenses.filter(e => e.category === categoryId);
            const total = categoryExpenses.reduce((sum, expense) => {
                return sum + this.convertToEur(expense.price, expense.currency);
            }, 0);
            
            categoryTotals[categoryId] = {
                category: this.categories[categoryId].name,
                total: total,
                budget: (this.budgets[categoryId] || 0) * 12,
                overUnder: total - ((this.budgets[categoryId] || 0) * 12),
                avgMonthly: total / 12
            };
        });
        
        return categoryTotals;
    }

    updateAnnualSummaryCards(yearlyExpenses) {
        const totalSpent = yearlyExpenses.reduce((sum, expense) => {
            return sum + this.convertToEur(expense.price, expense.currency);
        }, 0);
        
        const monthlyTotals = this.calculateMonthlyTotals(yearlyExpenses);
        const avgMonthly = totalSpent / 12;
        const highestMonth = Math.max(...monthlyTotals.map(m => m.total));
        
        // Find top category
        const categoryTotals = this.calculateCategoryTotals(yearlyExpenses);
        const topCategoryId = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a].total > categoryTotals[b].total ? a : b
        );
        const topCategory = categoryTotals[topCategoryId]?.category || 'None';

        document.getElementById('annualTotalSpent').textContent = `€${totalSpent.toFixed(2)}`;
        document.getElementById('annualAverage').textContent = `€${avgMonthly.toFixed(2)}`;
        document.getElementById('annualHighest').textContent = `€${highestMonth.toFixed(2)}`;
        document.getElementById('topCategory').textContent = topCategory;
    }

    renderMonthlyBreakdownTable(monthlyTotals) {
        const tbody = document.querySelector('#monthlyBreakdown tbody');
        tbody.innerHTML = '';
        
        let cumulativeOverUnder = 0;
        
        monthlyTotals.forEach((month, index) => {
            cumulativeOverUnder += month.overUnder;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.monthNames[index]}</td>
                <td>€${month.total.toFixed(2)}</td>
                <td>€${month.budget.toFixed(2)}</td>
                <td class="${month.overUnder >= 0 ? 'negative' : 'positive'}">€${month.overUnder.toFixed(2)}</td>
                <td class="${cumulativeOverUnder >= 0 ? 'negative' : 'positive'}">€${cumulativeOverUnder.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    renderCategoryBreakdownTable(categoryTotals) {
        const tbody = document.querySelector('#categoryBreakdown tbody');
        tbody.innerHTML = '';
        
        Object.values(categoryTotals).forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.category}</td>
                <td>€${category.total.toFixed(2)}</td>
                <td>€${category.budget.toFixed(2)}</td>
                <td class="${category.overUnder >= 0 ? 'negative' : 'positive'}">€${category.overUnder.toFixed(2)}</td>
                <td>€${category.avgMonthly.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    renderAnnualCharts(monthlyTotals, categoryTotals) {
        this.renderMonthlyTrendChart(monthlyTotals);
        this.renderCategoryDistributionChart(categoryTotals);
    }

    renderMonthlyTrendChart(monthlyTotals) {
        const ctx = document.getElementById('monthlyTrendChart');
        if (!ctx) return;

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.monthNames,
                datasets: [{
                    label: 'Monthly Spending',
                    data: monthlyTotals.map(m => m.total),
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Monthly Budget',
                    data: monthlyTotals.map(m => m.budget),
                    borderColor: '#FFC185',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5]
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
                                return '€' + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': €' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    renderCategoryDistributionChart(categoryTotals) {
        const ctx = document.getElementById('categoryDistributionChart');
        if (!ctx) return;

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const data = Object.values(categoryTotals).filter(c => c.total > 0);
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(c => c.category),
                datasets: [{
                    data: data.map(c => c.total),
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': €' + context.parsed.toFixed(2) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    // Currency Settings
    renderCurrencySettings() {
        this.updateCurrencyDisplay();
    }

    updateCurrencyDisplay() {
        document.getElementById('conversionRate').value = this.currencySettings.eurToInrRate;
        document.getElementById('defaultCurrency').value = this.currencySettings.defaultCurrency;
        document.getElementById('lastUpdated').value = new Date(this.currencySettings.lastUpdated).toLocaleString();
    }

    saveCurrencySettings() {
        this.currencySettings.eurToInrRate = parseFloat(document.getElementById('conversionRate').value) || 90;
        this.currencySettings.defaultCurrency = document.getElementById('defaultCurrency').value;
        this.currencySettings.lastUpdated = new Date().toISOString();
        
        this.updateCurrencyDisplay();
        this.saveData();
        this.showMessage('Currency settings saved successfully!', 'success');
    }

    updateConverter() {
        const amount = parseFloat(document.getElementById('converterAmount').value) || 0;
        const from = document.getElementById('converterFrom').value;
        const to = document.getElementById('converterTo').value;
        
        let result = amount;
        
        if (from === 'EUR' && to === 'INR') {
            result = amount * this.currencySettings.eurToInrRate;
        } else if (from === 'INR' && to === 'EUR') {
            result = amount / this.currencySettings.eurToInrRate;
        }
        
        document.getElementById('converterResult').value = result.toFixed(2);
    }

    // Data Export/Import
    exportMonthlyData() {
        const monthlyExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === this.currentMonth &&
                   expenseDate.getFullYear() === this.currentYear;
        });

        const data = {
            type: 'monthly',
            month: this.currentMonth,
            year: this.currentYear,
            expenses: monthlyExpenses,
            budgets: this.budgets,
            currencySettings: this.currencySettings,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };

        this.downloadJson(data, `expense-tracker-${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}.json`);
        this.showMessage('Monthly data exported successfully!', 'success');
    }

    exportAnnualData() {
        const yearlyExpenses = this.getYearlyExpenses();
        
        const data = {
            type: 'annual',
            year: this.currentYear,
            expenses: yearlyExpenses,
            budgets: this.budgets,
            currencySettings: this.currencySettings,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };

        this.downloadJson(data, `expense-tracker-annual-${this.currentYear}.json`);
        this.showMessage('Annual data exported successfully!', 'success');
    }

    downloadJson(data, filename) {
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
                    // Merge expenses instead of replacing
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

                this.renderCurrentTab();
                this.saveData();
                this.showMessage(`Data imported successfully! Added ${data.expenses ? data.expenses.length : 0} expenses.`, 'success');
                
            } catch (error) {
                this.showMessage('Error importing data. Please check the file format.', 'error');
                console.error('Import error:', error);
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    // Utility Methods
    setCurrentDate() {
        const dateInput = document.getElementById('dateInput');
        if (dateInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    }

    updateTotals() {
        if (this.currentTab !== 'monthly') return;

        const totalBudget = Object.values(this.budgets).reduce((sum, budget) => sum + budget, 0);
        const monthlyExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === this.currentMonth &&
                   expenseDate.getFullYear() === this.currentYear;
        });
        
        const totalSpent = monthlyExpenses.reduce((sum, expense) => {
            return sum + this.convertToEur(expense.price, expense.currency);
        }, 0);
        
        const totalRemaining = totalBudget - totalSpent;

        document.getElementById('totalBudget').textContent = `€${totalBudget.toFixed(2)}`;
        document.getElementById('totalSpent').textContent = `€${totalSpent.toFixed(2)}`;
        document.getElementById('totalRemaining').textContent = `€${totalRemaining.toFixed(2)}`;
        
        const remainingElement = document.getElementById('totalRemaining');
        remainingElement.style.color = totalRemaining >= 0 ? 'var(--color-success)' : 'var(--color-error)';
    }

    showMessage(message, type = 'info') {
        const toast = document.getElementById('messageToast');
        const content = document.getElementById('messageContent');
        
        content.textContent = message;
        toast.className = `toast ${type}`;
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
}

// Initialize the application
let expenseTracker;

document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
    expenseTracker.init();
});