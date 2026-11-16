/**
 * DailyMate - Daily Calculators Suite
 * (Loan/EMI, Tip & Split, Age & Date, BMI & Health, Discount & Tax)
 */
const Calculators = (function () {

    function init() {
        bindLoanEvents();
        bindTipEvents();
        bindAgeEvents();
        bindBmiEvents();
        bindDiscountEvents();

        // Calculate initial defaults
        calculateLoan();
        calculateTip();
        calculateAge();
        calculateBmi();
        calculateDiscount();
    }

    // ==========================================
    // 1. LOAN & EMI CALCULATOR
    // ==========================================
    function bindLoanEvents() {
        const inputs = ['loan-amount', 'loan-rate', 'loan-tenure', 'loan-tenure-type'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', calculateLoan);
                el.addEventListener('change', calculateLoan);
            }
        });

        const toggleTableBtn = document.getElementById('loan-toggle-schedule');
        if (toggleTableBtn) {
            toggleTableBtn.addEventListener('click', () => {
                const wrapper = document.getElementById('loan-schedule-wrapper');
                const isHidden = wrapper.classList.toggle('hidden');
                toggleTableBtn.textContent = isHidden ? "Show Amortization Schedule ↓" : "Hide Amortization Schedule ↑";
            });
        }
    }

    function calculateLoan() {
        const principal = parseFloat(document.getElementById('loan-amount')?.value) || 25000;
        const annualRate = parseFloat(document.getElementById('loan-rate')?.value) || 6.5;
        let tenureVal = parseFloat(document.getElementById('loan-tenure')?.value) || 5;
        const tenureType = document.getElementById('loan-tenure-type')?.value || 'years';

        const totalMonths = tenureType === 'years' ? tenureVal * 12 : tenureVal;

        if (principal <= 0 || totalMonths <= 0) return;

        const monthlyRate = (annualRate / 12) / 100;
        let emi = 0;
        let totalPayment = 0;
        let totalInterest = 0;

        if (annualRate === 0) {
            emi = principal / totalMonths;
            totalPayment = principal;
            totalInterest = 0;
        } else {
            emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
                  (Math.pow(1 + monthlyRate, totalMonths) - 1);
            totalPayment = emi * totalMonths;
            totalInterest = totalPayment - principal;
        }

        // Update UI
        const emiEl = document.getElementById('loan-monthly-emi');
        const intEl = document.getElementById('loan-total-interest');
        const payEl = document.getElementById('loan-total-payment');

        if (emiEl) emiEl.textContent = `$${emi.toFixed(2)}`;
        if (intEl) intEl.textContent = `$${totalInterest.toFixed(2)}`;
        if (payEl) payEl.textContent = `$${totalPayment.toFixed(2)}`;

        // Render Donut chart for Loan
        renderLoanChart(principal, totalInterest);

        // Render Amortization Schedule
        renderAmortization(principal, monthlyRate, totalMonths, emi);
    }

    function renderLoanChart(principal, interest) {
        const svg = document.getElementById('loan-donut-svg');
        if (!svg) return;

        const total = principal + interest;
        const pPct = total > 0 ? principal / total : 0.5;
        const iPct = total > 0 ? interest / total : 0.5;

        const radius = 60;
        const cx = 80;
        const cy = 80;
        const circumference = 2 * Math.PI * radius;

        const pDash = `${(pPct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
        const iDash = `${(iPct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
        const iOffset = (-pPct * circumference).toFixed(2);

        svg.innerHTML = `
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="22"></circle>
            <!-- Principal (Blue) -->
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#3b82f6" stroke-width="22"
                stroke-dasharray="${pDash}" stroke-dashoffset="0" transform="rotate(-90 ${cx} ${cy})"></circle>
            <!-- Interest (Amber) -->
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#f59e0b" stroke-width="22"
                stroke-dasharray="${iDash}" stroke-dashoffset="${iOffset}" transform="rotate(-90 ${cx} ${cy})"></circle>
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-weight="700" font-size="13" fill="currentColor">
                ${Math.round(pPct * 100)}% / ${Math.round(iPct * 100)}%
            </text>
        `;
    }

    function renderAmortization(principal, monthlyRate, totalMonths, emi) {
        const tbody = document.getElementById('loan-schedule-body');
        if (!tbody) return;

        let balance = principal;
        let html = '';
        const step = totalMonths > 48 ? 12 : 1; // Show annual summary if long term

        let yearPrincipal = 0;
        let yearInterest = 0;

        for (let m = 1; m <= totalMonths; m++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = emi - interestPayment;
            balance = Math.max(0, balance - principalPayment);

            yearPrincipal += principalPayment;
            yearInterest += interestPayment;

            if (step === 1 || m % 12 === 0 || m === totalMonths) {
                const label = step === 12 ? `Year ${Math.ceil(m / 12)}` : `Month ${m}`;
                const pShow = step === 12 ? yearPrincipal : principalPayment;
                const iShow = step === 12 ? yearInterest : interestPayment;

                html += `
                    <tr>
                        <td>${label}</td>
                        <td>$${pShow.toFixed(2)}</td>
                        <td>$${iShow.toFixed(2)}</td>
                        <td>$${balance.toFixed(2)}</td>
                    </tr>
                `;
                yearPrincipal = 0;
                yearInterest = 0;
            }
        }

        tbody.innerHTML = html;
    }

    // ==========================================
    // 2. TIP & BILL SPLITTER
    // ==========================================
    let selectedTipPct = 15;

    function bindTipEvents() {
        const billInput = document.getElementById('tip-bill-amount');
        const splitInput = document.getElementById('tip-split-count');
        const customTip = document.getElementById('tip-custom-pct');
        const roundToggle = document.getElementById('tip-round-up');

        if (billInput) billInput.addEventListener('input', calculateTip);
        if (splitInput) splitInput.addEventListener('input', calculateTip);
        if (roundToggle) roundToggle.addEventListener('change', calculateTip);

        // Quick tip percentage buttons
        document.querySelectorAll('.tip-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tip-preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedTipPct = parseFloat(btn.dataset.tip);
                if (customTip) customTip.value = '';
                calculateTip();
            });
        });

        if (customTip) {
            customTip.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) {
                    document.querySelectorAll('.tip-preset-btn').forEach(b => b.classList.remove('active'));
                    selectedTipPct = val;
                    calculateTip();
                }
            });
        }

        // Copy split summary
        const copyBtn = document.getElementById('tip-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const bill = document.getElementById('tip-bill-amount')?.value || '0';
                const perPerson = document.getElementById('tip-person-total')?.textContent || '$0';
                const tipPerson = document.getElementById('tip-person-tip')?.textContent || '$0';
                const count = document.getElementById('tip-split-count')?.value || '1';

                const text = `Bill Split via DailyMate:\nTotal Bill: $${bill} (${selectedTipPct}% Tip)\nSplit between ${count} people\n👉 Each person pays: ${perPerson} (Includes ${tipPerson} tip)`;
                navigator.clipboard.writeText(text);
                App.showToast("Bill split summary copied to clipboard!", "success");
            });
        }
    }

    function calculateTip() {
        const bill = parseFloat(document.getElementById('tip-bill-amount')?.value) || 0;
        const people = Math.max(1, parseInt(document.getElementById('tip-split-count')?.value, 10) || 1);
        const roundUp = document.getElementById('tip-round-up')?.checked || false;

        let totalTip = (bill * selectedTipPct) / 100;
        let totalBill = bill + totalTip;

        if (roundUp) {
            totalBill = Math.ceil(totalBill);
            totalTip = Math.max(0, totalBill - bill);
        }

        const tipPerPerson = totalTip / people;
        const totalPerPerson = totalBill / people;

        // Update displays
        document.getElementById('tip-total-amount').textContent = `$${totalTip.toFixed(2)}`;
        document.getElementById('tip-final-total').textContent = `$${totalBill.toFixed(2)}`;
        document.getElementById('tip-person-tip').textContent = `$${tipPerPerson.toFixed(2)}`;
        document.getElementById('tip-person-total').textContent = `$${totalPerPerson.toFixed(2)}`;
    }

    // ==========================================
    // 3. AGE & DATE CALCULATOR
    // ==========================================
    function bindAgeEvents() {
        const birthInput = document.getElementById('age-birth-date');
        if (birthInput) {
            // Default 25 years ago
            const d = new Date();
            d.setFullYear(d.getFullYear() - 25);
            birthInput.value = d.toISOString().split('T')[0];
            birthInput.addEventListener('input', calculateAge);
        }

        // Sub-tabs in Age tool
        document.querySelectorAll('.date-tool-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.date-tool-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                document.querySelectorAll('.date-tab-view').forEach(v => v.classList.add('hidden'));
                document.getElementById(`date-view-${target}`)?.classList.remove('hidden');
            });
        });

        // Days between dates inputs
        const d1 = document.getElementById('date-diff-start');
        const d2 = document.getElementById('date-diff-end');
        if (d1 && d2) {
            const today = new Date().toISOString().split('T')[0];
            d1.value = today;
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            d2.value = nextMonth.toISOString().split('T')[0];

            d1.addEventListener('input', calculateDateDiff);
            d2.addEventListener('input', calculateDateDiff);
            calculateDateDiff();
        }
    }

    function calculateAge() {
        const birthVal = document.getElementById('age-birth-date')?.value;
        if (!birthVal) return;

        const birth = new Date(birthVal);
        const now = new Date();

        if (birth > now) {
            App.showToast("Birth date cannot be in the future", "warning");
            return;
        }

        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let days = now.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
            days += prevMonthDays;
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // Total units lived
        const diffMs = now - birth;
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));

        // Next Birthday
        let nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
        if (nextBday < now) {
            nextBday.setFullYear(now.getFullYear() + 1);
        }
        const bdayDiffMs = nextBday - now;
        const bdayDays = Math.ceil(bdayDiffMs / (1000 * 60 * 60 * 24));

        // Update UI
        document.getElementById('age-years').textContent = years;
        document.getElementById('age-months').textContent = months;
        document.getElementById('age-days').textContent = days;
        document.getElementById('age-total-days').textContent = totalDays.toLocaleString();
        document.getElementById('age-total-weeks').textContent = totalWeeks.toLocaleString();
        document.getElementById('age-total-hours').textContent = totalHours.toLocaleString();
        document.getElementById('age-next-bday').textContent = `${bdayDays} days to your next birthday! 🎂`;
    }

    function calculateDateDiff() {
        const startVal = document.getElementById('date-diff-start')?.value;
        const endVal = document.getElementById('date-diff-end')?.value;
        if (!startVal || !endVal) return;

        const d1 = new Date(startVal);
        const d2 = new Date(endVal);

        const diffTime = Math.abs(d2 - d1);
        const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(totalDays / 7);
        const remDays = totalDays % 7;

        // Calculate business days (Monday-Friday)
        let cur = new Date(Math.min(d1, d2));
        const end = new Date(Math.max(d1, d2));
        let businessDays = 0;
        while (cur < end) {
            cur.setDate(cur.getDate() + 1);
            const dayOfWeek = cur.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                businessDays++;
            }
        }

        const out = document.getElementById('date-diff-result');
        if (out) {
            out.innerHTML = `
                <div class="date-diff-badge">${totalDays} Total Calendar Days</div>
                <div class="text-sm text-muted mt-2">${weeks} weeks + ${remDays} days &bull; <strong>${businessDays} Business Days</strong></div>
            `;
        }
    }

    // ==========================================
    // 4. BMI & HEALTH / CALORIE CALCULATOR
    // ==========================================
    let bmiUnit = 'metric'; // 'metric' or 'imperial'

    function bindBmiEvents() {
        // Unit switch
        document.querySelectorAll('.bmi-unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.bmi-unit-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                bmiUnit = btn.dataset.unit;
                toggleBmiUnits(bmiUnit);
                calculateBmi();
            });
        });

        const inputs = [
            'bmi-height-cm', 'bmi-weight-kg',
            'bmi-height-ft', 'bmi-height-in', 'bmi-weight-lbs',
            'bmi-age', 'bmi-gender', 'bmi-activity'
        ];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateBmi);
        });
    }

    function toggleBmiUnits(unit) {
        document.getElementById('bmi-metric-fields')?.classList.toggle('hidden', unit !== 'metric');
        document.getElementById('bmi-imperial-fields')?.classList.toggle('hidden', unit !== 'imperial');
    }

    function calculateBmi() {
        let weightKg = 70;
        let heightCm = 175;

        if (bmiUnit === 'metric') {
            heightCm = parseFloat(document.getElementById('bmi-height-cm')?.value) || 175;
            weightKg = parseFloat(document.getElementById('bmi-weight-kg')?.value) || 70;
        } else {
            const ft = parseFloat(document.getElementById('bmi-height-ft')?.value) || 5;
            const inc = parseFloat(document.getElementById('bmi-height-in')?.value) || 9;
            const lbs = parseFloat(document.getElementById('bmi-weight-lbs')?.value) || 154;

            const totalInches = (ft * 12) + inc;
            heightCm = totalInches * 2.54;
            weightKg = lbs * 0.453592;
        }

        if (heightCm <= 0 || weightKg <= 0) return;

        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);

        // BMI category
        let category = 'Normal Weight';
        let badgeClass = 'badge-success';
        let barPercent = 50; // gauge position

        if (bmi < 18.5) {
            category = 'Underweight';
            badgeClass = 'badge-warning';
            barPercent = Math.max(5, (bmi / 18.5) * 25);
        } else if (bmi <= 24.9) {
            category = 'Healthy / Normal';
            badgeClass = 'badge-success';
            barPercent = 25 + ((bmi - 18.5) / (24.9 - 18.5)) * 25;
        } else if (bmi <= 29.9) {
            category = 'Overweight';
            badgeClass = 'badge-warning';
            barPercent = 50 + ((bmi - 25) / (29.9 - 25)) * 25;
        } else {
            category = 'Obese';
            badgeClass = 'badge-danger';
            barPercent = Math.min(95, 75 + ((bmi - 30) / 10) * 20);
        }

        // Healthy weight range (BMI 18.5 - 24.9)
        const minIdealKg = 18.5 * (heightM * heightM);
        const maxIdealKg = 24.9 * (heightM * heightM);

        // BMR & Daily Calories (Mifflin-St Jeor Equation)
        const age = parseInt(document.getElementById('bmi-age')?.value, 10) || 28;
        const gender = document.getElementById('bmi-gender')?.value || 'male';
        const activity = parseFloat(document.getElementById('bmi-activity')?.value) || 1.375;

        let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
        bmr += (gender === 'male' ? 5 : -161);

        const tdee = Math.round(bmr * activity);

        // Update UI
        document.getElementById('bmi-score').textContent = bmi.toFixed(1);
        const catBadge = document.getElementById('bmi-category');
        if (catBadge) {
            catBadge.textContent = category;
            catBadge.className = `badge ${badgeClass}`;
        }

        const pointer = document.getElementById('bmi-gauge-pointer');
        if (pointer) pointer.style.left = `${barPercent}%`;

        const idealEl = document.getElementById('bmi-ideal-range');
        if (idealEl) {
            if (bmiUnit === 'metric') {
                idealEl.textContent = `${minIdealKg.toFixed(1)} kg - ${maxIdealKg.toFixed(1)} kg`;
            } else {
                idealEl.textContent = `${(minIdealKg * 2.20462).toFixed(1)} lbs - ${(maxIdealKg * 2.20462).toFixed(1)} lbs`;
            }
        }

        document.getElementById('bmi-bmr-val').textContent = `${Math.round(bmr)} kcal/day`;
        document.getElementById('bmi-tdee-val').textContent = `${tdee} kcal/day`;
        document.getElementById('bmi-loss-val').textContent = `${tdee - 500} kcal/day`;
    }

    // ==========================================
    // 5. DISCOUNT & SALES TAX CALCULATOR
    // ==========================================
    function bindDiscountEvents() {
        const inputs = ['disc-price', 'disc-percent', 'disc-coupon', 'disc-tax'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateDiscount);
        });
    }

    function calculateDiscount() {
        const originalPrice = parseFloat(document.getElementById('disc-price')?.value) || 100;
        const discountPct = parseFloat(document.getElementById('disc-percent')?.value) || 20;
        const couponPct = parseFloat(document.getElementById('disc-coupon')?.value) || 0;
        const taxPct = parseFloat(document.getElementById('disc-tax')?.value) || 8;

        const mainSavings = (originalPrice * discountPct) / 100;
        const priceAfterMain = originalPrice - mainSavings;

        const couponSavings = (priceAfterMain * couponPct) / 100;
        const discountedSubtotal = priceAfterMain - couponSavings;

        const taxAmount = (discountedSubtotal * taxPct) / 100;
        const finalPrice = discountedSubtotal + taxAmount;
        const totalSaved = originalPrice - discountedSubtotal;

        document.getElementById('disc-final-price').textContent = `$${finalPrice.toFixed(2)}`;
        document.getElementById('disc-total-saved').textContent = `$${totalSaved.toFixed(2)}`;
        document.getElementById('disc-tax-amount').textContent = `$${taxAmount.toFixed(2)}`;
        document.getElementById('disc-subtotal').textContent = `$${discountedSubtotal.toFixed(2)}`;
    }

    return {
        init,
        calculateLoan,
        calculateTip,
        calculateAge,
        calculateBmi,
        calculateDiscount
    };
})();
