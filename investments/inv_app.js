// Investment Tracker Application
let investmentTracker = null;

class InvestmentTracker {
    constructor() {
        this.data = {
            investments: [],
            goals: [],
            exchangeRate: 103.33,
            settings: { theme: 'auto' }
        };
        
        this.charts = {};
        this.goalCharts = {};
        this.currentEditingInvestment = null;
        this.currentEditingGoal = null;
        this.currentAnalyticsTab = 'overview';
        this.currentFundFilter = 'all';
        
        this.fundSuggestions = {
            "Equity": [
                "HDFC Top 100 Fund", "ICICI Prudential Bluechip Fund", "Axis Bluechip Fund",
                "SBI Large Cap Fund", "Nippon India Large Cap Fund", "Mirae Asset Large Cap Fund",
                "SBI Small Cap Fund", "Axis Small Cap Fund", "HDFC Mid-Cap Opportunities Fund",
                "Kotak Emerging Equity Fund"
            ],
            "Debt": [
                "ICICI Prudential Corporate Bond Fund", "Aditya Birla Sun Life Medium Term Plan", 
                "HDFC Corporate Bond Fund", "Axis Corporate Bond Fund", "SBI Corporate Bond Fund",
                "Kotak Corporate Bond Fund", "Franklin India Corporate Debt Fund",
                "ICICI Prudential Short Term Fund", "Nippon India Credit Risk Fund", "UTI Corporate Bond Fund"
            ]
        };

        this.init();
    }

    init() {
        console.log('Initializing Investment Tracker...');
        this.loadData();
        this.loadSampleDataIfEmpty();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.updateCurrencyRate();
        this.showTab('portfolio');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Tab navigation - Fixed event delegation
        const navTabs = document.querySelectorAll('.nav__tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                console.log('Tab clicked:', tabName);
                this.showTab(tabName);
            });
        });

        // Analytics sub-tab navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('analytics-tab')) {
                e.preventDefault();
                const analyticsTab = e.target.dataset.analyticsTab;
                this.showAnalyticsTab(analyticsTab);
            }
            
            // Fund filter buttons
            if (e.target.classList.contains('fund-filter-btn')) {
                e.preventDefault();
                const filter = e.target.dataset.fundFilter;
                this.setFundFilter(filter);
            }
        });

        // Quick add investment button
        const quickAddBtn = document.getElementById('quickAddInvestment');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.showTab('add-investment'));
        }

        // Add goal button
        const addGoalBtn = document.getElementById('addGoalBtn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.openGoalModal());
        }

        // Form submissions
        const investmentForm = document.getElementById('investmentForm');
        if (investmentForm) {
            investmentForm.addEventListener('submit', (e) => this.handleAddInvestment(e));
        }

        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
        }

        const editInvestmentForm = document.getElementById('editInvestmentForm');
        if (editInvestmentForm) {
            editInvestmentForm.addEventListener('submit', (e) => this.handleEditInvestment(e));
        }

        // Currency conversion
        const investmentAmount = document.getElementById('investmentAmount');
        const investmentCurrency = document.getElementById('investmentCurrency');
        const investmentType = document.getElementById('investmentType');
        
        if (investmentAmount) {
            investmentAmount.addEventListener('input', () => this.updateCurrencyConversion());
        }
        if (investmentCurrency) {
            investmentCurrency.addEventListener('change', () => this.updateCurrencyConversion());
        }
        if (investmentType) {
            investmentType.addEventListener('change', () => this.updateFundSuggestions());
        }

        // Modal events
        this.setupModalEvents();

        // Settings events
        this.setupSettingsEvents();

        // Filter events
        const goalFilter = document.getElementById('goalFilter');
        const typeFilter = document.getElementById('typeFilter');
        if (goalFilter) goalFilter.addEventListener('change', () => this.updateInvestmentTable());
        if (typeFilter) typeFilter.addEventListener('change', () => this.updateInvestmentTable());

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Clear form
        const clearBtn = document.getElementById('clearForm');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearInvestmentForm());
        }

        console.log('Event listeners set up successfully');
    }

    setupModalEvents() {
        // Goal modal
        const goalModalClose = document.getElementById('goalModalClose');
        const goalModalCancel = document.getElementById('goalModalCancel');
        const goalModalOverlay = document.getElementById('goalModalOverlay');
        
        if (goalModalClose) goalModalClose.addEventListener('click', () => this.closeGoalModal());
        if (goalModalCancel) goalModalCancel.addEventListener('click', () => this.closeGoalModal());
        if (goalModalOverlay) goalModalOverlay.addEventListener('click', () => this.closeGoalModal());

        // Investment modal
        const invModalClose = document.getElementById('investmentModalClose');
        const invModalCancel = document.getElementById('investmentModalCancel');
        const invModalOverlay = document.getElementById('investmentModalOverlay');
        
        if (invModalClose) invModalClose.addEventListener('click', () => this.closeInvestmentModal());
        if (invModalCancel) invModalCancel.addEventListener('click', () => this.closeInvestmentModal());
        if (invModalOverlay) invModalOverlay.addEventListener('click', () => this.closeInvestmentModal());

        // Notification close
        const notificationClose = document.getElementById('notificationClose');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => this.hideNotification());
        }
    }

    setupSettingsEvents() {
        const updateRateBtn = document.getElementById('updateRateBtn');
        if (updateRateBtn) {
            updateRateBtn.addEventListener('click', () => this.updateExchangeRate());
        }

        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }

        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }

        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        const loadSampleBtn = document.getElementById('loadSampleDataBtn');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => this.loadSampleData());
        }
    }

    showTab(tabName) {
        console.log('Showing tab:', tabName);
        
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.nav__tab');
        tabButtons.forEach(btn => {
            btn.classList.remove('nav__tab--active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('nav__tab--active');
            }
        });

        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('tab-content--active');
        });
        
        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.classList.add('tab-content--active');
            
            // Load tab-specific content
            setTimeout(() => {
                switch(tabName) {
                    case 'portfolio':
                        this.updatePortfolioSummary();
                        this.updateInvestmentTable();
                        this.populateGoalFilters();
                        break;
                    case 'add-investment':
                        this.populateGoalDropdown();
                        this.updateFundSuggestions();
                        this.updateCurrencyConversion();
                        this.setTodaysDate();
                        break;
                    case 'goals':
                        this.updateGoalsGrid();
                        break;
                    case 'analytics':
                        this.showAnalyticsTab(this.currentAnalyticsTab);
                        break;
                    case 'settings':
                        this.updateSettingsForm();
                        break;
                }
            }, 50);
        }
    }

    showAnalyticsTab(analyticsTabName) {
        this.currentAnalyticsTab = analyticsTabName;
        
        // Update analytics tab buttons
        const analyticsTabButtons = document.querySelectorAll('.analytics-tab');
        analyticsTabButtons.forEach(btn => {
            btn.classList.remove('analytics-tab--active');
            if (btn.dataset.analyticsTab === analyticsTabName) {
                btn.classList.add('analytics-tab--active');
            }
        });

        // Update analytics content
        const analyticsContents = document.querySelectorAll('.analytics-content');
        analyticsContents.forEach(content => {
            content.classList.remove('analytics-content--active');
        });
        
        const activeAnalyticsContent = document.getElementById(`${analyticsTabName}-analytics`);
        if (activeAnalyticsContent) {
            activeAnalyticsContent.classList.add('analytics-content--active');
            
            // Load analytics-specific content
            setTimeout(() => {
                switch(analyticsTabName) {
                    case 'overview':
                        this.updateOverviewCharts();
                        break;
                    case 'goal-allocation':
                        this.updateGoalAllocationAnalytics();
                        break;
                    case 'fund-distribution':
                        this.updateFundDistributionAnalytics();
                        break;
                    case 'timeline':
                        this.updateTimelineChart();
                        break;
                }
            }, 50);
        }
    }

    setFundFilter(filter) {
        this.currentFundFilter = filter;
        
        // Update filter buttons
        const filterButtons = document.querySelectorAll('.fund-filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('fund-filter-btn--active');
            if (btn.dataset.fundFilter === filter) {
                btn.classList.add('fund-filter-btn--active');
            }
        });

        // Update fund distribution display
        this.updateFundDistributionCards();
    }

    setTodaysDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('investmentDate');
        if (dateInput) dateInput.value = today;
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    updateCurrencyRate() {
        const rateEl = document.getElementById('currencyRate');
        if (rateEl) {
            rateEl.textContent = `1 EUR = ₹${this.data.exchangeRate}`;
        }
    }

    updateCurrencyConversion() {
        const amountInput = document.getElementById('investmentAmount');
        const currencySelect = document.getElementById('investmentCurrency');
        const inrDisplay = document.getElementById('amountInINR');
        
        if (!amountInput || !currencySelect || !inrDisplay) return;
        
        const amount = parseFloat(amountInput.value) || 0;
        const currency = currencySelect.value;
        
        if (currency === 'EUR') {
            const inrAmount = amount * this.data.exchangeRate;
            inrDisplay.value = `₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        } else {
            inrDisplay.value = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
    }

    updateFundSuggestions() {
        const typeSelect = document.getElementById('investmentType');
        const datalist = document.getElementById('fundSuggestions');
        
        if (!typeSelect || !datalist) return;
        
        const type = typeSelect.value;
        datalist.innerHTML = '';
        
        if (type && this.fundSuggestions[type]) {
            this.fundSuggestions[type].forEach(fund => {
                const option = document.createElement('option');
                option.value = fund;
                datalist.appendChild(option);
            });
        }
    }

    populateGoalDropdown() {
        const select = document.getElementById('investmentGoal');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Goal</option>';
        this.data.goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.name;
            select.appendChild(option);
        });
    }

    populateGoalFilters() {
        const filter = document.getElementById('goalFilter');
        if (!filter) return;
        
        filter.innerHTML = '<option value="">All Goals</option>';
        this.data.goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.name;
            filter.appendChild(option);
        });
    }

    handleAddInvestment(e) {
        e.preventDefault();
        
        const investment = {
            id: 'inv-' + Date.now(),
            date: document.getElementById('investmentDate').value,
            amount: parseFloat(document.getElementById('investmentAmount').value),
            currency: document.getElementById('investmentCurrency').value,
            type: document.getElementById('investmentType').value,
            fundName: document.getElementById('fundName').value,
            goalId: document.getElementById('investmentGoal').value,
            notes: document.getElementById('investmentNotes').value || ''
        };

        this.data.investments.push(investment);
        this.saveData();
        this.showNotification('Investment added successfully!', 'success');
        this.clearInvestmentForm();
        this.updatePortfolioSummary();
        this.updateInvestmentTable();
    }

    clearInvestmentForm() {
        const form = document.getElementById('investmentForm');
        if (form) form.reset();
        this.setTodaysDate();
        this.updateCurrencyConversion();
    }

    handleAddGoal(e) {
        e.preventDefault();
        
        const goal = {
            id: this.currentEditingGoal || 'goal-' + Date.now(),
            name: document.getElementById('goalName').value,
            target: parseFloat(document.getElementById('goalTarget').value),
            description: document.getElementById('goalDescription').value || '',
            color: document.getElementById('goalColor').value,
            created: this.currentEditingGoal ? 
                this.data.goals.find(g => g.id === this.currentEditingGoal).created : 
                new Date().toISOString().split('T')[0]
        };

        if (this.currentEditingGoal) {
            const index = this.data.goals.findIndex(g => g.id === this.currentEditingGoal);
            this.data.goals[index] = goal;
            this.showNotification('Goal updated successfully!', 'success');
        } else {
            this.data.goals.push(goal);
            this.showNotification('Goal added successfully!', 'success');
        }

        this.saveData();
        this.closeGoalModal();
        this.updateGoalsGrid();
        this.populateGoalDropdown();
    }

    handleEditInvestment(e) {
        e.preventDefault();
        
        if (!this.currentEditingInvestment) return;

        const investment = this.data.investments.find(inv => inv.id === this.currentEditingInvestment);
        if (!investment) return;

        investment.date = document.getElementById('editInvestmentDate').value;
        investment.amount = parseFloat(document.getElementById('editInvestmentAmount').value);
        investment.currency = document.getElementById('editInvestmentCurrency').value;
        investment.type = document.getElementById('editInvestmentType').value;
        investment.fundName = document.getElementById('editFundName').value;
        investment.goalId = document.getElementById('editInvestmentGoal').value;
        investment.notes = document.getElementById('editInvestmentNotes').value || '';

        this.saveData();
        this.showNotification('Investment updated successfully!', 'success');
        this.closeInvestmentModal();
        this.updatePortfolioSummary();
        this.updateInvestmentTable();
    }

    openGoalModal(goalId = null) {
        this.currentEditingGoal = goalId;
        
        if (goalId) {
            const goal = this.data.goals.find(g => g.id === goalId);
            document.getElementById('goalModalTitle').textContent = 'Edit Goal';
            document.getElementById('goalName').value = goal.name;
            document.getElementById('goalTarget').value = goal.target;
            document.getElementById('goalDescription').value = goal.description;
            document.getElementById('goalColor').value = goal.color;
        } else {
            document.getElementById('goalModalTitle').textContent = 'Add Goal';
            const form = document.getElementById('goalForm');
            if (form) form.reset();
        }
        
        const modal = document.getElementById('goalModal');
        if (modal) modal.classList.remove('hidden');
    }

    closeGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) modal.classList.add('hidden');
        this.currentEditingGoal = null;
    }

    openInvestmentModal(investmentId) {
        const investment = this.data.investments.find(inv => inv.id === investmentId);
        if (!investment) return;

        this.currentEditingInvestment = investmentId;
        
        document.getElementById('editInvestmentDate').value = investment.date;
        document.getElementById('editInvestmentAmount').value = investment.amount;
        document.getElementById('editInvestmentCurrency').value = investment.currency;
        document.getElementById('editInvestmentType').value = investment.type;
        document.getElementById('editFundName').value = investment.fundName;
        document.getElementById('editInvestmentNotes').value = investment.notes || '';

        // Populate goal dropdown for edit
        const editGoalSelect = document.getElementById('editInvestmentGoal');
        editGoalSelect.innerHTML = '';
        this.data.goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.name;
            option.selected = goal.id === investment.goalId;
            editGoalSelect.appendChild(option);
        });

        const modal = document.getElementById('investmentModal');
        if (modal) modal.classList.remove('hidden');
    }

    closeInvestmentModal() {
        const modal = document.getElementById('investmentModal');
        if (modal) modal.classList.add('hidden');
        this.currentEditingInvestment = null;
    }

    deleteInvestment(investmentId) {
        if (confirm('Are you sure you want to delete this investment?')) {
            this.data.investments = this.data.investments.filter(inv => inv.id !== investmentId);
            this.saveData();
            this.showNotification('Investment deleted successfully!', 'success');
            this.updatePortfolioSummary();
            this.updateInvestmentTable();
        }
    }

    deleteGoal(goalId) {
        const goalInvestments = this.data.investments.filter(inv => inv.goalId === goalId);
        if (goalInvestments.length > 0) {
            this.showNotification('Cannot delete goal with existing investments!', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this goal?')) {
            this.data.goals = this.data.goals.filter(goal => goal.id !== goalId);
            this.saveData();
            this.showNotification('Goal deleted successfully!', 'success');
            this.updateGoalsGrid();
            this.populateGoalDropdown();
        }
    }

    updatePortfolioSummary() {
        const totalInvested = this.calculateTotalInvested();
        const equityAmount = this.calculateEquityAmount();
        const debtAmount = this.calculateDebtAmount();
        
        const equityPercentage = totalInvested > 0 ? (equityAmount / totalInvested * 100).toFixed(1) : 0;
        const debtPercentage = totalInvested > 0 ? (debtAmount / totalInvested * 100).toFixed(1) : 0;

        this.updateElement('totalInvested', this.formatCurrency(totalInvested));
        this.updateElement('equityAllocation', this.formatCurrency(equityAmount));
        this.updateElement('equityPercentage', `${equityPercentage}%`);
        this.updateElement('debtAllocation', this.formatCurrency(debtAmount));
        this.updateElement('debtPercentage', `${debtPercentage}%`);
    }

    updateElement(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }

    updateInvestmentTable() {
        const tbody = document.getElementById('investmentsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        const goalFilter = document.getElementById('goalFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        const goalFilterValue = goalFilter ? goalFilter.value : '';
        const typeFilterValue = typeFilter ? typeFilter.value : '';

        let filteredInvestments = this.data.investments.filter(investment => {
            const goalMatch = !goalFilterValue || investment.goalId === goalFilterValue;
            const typeMatch = !typeFilterValue || investment.type === typeFilterValue;
            return goalMatch && typeMatch;
        });

        filteredInvestments.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredInvestments.forEach(investment => {
            const row = document.createElement('tr');
            const goal = this.data.goals.find(g => g.id === investment.goalId);
            const amountInINR = investment.currency === 'EUR' ? 
                investment.amount * this.data.exchangeRate : 
                investment.amount;

            row.innerHTML = `
                <td>${new Date(investment.date).toLocaleDateString()}</td>
                <td>
                    ${this.formatAmount(investment.amount, investment.currency)}
                    ${investment.currency === 'EUR' ? `<span class="currency-badge">₹${amountInINR.toLocaleString('en-IN')}</span>` : ''}
                </td>
                <td><span class="status-badge status-badge--${investment.type.toLowerCase()}">${investment.type}</span></td>
                <td>${investment.fundName}</td>
                <td>${goal ? goal.name : 'Unknown'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn--sm btn--outline" onclick="investmentTracker.openInvestmentModal('${investment.id}')">Edit</button>
                        <button class="btn btn--sm btn--danger" onclick="investmentTracker.deleteInvestment('${investment.id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        if (filteredInvestments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div>
                            <h3>No investments found</h3>
                            <p>Add your first investment to get started!</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    updateGoalsGrid() {
        const grid = document.getElementById('goalsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';

        if (this.data.goals.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No goals yet</h3>
                    <p>Create your first investment goal to start tracking your progress!</p>
                    <button class="btn btn--primary" onclick="investmentTracker.openGoalModal()">Add Your First Goal</button>
                </div>
            `;
            return;
        }

        this.data.goals.forEach(goal => {
            const goalInvestments = this.data.investments.filter(inv => inv.goalId === goal.id);
            const totalInvested = goalInvestments.reduce((sum, inv) => {
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                return sum + amount;
            }, 0);
            
            const equityAmount = goalInvestments
                .filter(inv => inv.type === 'Equity')
                .reduce((sum, inv) => {
                    const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                    return sum + amount;
                }, 0);
            
            const debtAmount = goalInvestments
                .filter(inv => inv.type === 'Debt')
                .reduce((sum, inv) => {
                    const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                    return sum + amount;
                }, 0);

            const progress = Math.min((totalInvested / goal.target) * 100, 100);

            const goalCard = document.createElement('div');
            goalCard.className = 'card goal-card fade-in';
            goalCard.innerHTML = `
                <div class="card__body">
                    <div class="goal-card__header">
                        <h3 class="goal-card__title">${goal.name}</h3>
                        <div class="goal-card__actions">
                            <button onclick="investmentTracker.openGoalModal('${goal.id}')" title="Edit Goal">✎</button>
                            <button onclick="investmentTracker.deleteGoal('${goal.id}')" title="Delete Goal">✕</button>
                        </div>
                    </div>
                    <div class="goal-card__description">${goal.description}</div>
                    <div class="goal-card__stats">
                        <div class="goal-stat">
                            <div class="goal-stat__label">Invested</div>
                            <div class="goal-stat__value">${this.formatCurrency(totalInvested)}</div>
                        </div>
                        <div class="goal-stat">
                            <div class="goal-stat__label">Target</div>
                            <div class="goal-stat__value">${this.formatCurrency(goal.target)}</div>
                        </div>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-progress__label">
                            <span>Progress</span>
                            <span>${progress.toFixed(1)}%</span>
                        </div>
                        <div class="goal-progress__bar">
                            <div class="goal-progress__fill" style="width: ${progress}%; background-color: ${goal.color}"></div>
                        </div>
                    </div>
                    <div class="goal-allocation">
                        <div class="allocation-item">
                            <div class="allocation-item__label">Equity</div>
                            <div class="allocation-item__value">${this.formatCurrency(equityAmount)}</div>
                        </div>
                        <div class="allocation-item">
                            <div class="allocation-item__label">Debt</div>
                            <div class="allocation-item__value">${this.formatCurrency(debtAmount)}</div>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(goalCard);
        });
    }

    updateOverviewCharts() {
        this.updateAllocationChart();
        this.updateGoalChart();
    }

    updateAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;

        const equityAmount = this.calculateEquityAmount();
        const debtAmount = this.calculateDebtAmount();

        if (this.charts.allocation) {
            this.charts.allocation.destroy();
        }

        this.charts.allocation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Equity', 'Debt'],
                datasets: [{
                    data: [equityAmount, debtAmount],
                    backgroundColor: ['#1FB8CD', '#FFC185'],
                    borderWidth: 0
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

    updateGoalChart() {
        const ctx = document.getElementById('goalChart');
        if (!ctx) return;

        const goalData = this.data.goals.map(goal => {
            const goalInvestments = this.data.investments.filter(inv => inv.goalId === goal.id);
            const totalInvested = goalInvestments.reduce((sum, inv) => {
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                return sum + amount;
            }, 0);
            return { name: goal.name, amount: totalInvested, color: goal.color };
        });

        if (this.charts.goal) {
            this.charts.goal.destroy();
        }

        this.charts.goal = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: goalData.map(g => g.name),
                datasets: [{
                    data: goalData.map(g => g.amount),
                    backgroundColor: goalData.map(g => g.color),
                    borderWidth: 0
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

    updateTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        const monthlyData = {};
        this.data.investments.forEach(investment => {
            const date = new Date(investment.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = investment.currency === 'EUR' ? investment.amount * this.data.exchangeRate : investment.amount;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { equity: 0, debt: 0 };
            }
            
            monthlyData[monthKey][investment.type.toLowerCase()] += amount;
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const equityData = sortedMonths.map(month => monthlyData[month].equity);
        const debtData = sortedMonths.map(month => monthlyData[month].debt);

        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [
                    {
                        label: 'Equity',
                        data: equityData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Debt',
                        data: debtData,
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        });
    }

    updateGoalAllocationAnalytics() {
        this.updateGoalAllocationCards();
        this.updateGoalAllocationTable();
    }

    updateGoalAllocationCards() {
        const container = document.getElementById('goalAllocationCards');
        if (!container) return;

        container.innerHTML = '';

        if (this.data.goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No goals found</h3>
                    <p>Create some investment goals to see their allocation analysis.</p>
                </div>
            `;
            return;
        }

        this.data.goals.forEach((goal, index) => {
            const goalInvestments = this.data.investments.filter(inv => inv.goalId === goal.id);
            const totalInvested = goalInvestments.reduce((sum, inv) => {
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                return sum + amount;
            }, 0);
            
            const equityAmount = goalInvestments
                .filter(inv => inv.type === 'Equity')
                .reduce((sum, inv) => {
                    const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                    return sum + amount;
                }, 0);
            
            const debtAmount = goalInvestments
                .filter(inv => inv.type === 'Debt')
                .reduce((sum, inv) => {
                    const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                    return sum + amount;
                }, 0);

            const equityPercentage = totalInvested > 0 ? (equityAmount / totalInvested * 100).toFixed(2) : 0;
            const debtPercentage = totalInvested > 0 ? (debtAmount / totalInvested * 100).toFixed(2) : 0;

            const card = document.createElement('div');
            card.className = 'goal-allocation-card';
            card.innerHTML = `
                <div class="goal-allocation-card__header">
                    <h4 class="goal-allocation-card__title">${goal.name}</h4>
                    <p class="goal-allocation-card__total">Total: ${this.formatCurrency(totalInvested)}</p>
                </div>
                <div class="goal-allocation-card__body">
                    <div class="goal-allocation-card__chart">
                        <canvas id="goalChart${index}"></canvas>
                    </div>
                    <div class="goal-allocation-card__breakdown">
                        <div class="allocation-breakdown-item">
                            <div class="allocation-breakdown-item__label">
                                <div class="allocation-breakdown-item__color" style="background-color: #1FB8CD;"></div>
                                Equity
                            </div>
                            <div class="allocation-breakdown-item__amount">${this.formatCurrency(equityAmount)}</div>
                            <div class="allocation-breakdown-item__percentage">${equityPercentage}%</div>
                        </div>
                        <div class="allocation-breakdown-item">
                            <div class="allocation-breakdown-item__label">
                                <div class="allocation-breakdown-item__color" style="background-color: #B4413C;"></div>
                                Debt
                            </div>
                            <div class="allocation-breakdown-item__amount">${this.formatCurrency(debtAmount)}</div>
                            <div class="allocation-breakdown-item__percentage">${debtPercentage}%</div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);

            // Create individual pie chart for this goal
            setTimeout(() => {
                const ctx = document.getElementById(`goalChart${index}`);
                if (ctx && (equityAmount > 0 || debtAmount > 0)) {
                    if (this.goalCharts[`goal${index}`]) {
                        this.goalCharts[`goal${index}`].destroy();
                    }

                    this.goalCharts[`goal${index}`] = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Equity', 'Debt'],
                            datasets: [{
                                data: [equityAmount, debtAmount],
                                backgroundColor: ['#1FB8CD', '#B4413C'],
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }
                    });
                }
            }, 100);
        });
    }

    updateGoalAllocationTable() {
        const tbody = document.getElementById('goalAllocationTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.data.goals.forEach(goal => {
            const goalInvestments = this.data.investments.filter(inv => inv.goalId === goal.id);
            const totalInvested = goalInvestments.reduce((sum, inv) => {
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                return sum + amount;
            }, 0);
            
            const equityAmount = goalInvestments
                .filter(inv => inv.type === 'Equity')
                .reduce((sum, inv) => {
                    const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                    return sum + amount;
                }, 0);
            
            const debtAmount = goalInvestments
                .filter(inv => inv.type === 'Debt')
                .reduce((sum, inv) => {
                    const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                    return sum + amount;
                }, 0);

            const equityPercentage = totalInvested > 0 ? (equityAmount / totalInvested * 100).toFixed(2) : '0.00';
            const debtPercentage = totalInvested > 0 ? (debtAmount / totalInvested * 100).toFixed(2) : '0.00';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${goal.name}</strong></td>
                <td>${this.formatCurrency(totalInvested)}</td>
                <td>${this.formatCurrency(equityAmount)}</td>
                <td><strong>${equityPercentage}%</strong></td>
                <td>${this.formatCurrency(debtAmount)}</td>
                <td><strong>${debtPercentage}%</strong></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateFundDistributionAnalytics() {
        this.updateFundDistributionCards();
        this.updateFundDistributionTable();
    }

    updateFundDistributionCards() {
        const container = document.getElementById('fundDistributionCards');
        if (!container) return;

        container.innerHTML = '';

        // Get unique funds
        const fundsMap = new Map();
        this.data.investments.forEach(inv => {
            const key = `${inv.fundName}_${inv.type}`;
            if (!fundsMap.has(key)) {
                fundsMap.set(key, {
                    name: inv.fundName,
                    type: inv.type,
                    investments: []
                });
            }
            fundsMap.get(key).investments.push(inv);
        });

        const funds = Array.from(fundsMap.values());

        // Filter funds based on current filter
        let filteredFunds = funds;
        if (this.currentFundFilter === 'equity') {
            filteredFunds = funds.filter(fund => fund.type === 'Equity');
        } else if (this.currentFundFilter === 'debt') {
            filteredFunds = funds.filter(fund => fund.type === 'Debt');
        }

        if (filteredFunds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No funds found</h3>
                    <p>Add some investments to see fund distribution analysis.</p>
                </div>
            `;
            return;
        }

        filteredFunds.forEach(fund => {
            const totalAmount = fund.investments.reduce((sum, inv) => {
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                return sum + amount;
            }, 0);

            // Group by goals
            const goalDistribution = {};
            fund.investments.forEach(inv => {
                const goal = this.data.goals.find(g => g.id === inv.goalId);
                const goalName = goal ? goal.name : 'Unknown Goal';
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                
                if (!goalDistribution[goalName]) {
                    goalDistribution[goalName] = { 
                        amount: 0, 
                        color: goal ? goal.color : '#cccccc' 
                    };
                }
                goalDistribution[goalName].amount += amount;
            });

            const card = document.createElement('div');
            card.className = 'fund-distribution-card';
            
            let barSegments = '';
            let legendItems = '';
            
            Object.entries(goalDistribution).forEach(([goalName, data]) => {
                const percentage = (data.amount / totalAmount * 100);
                const percentageText = percentage > 15 ? `${percentage.toFixed(1)}%` : '';
                
                barSegments += `
                    <div class="fund-distribution-bar__segment" 
                         style="width: ${percentage}%; background-color: ${data.color}"
                         title="${goalName}: ${this.formatCurrency(data.amount)} (${percentage.toFixed(2)}%)">
                        ${percentageText}
                    </div>
                `;
                
                legendItems += `
                    <div class="fund-distribution-legend-item">
                        <div class="fund-distribution-legend-item__color" style="background-color: ${data.color}"></div>
                        <span class="fund-distribution-legend-item__text">${goalName}: ${percentage.toFixed(2)}%</span>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="fund-distribution-card__header">
                    <h4 class="fund-distribution-card__title">${fund.name}</h4>
                    <div class="fund-distribution-card__meta">
                        <span class="fund-distribution-card__type fund-distribution-card__type--${fund.type.toLowerCase()}">${fund.type}</span>
                        <span class="fund-distribution-card__total">${this.formatCurrency(totalAmount)}</span>
                    </div>
                </div>
                <div class="fund-distribution-card__body">
                    <div class="fund-distribution-bar">
                        <div class="fund-distribution-bar__container">
                            ${barSegments}
                        </div>
                    </div>
                    <div class="fund-distribution-legend">
                        ${legendItems}
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    updateFundDistributionTable() {
        const tbody = document.getElementById('fundDistributionTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Get unique funds
        const fundsMap = new Map();
        this.data.investments.forEach(inv => {
            const key = `${inv.fundName}_${inv.type}`;
            if (!fundsMap.has(key)) {
                fundsMap.set(key, {
                    name: inv.fundName,
                    type: inv.type,
                    investments: []
                });
            }
            fundsMap.get(key).investments.push(inv);
        });

        const funds = Array.from(fundsMap.values());

        funds.forEach(fund => {
            const totalAmount = fund.investments.reduce((sum, inv) => {
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                return sum + amount;
            }, 0);

            // Group by goals
            const goalDistribution = {};
            fund.investments.forEach(inv => {
                const goal = this.data.goals.find(g => g.id === inv.goalId);
                const goalName = goal ? goal.name : 'Unknown Goal';
                const amount = inv.currency === 'EUR' ? inv.amount * this.data.exchangeRate : inv.amount;
                
                if (!goalDistribution[goalName]) {
                    goalDistribution[goalName] = 0;
                }
                goalDistribution[goalName] += amount;
            });

            const goalTags = Object.entries(goalDistribution)
                .map(([goalName, amount]) => {
                    const percentage = (amount / totalAmount * 100).toFixed(2);
                    return `<span class="goal-distribution-tag">${goalName}: ${percentage}%</span>`;
                })
                .join('');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${fund.name}</strong></td>
                <td><span class="status-badge status-badge--${fund.type.toLowerCase()}">${fund.type}</span></td>
                <td>${this.formatCurrency(totalAmount)}</td>
                <td><div class="goal-distribution-cell">${goalTags}</div></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateSettingsForm() {
        const exchangeRateInput = document.getElementById('exchangeRateInput');
        if (exchangeRateInput) {
            exchangeRateInput.value = this.data.exchangeRate;
        }
    }

    updateExchangeRate() {
        const input = document.getElementById('exchangeRateInput');
        if (!input) return;
        
        const newRate = parseFloat(input.value);
        if (newRate && newRate > 0) {
            this.data.exchangeRate = newRate;
            this.saveData();
            this.updateCurrencyRate();
            this.updateCurrencyConversion();
            this.showNotification('Exchange rate updated successfully!', 'success');
        } else {
            this.showNotification('Please enter a valid exchange rate!', 'error');
        }
    }

    exportData() {
        const dataToExport = {
            investments: this.data.investments,
            goals: this.data.goals,
            exchangeRate: this.data.exchangeRate,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `investment-tracker-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('Data exported successfully!', 'success');
    }

    importData() {
        const input = document.getElementById('importFileInput');
        if (input) input.click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.investments || !importedData.goals) {
                    throw new Error('Invalid file format');
                }

                if (confirm('This will replace all existing data. Continue?')) {
                    this.data.investments = importedData.investments || [];
                    this.data.goals = importedData.goals || [];
                    this.data.exchangeRate = importedData.exchangeRate || 103.33;
                    
                    this.saveData();
                    this.showNotification('Data imported successfully!', 'success');
                    this.updatePortfolioSummary();
                    this.updateInvestmentTable();
                    this.updateGoalsGrid();
                    this.populateGoalDropdown();
                    this.updateCurrencyRate();
                }
            } catch (error) {
                this.showNotification('Invalid file format!', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('This will delete all your data. This action cannot be undone. Continue?')) {
            this.data = {
                investments: [],
                goals: [],
                exchangeRate: 103.33,
                settings: { theme: 'auto' }
            };
            this.saveData();
            this.showNotification('All data cleared!', 'success');
            this.updatePortfolioSummary();
            this.updateInvestmentTable();
            this.updateGoalsGrid();
            this.populateGoalDropdown();
        }
    }

    loadSampleData() {
        const sampleGoals = [
            {
                "id": "goal-1", "name": "Emergency Fund", "target": 500000,
                "description": "6 months of expenses as safety net", "color": "#32a852", "created": "2024-01-15"
            },
            {
                "id": "goal-2", "name": "House Down Payment", "target": 2000000,
                "description": "Save for dream home down payment", "color": "#2563eb", "created": "2024-02-01"
            },
            {
                "id": "goal-3", "name": "Retirement Planning", "target": 10000000,
                "description": "Long-term retirement corpus", "color": "#7c3aed", "created": "2024-01-01"
            }
        ];

        const sampleInvestments = [
            {
                "id": "inv-1", "date": "2024-08-15", "amount": 25000, "currency": "INR", "type": "Equity",
                "fundName": "HDFC Top 100 Fund", "goalId": "goal-2", "notes": "Monthly SIP"
            },
            {
                "id": "inv-2", "date": "2024-08-15", "amount": 15000, "currency": "INR", "type": "Debt",
                "fundName": "ICICI Prudential Corporate Bond Fund", "goalId": "goal-1", "notes": "Conservative allocation"
            },
            {
                "id": "inv-3", "date": "2024-07-20", "amount": 500, "currency": "EUR", "type": "Equity",
                "fundName": "Axis Bluechip Fund", "goalId": "goal-3", "notes": "Euro investment from salary"
            },
            {
                "id": "inv-4", "date": "2024-07-10", "amount": 30000, "currency": "INR", "type": "Equity",
                "fundName": "SBI Small Cap Fund", "goalId": "goal-3", "notes": "High growth potential"
            },
            {
                "id": "inv-5", "date": "2024-06-25", "amount": 20000, "currency": "INR", "type": "Debt",
                "fundName": "Aditya Birla Sun Life Medium Term Plan", "goalId": "goal-1", "notes": "Debt diversification"
            },
            {
                "id": "inv-6", "date": "2024-08-01", "amount": 35000, "currency": "INR", "type": "Equity",
                "fundName": "HDFC Top 100 Fund", "goalId": "goal-1", "notes": "Monthly SIP"
            },
            {
                "id": "inv-7", "date": "2024-07-15", "amount": 18000, "currency": "INR", "type": "Debt",
                "fundName": "ICICI Prudential Corporate Bond Fund", "goalId": "goal-2", "notes": "Conservative allocation"
            }
        ];

        this.data.goals = sampleGoals;
        this.data.investments = sampleInvestments;
        this.saveData();
        
        this.showNotification('Sample data loaded successfully!', 'success');
        this.updatePortfolioSummary();
        this.updateInvestmentTable();
        this.updateGoalsGrid();
        this.populateGoalDropdown();
    }

    loadSampleDataIfEmpty() {
        if (this.data.investments.length === 0 && this.data.goals.length === 0) {
            this.loadSampleData();
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
        
        this.data.settings.theme = newTheme;
        this.saveData();
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notificationMessage');
        
        if (!notification || !messageEl) return;
        
        messageEl.textContent = message;
        notification.className = `notification notification--${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => this.hideNotification(), 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) notification.classList.add('hidden');
    }

    calculateTotalInvested() {
        return this.data.investments.reduce((total, investment) => {
            const amount = investment.currency === 'EUR' ? 
                investment.amount * this.data.exchangeRate : investment.amount;
            return total + amount;
        }, 0);
    }

    calculateEquityAmount() {
        return this.data.investments
            .filter(inv => inv.type === 'Equity')
            .reduce((total, investment) => {
                const amount = investment.currency === 'EUR' ? 
                    investment.amount * this.data.exchangeRate : investment.amount;
                return total + amount;
            }, 0);
    }

    calculateDebtAmount() {
        return this.data.investments
            .filter(inv => inv.type === 'Debt')
            .reduce((total, investment) => {
                const amount = investment.currency === 'EUR' ? 
                    investment.amount * this.data.exchangeRate : investment.amount;
                return total + amount;
            }, 0);
    }

    formatCurrency(amount) {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    formatAmount(amount, currency) {
        if (currency === 'EUR') {
            return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        } else {
            return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
        }
    }

    saveData() {
        try {
            localStorage.setItem('investmentTrackerData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem('investmentTrackerData');
            if (savedData) {
                this.data = { ...this.data, ...JSON.parse(savedData) };
                
                if (this.data.settings.theme && this.data.settings.theme !== 'auto') {
                    document.documentElement.setAttribute('data-color-scheme', this.data.settings.theme);
                    setTimeout(() => {
                        const themeIcon = document.getElementById('themeIcon');
                        if (themeIcon) {
                            themeIcon.textContent = this.data.settings.theme === 'dark' ? '☀️' : '🌙';
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Investment Tracker...');
    investmentTracker = new InvestmentTracker();
});