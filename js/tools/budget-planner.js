/**
 * DailyMate - Budget Planner & Personal Finance Suite
 */
const BudgetPlanner = (function () {
    const STORAGE_KEY = 'dailymate_budget_v1';
    const CURRENCY_KEY = 'dailymate_currency_symbol';

    const CATEGORY_COLORS = {
        housing: '#3b82f6',
        food: '#10b981',
        utilities: '#f59e0b',
        health: '#06b6d4',
        transport: '#8b5cf6',
        dining: '#ec4899',
        entertainment: '#f43f5e',
        shopping: '#a855f7',
        savings: '#10b981',
        debt: '#ef4444',
        salary: '#059669',
        freelance: '#14b8a6',
        other: '#64748b'
    };

    const DEFAULT_DATA = [
        { id: 't_1', title: 'Primary Salary', amount: 4200, type: 'income', category: 'salary', bucket: 'income', date: '2026-11-01', note: 'Monthly paycheck' },
        { id: 't_2', title: 'Freelance Design', amount: 850, type: 'income', category: 'freelance', bucket: 'income', date: '2026-11-05', note: 'Client project' },
        { id: 't_3', title: 'Apartment Rent', amount: 1400, type: 'expense', category: 'housing', bucket: 'needs', date: '2026-11-01', note: 'Rent payment' },
        { id: 't_4', title: 'Supermarket Groceries', amount: 450, type: 'expense', category: 'food', bucket: 'needs', date: '2026-11-03', note: 'Weekly groceries' },
        { id: 't_5', title: 'Electric & High-Speed WiFi', amount: 180, type: 'expense', category: 'utilities', bucket: 'needs', date: '2026-11-04', note: 'Power & broadband' },
        { id: 't_6', title: 'Health & Dental Insurance', amount: 220, type: 'expense', category: 'health', bucket: 'needs', date: '2026-11-06', note: 'Monthly premium' },
        { id: 't_7', title: 'Metro Transit Card', amount: 110, type: 'expense', category: 'transport', bucket: 'needs', date: '2026-11-02', note: 'Commute' },
        { id: 't_8', title: 'Dining Out & Coffee', amount: 280, type: 'expense', category: 'dining', bucket: 'wants', date: '2026-11-08', note: 'Restaurants & cafes' },
        { id: 't_9', title: 'Streaming Subscriptions', amount: 55, type: 'expense', category: 'entertainment', bucket: 'wants', date: '2026-11-10', note: 'Netflix & Spotify' },
        { id: 't_10', title: 'Clothing & Tech Gadget', amount: 160, type: 'expense', category: 'shopping', bucket: 'wants', date: '2026-11-12', note: 'Weekend shopping' },
        { id: 't_11', title: 'Index Funds & Roth IRA', amount: 800, type: 'expense', category: 'savings', bucket: 'savings', date: '2026-11-15', note: 'Automated investment' },
        { id: 't_12', title: 'Student Loan Payment', amount: 300, type: 'expense', category: 'debt', bucket: 'savings', date: '2026-11-16', note: 'Principal paydown' }
    ];

    let transactions = [];
    let currencySymbol = '$';
    let activeFilter = 'all';

    function init() {
        loadData();
        bindEvents();
        renderAll();
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                transactions = JSON.parse(raw);
            } else {
                transactions = JSON.parse(JSON.stringify(DEFAULT_DATA));
                saveData();
            }
        } catch (e) {
            transactions = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }

        currencySymbol = localStorage.getItem(CURRENCY_KEY) || '$';
        const curSelect = document.getElementById('budget-currency-select');
        if (curSelect) curSelect.value = currencySymbol;
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        } catch (e) {
            console.error("Failed to save budget to localStorage", e);
        }
    }

    function bindEvents() {
        // Currency change
        const curSelect = document.getElementById('budget-currency-select');
        if (curSelect) {
            curSelect.addEventListener('change', (e) => {
                currencySymbol = e.target.value;
                localStorage.setItem(CURRENCY_KEY, currencySymbol);
                renderAll();
                App.showToast(`Currency updated to ${currencySymbol}`, "info");
            });
        }

        // Add transaction form
        const form = document.getElementById('budget-add-form');
        if (form) {
            form.addEventListener('submit', handleAddTransaction);
        }

        // Type toggle in form (income vs expense changes category list)
        const typeSelect = document.getElementById('budget-trans-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', updateFormCategories);
        }

        // Filter tabs (All, Incomes, Expenses)
        document.querySelectorAll('.budget-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.budget-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                renderTransactionTable();
            });
        });

        // Search transactions
        const searchInput = document.getElementById('budget-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', renderTransactionTable);
        }

        // Export CSV button
        const csvBtn = document.getElementById('budget-export-csv');
        if (csvBtn) {
            csvBtn.addEventListener('click', exportCSV);
        }

        // Reset demo data button
        const resetBtn = document.getElementById('budget-reset-demo');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetToDemo);
        }

        // Print/Save Report button
        const printBtn = document.getElementById('budget-print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', printReport);
        }
    }

    function updateFormCategories() {
        const type = document.getElementById('budget-trans-type')?.value || 'expense';
        const catSelect = document.getElementById('budget-trans-category');
        const bucketSelect = document.getElementById('budget-trans-bucket');
        if (!catSelect) return;

        if (type === 'income') {
            catSelect.innerHTML = `
                <option value="salary">Salary / Wages</option>
                <option value="freelance">Freelance / Contract</option>
                <option value="investments">Investment / Dividends</option>
                <option value="other">Other Income</option>
            `;
            if (bucketSelect) bucketSelect.value = 'income';
        } else {
            catSelect.innerHTML = `
                <option value="housing">Housing / Rent</option>
                <option value="food">Groceries & Food</option>
                <option value="utilities">Utilities & Bills</option>
                <option value="transport">Transportation</option>
                <option value="health">Health & Fitness</option>
                <option value="dining">Dining & Cafes</option>
                <option value="entertainment">Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="savings">Savings & Investments</option>
                <option value="debt">Debt Payoff</option>
                <option value="other">Other Expense</option>
            `;
            if (bucketSelect) bucketSelect.value = 'needs';
        }
    }

    function handleAddTransaction(e) {
        e.preventDefault();
        const title = document.getElementById('budget-trans-title').value.trim();
        const amount = parseFloat(document.getElementById('budget-trans-amount').value);
        const type = document.getElementById('budget-trans-type').value;
        const category = document.getElementById('budget-trans-category').value;
        const bucket = document.getElementById('budget-trans-bucket').value;
        const date = document.getElementById('budget-trans-date').value || new Date().toISOString().split('T')[0];
        const note = document.getElementById('budget-trans-note').value.trim();

        if (!title || isNaN(amount) || amount <= 0) {
            App.showToast("Please provide a title and valid amount", "error");
            return;
        }

        const newTrans = {
            id: 't_' + Date.now(),
            title,
            amount,
            type,
            category,
            bucket,
            date,
            note
        };

        transactions.unshift(newTrans);
        saveData();
        renderAll();

        // Reset form
        document.getElementById('budget-trans-title').value = '';
        document.getElementById('budget-trans-amount').value = '';
        document.getElementById('budget-trans-note').value = '';

        App.showToast(`Added "${title}" (${currencySymbol}${amount.toFixed(2)})!`, "success");
    }

    function deleteTransaction(id) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderAll();
        App.showToast("Transaction removed", "info");
    }

    function renderAll() {
        renderMetrics();
        render503020Rule();
        renderDonutChart();
        renderBarChart();
        renderTransactionTable();
    }

    function getSummary() {
        let totalIncome = 0;
        let totalExpenses = 0;
        let needs = 0;
        let wants = 0;
        let savings = 0;
        const categoryTotals = {};

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpenses += t.amount;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;

                if (t.bucket === 'needs') needs += t.amount;
                else if (t.bucket === 'wants') wants += t.amount;
                else if (t.bucket === 'savings') savings += t.amount;
            }
        });

        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        return {
            totalIncome,
            totalExpenses,
            netSavings,
            savingsRate,
            needs,
            wants,
            savings,
            categoryTotals
        };
    }

    function renderMetrics() {
        const s = getSummary();

        const incEl = document.getElementById('budget-total-income');
        const expEl = document.getElementById('budget-total-expenses');
        const netEl = document.getElementById('budget-net-savings');
        const rateEl = document.getElementById('budget-savings-rate');

        if (incEl) incEl.textContent = `${currencySymbol}${s.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (expEl) expEl.textContent = `${currencySymbol}${s.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (netEl) {
            netEl.textContent = `${s.netSavings >= 0 ? '+' : ''}${currencySymbol}${s.netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            netEl.className = s.netSavings >= 0 ? 'metric-val text-success' : 'metric-val text-danger';
        }

        if (rateEl) {
            rateEl.textContent = `${s.savingsRate.toFixed(1)}%`;
            rateEl.className = s.savingsRate >= 20 ? 'metric-badge badge-success' : s.savingsRate >= 10 ? 'metric-badge badge-warning' : 'metric-badge badge-danger';
        }
    }

    function render503020Rule() {
        const s = getSummary();
        const base = s.totalIncome > 0 ? s.totalIncome : 1;

        const needsPct = Math.round((s.needs / base) * 100);
        const wantsPct = Math.round((s.wants / base) * 100);
        const savingsPct = Math.round((s.savings / base) * 100);

        // Update Needs bar
        const needsBar = document.getElementById('rule-needs-bar');
        const needsVal = document.getElementById('rule-needs-val');
        if (needsBar) needsBar.style.width = `${Math.min(needsPct, 100)}%`;
        if (needsVal) needsVal.textContent = `${currencySymbol}${s.needs.toFixed(0)} (${needsPct}% / Target 50%)`;

        // Update Wants bar
        const wantsBar = document.getElementById('rule-wants-bar');
        const wantsVal = document.getElementById('rule-wants-val');
        if (wantsBar) wantsBar.style.width = `${Math.min(wantsPct, 100)}%`;
        if (wantsVal) wantsVal.textContent = `${currencySymbol}${s.wants.toFixed(0)} (${wantsPct}% / Target 30%)`;

        // Update Savings bar
        const savingsBar = document.getElementById('rule-savings-bar');
        const savingsVal = document.getElementById('rule-savings-val');
        if (savingsBar) savingsBar.style.width = `${Math.min(savingsPct, 100)}%`;
        if (savingsVal) savingsVal.textContent = `${currencySymbol}${s.savings.toFixed(0)} (${savingsPct}% / Target 20%)`;

        // Health score verdict
        const healthEl = document.getElementById('rule-health-verdict');
        if (healthEl) {
            if (s.netSavings < 0) {
                healthEl.innerHTML = `<span class="badge badge-danger">⚠️ Negative Cashflow</span> - Expenses exceed income by ${currencySymbol}${Math.abs(s.netSavings).toFixed(2)}. Trim discretionary wants.`;
            } else if (savingsPct >= 20 && needsPct <= 50) {
                healthEl.innerHTML = `<span class="badge badge-success">★ Grade A Financial Health</span> - Exceptional! Meets or beats the 50/30/20 benchmark with strong wealth accumulation.`;
            } else if (savingsPct >= 10) {
                healthEl.innerHTML = `<span class="badge badge-warning">● Good Progress</span> - Positive cashflow with steady savings. Consider shifting 5-10% from wants into emergency funds.`;
            } else {
                healthEl.innerHTML = `<span class="badge badge-warning">● Caution</span> - Low savings rate (<10%). Look at housing and subscription costs.`;
            }
        }
    }

    function renderDonutChart() {
        const svg = document.getElementById('budget-donut-svg');
        const legend = document.getElementById('budget-donut-legend');
        if (!svg || !legend) return;

        const s = getSummary();
        const totalExp = s.totalExpenses;

        if (totalExp === 0) {
            svg.innerHTML = `<text x="100" y="105" text-anchor="middle" fill="#94a3b8" font-size="12">No Expenses Recorded</text>`;
            legend.innerHTML = '';
            return;
        }

        const radius = 70;
        const cx = 100;
        const cy = 100;
        const strokeWidth = 28;
        const circumference = 2 * Math.PI * radius;

        let accumulatedAngle = -90; // Start at top
        let svgPaths = '';
        let legendHtml = '';

        const categories = Object.keys(s.categoryTotals).sort((a, b) => s.categoryTotals[b] - s.categoryTotals[a]);

        categories.forEach(cat => {
            const amount = s.categoryTotals[cat];
            const pct = amount / totalExp;
            const sliceAngle = pct * 360;
            const color = CATEGORY_COLORS[cat] || '#64748b';

            // SVG arc calculation
            const strokeDash = `${(pct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
            const strokeOffset = (-((accumulatedAngle + 90) / 360) * circumference).toFixed(2);

            svgPaths += `
                <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
                    stroke-dasharray="${strokeDash}" stroke-dashoffset="${strokeOffset}" class="donut-slice"
                    data-cat="${cat}" data-amount="${amount.toFixed(2)}" data-pct="${(pct * 100).toFixed(1)}">
                    <title>${capitalize(cat)}: ${currencySymbol}${amount.toFixed(2)} (${(pct * 100).toFixed(1)}%)</title>
                </circle>
            `;

            accumulatedAngle += sliceAngle;

            legendHtml += `
                <div class="legend-item">
                    <span class="legend-color-dot" style="background-color: ${color}"></span>
                    <span class="legend-label">${capitalize(cat)}</span>
                    <span class="legend-val">${currencySymbol}${amount.toFixed(0)} <small>(${Math.round(pct * 100)}%)</small></span>
                </div>
            `;
        });

        // Center cutout text
        svgPaths += `
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="currentColor" font-weight="700" font-size="14">${currencySymbol}${totalExp.toFixed(0)}</text>
            <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="#94a3b8" font-size="9">Total Spent</text>
        `;

        svg.innerHTML = svgPaths;
        legend.innerHTML = legendHtml;
    }

    function renderBarChart() {
        const barContainer = document.getElementById('budget-bar-chart');
        if (!barContainer) return;

        const s = getSummary();
        const maxVal = Math.max(s.totalIncome, s.totalExpenses, 100);

        const incH = Math.min(100, Math.round((s.totalIncome / maxVal) * 100));
        const expH = Math.min(100, Math.round((s.totalExpenses / maxVal) * 100));
        const savH = Math.max(0, Math.min(100, Math.round((Math.max(0, s.netSavings) / maxVal) * 100)));

        barContainer.innerHTML = `
            <div class="bar-col">
                <div class="bar-wrapper">
                    <div class="bar-fill bar-income" style="height: ${incH}%;">
                        <span class="bar-tooltip">${currencySymbol}${s.totalIncome.toFixed(0)}</span>
                    </div>
                </div>
                <span class="bar-label">Income</span>
            </div>
            <div class="bar-col">
                <div class="bar-wrapper">
                    <div class="bar-fill bar-expense" style="height: ${expH}%;">
                        <span class="bar-tooltip">${currencySymbol}${s.totalExpenses.toFixed(0)}</span>
                    </div>
                </div>
                <span class="bar-label">Expenses</span>
            </div>
            <div class="bar-col">
                <div class="bar-wrapper">
                    <div class="bar-fill bar-savings" style="height: ${savH}%;">
                        <span class="bar-tooltip">${currencySymbol}${Math.max(0, s.netSavings).toFixed(0)}</span>
                    </div>
                </div>
                <span class="bar-label">Surplus</span>
            </div>
        `;
    }

    function renderTransactionTable() {
        const tbody = document.getElementById('budget-table-body');
        const searchVal = document.getElementById('budget-search-input')?.value.toLowerCase().trim() || '';
        if (!tbody) return;

        let filtered = transactions;

        if (activeFilter === 'income') {
            filtered = filtered.filter(t => t.type === 'income');
        } else if (activeFilter === 'expense') {
            filtered = filtered.filter(t => t.type === 'expense');
        }

        if (searchVal) {
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(searchVal) ||
                t.category.toLowerCase().includes(searchVal) ||
                (t.note && t.note.toLowerCase().includes(searchVal))
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No matching transactions found.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(t => {
            const isInc = t.type === 'income';
            const sign = isInc ? '+' : '-';
            const badgeClass = isInc ? 'badge-success' : 'badge-neutral';
            const catColor = CATEGORY_COLORS[t.category] || '#64748b';

            return `
                <tr>
                    <td class="text-muted text-sm">${t.date || '—'}</td>
                    <td>
                        <div class="font-medium">${escapeHtml(t.title)}</div>
                        ${t.note ? `<div class="text-xs text-muted">${escapeHtml(t.note)}</div>` : ''}
                    </td>
                    <td>
                        <span class="category-pill" style="border-left: 3px solid ${catColor};">
                            ${capitalize(t.category)}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${badgeClass}">${capitalize(t.bucket || t.type)}</span>
                    </td>
                    <td class="font-semibold ${isInc ? 'text-success' : 'text-danger'}">
                        ${sign}${currencySymbol}${t.amount.toFixed(2)}
                    </td>
                    <td class="text-right">
                        <button class="btn-icon btn-danger" onclick="BudgetPlanner.deleteTransaction('${t.id}')" title="Delete">✕</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function exportCSV() {
        if (transactions.length === 0) {
            App.showToast("No transactions to export", "error");
            return;
        }

        let csv = "Date,Title,Type,Category,50/30/20 Bucket,Amount,Notes\n";
        transactions.forEach(t => {
            const row = [
                `"${t.date || ''}"`,
                `"${t.title.replace(/"/g, '""')}"`,
                `"${t.type}"`,
                `"${t.category}"`,
                `"${t.bucket || ''}"`,
                t.amount.toFixed(2),
                `"${(t.note || '').replace(/"/g, '""')}"`
            ];
            csv += row.join(",") + "\n";
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dailymate-budget-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);

        App.showToast("Budget exported to CSV spreadsheet!", "success");
    }

    function printReport() {
        window.print();
    }

    function resetToDemo() {
        if (confirm("Reset budget data back to the starter demo template?")) {
            transactions = JSON.parse(JSON.stringify(DEFAULT_DATA));
            saveData();
            renderAll();
            App.showToast("Reset to starter budget template", "info");
        }
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return {
        init,
        deleteTransaction,
        resetToDemo,
        exportCSV,
        printReport
    };
})();
