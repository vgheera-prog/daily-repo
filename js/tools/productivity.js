/**
 * DailyMate - Productivity Suite (Password Generator, Unit Converter & Scratchpad)
 */
const Productivity = (function () {

    function init() {
        bindPasswordEvents();
        bindUnitEvents();
        bindNotesEvents();

        generatePassword();
        convertUnits();
    }

    // ==========================================
    // 1. PASSWORD GENERATOR
    // ==========================================
    function bindPasswordEvents() {
        const lenSlider = document.getElementById('pass-length');
        if (lenSlider) {
            lenSlider.addEventListener('input', (e) => {
                document.getElementById('pass-length-val').textContent = e.target.value;
                generatePassword();
            });
        }

        const toggles = ['pass-upper', 'pass-lower', 'pass-numbers', 'pass-symbols', 'pass-ambiguous'];
        toggles.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', generatePassword);
        });

        const regenBtn = document.getElementById('pass-regen-btn');
        if (regenBtn) regenBtn.addEventListener('click', generatePassword);

        const copyBtn = document.getElementById('pass-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const pass = document.getElementById('pass-output')?.value;
                if (!pass) return;
                navigator.clipboard.writeText(pass);
                App.showToast("Password copied to clipboard!", "success");
            });
        }
    }

    function generatePassword() {
        const len = parseInt(document.getElementById('pass-length')?.value || '16', 10);
        const incUpper = document.getElementById('pass-upper')?.checked ?? true;
        const incLower = document.getElementById('pass-lower')?.checked ?? true;
        const incNum = document.getElementById('pass-numbers')?.checked ?? true;
        const incSym = document.getElementById('pass-symbols')?.checked ?? true;
        const noAmbiguous = document.getElementById('pass-ambiguous')?.checked ?? false;

        let charset = '';
        let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let lower = 'abcdefghijklmnopqrstuvwxyz';
        let nums = '0123456789';
        let syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (noAmbiguous) {
            upper = upper.replace(/[IO]/g, '');
            lower = lower.replace(/[lo]/g, '');
            nums = nums.replace(/[01]/g, '');
            syms = syms.replace(/[|]/g, '');
        }

        if (incUpper) charset += upper;
        if (incLower) charset += lower;
        if (incNum) charset += nums;
        if (incSym) charset += syms;

        if (!charset) {
            document.getElementById('pass-output').value = 'Select at least one character type';
            return;
        }

        const array = new Uint32Array(len);
        window.crypto.getRandomValues(array);

        let password = '';
        for (let i = 0; i < len; i++) {
            password += charset[array[i] % charset.length];
        }

        const out = document.getElementById('pass-output');
        if (out) out.value = password;

        evaluatePasswordStrength(password, len, charset.length);
    }

    function evaluatePasswordStrength(password, len, poolSize) {
        // Entropy in bits = len * log2(poolSize)
        const entropy = Math.round(len * (Math.log(poolSize) / Math.LN2));

        let text = 'Weak';
        let colorClass = 'strength-weak';
        let width = '25%';

        if (entropy >= 80) {
            text = 'Ultra-Secure 🛡️';
            colorClass = 'strength-ultra';
            width = '100%';
        } else if (entropy >= 60) {
            text = 'Strong 💪';
            colorClass = 'strength-strong';
            width = '75%';
        } else if (entropy >= 40) {
            text = 'Fair ⚡';
            colorClass = 'strength-fair';
            width = '50%';
        }

        const bar = document.getElementById('pass-strength-bar');
        const label = document.getElementById('pass-strength-text');
        if (bar) {
            bar.style.width = width;
            bar.className = `strength-bar-fill ${colorClass}`;
        }
        if (label) {
            label.textContent = `${text} (${entropy} bits entropy)`;
        }
    }

    // ==========================================
    // 2. UNIT CONVERTER
    // ==========================================
    const UNIT_DEFINITIONS = {
        length: {
            base: 'm',
            units: {
                m: { name: 'Meters (m)', factor: 1 },
                km: { name: 'Kilometers (km)', factor: 1000 },
                cm: { name: 'Centimeters (cm)', factor: 0.01 },
                mm: { name: 'Millimeters (mm)', factor: 0.001 },
                mi: { name: 'Miles (mi)', factor: 1609.344 },
                yd: { name: 'Yards (yd)', factor: 0.9144 },
                ft: { name: 'Feet (ft)', factor: 0.3048 },
                in: { name: 'Inches (in)', factor: 0.0254 }
            }
        },
        weight: {
            base: 'kg',
            units: {
                kg: { name: 'Kilograms (kg)', factor: 1 },
                g: { name: 'Grams (g)', factor: 0.001 },
                mg: { name: 'Milligrams (mg)', factor: 0.000001 },
                lb: { name: 'Pounds (lbs)', factor: 0.45359237 },
                oz: { name: 'Ounces (oz)', factor: 0.02834952 },
                ton: { name: 'Metric Tons (t)', factor: 1000 }
            }
        },
        temperature: {
            isSpecial: true,
            units: {
                c: { name: 'Celsius (°C)' },
                f: { name: 'Fahrenheit (°F)' },
                k: { name: 'Kelvin (K)' }
            }
        },
        speed: {
            base: 'mps',
            units: {
                mps: { name: 'Meters / sec (m/s)', factor: 1 },
                kmh: { name: 'Kilometers / hr (km/h)', factor: 0.277778 },
                mph: { name: 'Miles / hr (mph)', factor: 0.44704 },
                knot: { name: 'Knots (kn)', factor: 0.514444 }
            }
        },
        data: {
            base: 'b',
            units: {
                b: { name: 'Bytes (B)', factor: 1 },
                kb: { name: 'Kilobytes (KB)', factor: 1024 },
                mb: { name: 'Megabytes (MB)', factor: 1048576 },
                gb: { name: 'Gigabytes (GB)', factor: 1073741824 },
                tb: { name: 'Terabytes (TB)', factor: 1099511627776 }
            }
        }
    };

    let currentUnitCategory = 'length';

    function bindUnitEvents() {
        const catSelect = document.getElementById('unit-category');
        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                currentUnitCategory = e.target.value;
                populateUnitDropdowns();
                convertUnits();
            });
        }

        populateUnitDropdowns();

        const fromVal = document.getElementById('unit-from-val');
        const fromUnit = document.getElementById('unit-from-type');
        const toUnit = document.getElementById('unit-to-type');

        if (fromVal) fromVal.addEventListener('input', convertUnits);
        if (fromUnit) fromUnit.addEventListener('change', convertUnits);
        if (toUnit) toUnit.addEventListener('change', convertUnits);

        const swapBtn = document.getElementById('unit-swap-btn');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                const f = fromUnit.value;
                fromUnit.value = toUnit.value;
                toUnit.value = f;
                convertUnits();
            });
        }
    }

    function populateUnitDropdowns() {
        const fromSelect = document.getElementById('unit-from-type');
        const toSelect = document.getElementById('unit-to-type');
        if (!fromSelect || !toSelect) return;

        const catData = UNIT_DEFINITIONS[currentUnitCategory];
        const unitKeys = Object.keys(catData.units);

        let html = '';
        unitKeys.forEach(k => {
            html += `<option value="${k}">${catData.units[k].name}</option>`;
        });

        fromSelect.innerHTML = html;
        toSelect.innerHTML = html;

        fromSelect.value = unitKeys[0];
        toSelect.value = unitKeys[1] || unitKeys[0];
    }

    function convertUnits() {
        const fromVal = parseFloat(document.getElementById('unit-from-val')?.value) || 0;
        const fromUnit = document.getElementById('unit-from-type')?.value;
        const toUnit = document.getElementById('unit-to-type')?.value;
        const toValEl = document.getElementById('unit-to-val');
        if (!toValEl || !fromUnit || !toUnit) return;

        const catData = UNIT_DEFINITIONS[currentUnitCategory];

        if (catData.isSpecial && currentUnitCategory === 'temperature') {
            // Temperature conversions
            let c = 0;
            if (fromUnit === 'c') c = fromVal;
            else if (fromUnit === 'f') c = (fromVal - 32) * (5 / 9);
            else if (fromUnit === 'k') c = fromVal - 273.15;

            let result = 0;
            if (toUnit === 'c') result = c;
            else if (toUnit === 'f') result = (c * 9 / 5) + 32;
            else if (toUnit === 'k') result = c + 273.15;

            toValEl.value = parseFloat(result.toFixed(4));
            return;
        }

        // Standard factor conversion via base
        const fromFactor = catData.units[fromUnit].factor;
        const toFactor = catData.units[toUnit].factor;

        const baseVal = fromVal * fromFactor;
        const finalVal = baseVal / toFactor;

        toValEl.value = parseFloat(finalVal.toPrecision(7));
    }

    // ==========================================
    // 3. QUICK NOTES & SCRATCHPAD
    // ==========================================
    const NOTES_KEY = 'dailymate_scratchpad_content';

    function bindNotesEvents() {
        const pad = document.getElementById('scratchpad-textarea');
        if (pad) {
            pad.value = localStorage.getItem(NOTES_KEY) || 'Welcome to DailyMate Scratchpad!\n\nUse this space for quick thoughts, meeting notes, code snippets, or to-do checklists.\n\n✨ Features:\n• Auto-saved in your browser locally\n• Instant word & character stats\n• One-click export to .txt file\n• Text case transformation tools';
            updateNoteStats();

            pad.addEventListener('input', () => {
                localStorage.setItem(NOTES_KEY, pad.value);
                updateNoteStats();
            });
        }

        // Case transformation tools
        document.getElementById('notes-upper-btn')?.addEventListener('click', () => transformNotes('upper'));
        document.getElementById('notes-lower-btn')?.addEventListener('click', () => transformNotes('lower'));
        document.getElementById('notes-title-btn')?.addEventListener('click', () => transformNotes('title'));

        // Copy & Clear & Download
        document.getElementById('notes-copy-btn')?.addEventListener('click', () => {
            const pad = document.getElementById('scratchpad-textarea');
            if (pad) {
                navigator.clipboard.writeText(pad.value);
                App.showToast("Notes copied to clipboard!", "success");
            }
        });

        document.getElementById('notes-clear-btn')?.addEventListener('click', () => {
            if (confirm("Clear all notes?")) {
                const pad = document.getElementById('scratchpad-textarea');
                if (pad) pad.value = '';
                localStorage.removeItem(NOTES_KEY);
                updateNoteStats();
                App.showToast("Scratchpad cleared", "info");
            }
        });

        document.getElementById('notes-download-btn')?.addEventListener('click', () => {
            const pad = document.getElementById('scratchpad-textarea');
            if (!pad || !pad.value) return;
            const blob = new Blob([pad.value], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dailymate-notes-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            App.showToast("Notes downloaded as text file!", "success");
        });
    }

    function transformNotes(mode) {
        const pad = document.getElementById('scratchpad-textarea');
        if (!pad) return;

        if (mode === 'upper') {
            pad.value = pad.value.toUpperCase();
        } else if (mode === 'lower') {
            pad.value = pad.value.toLowerCase();
        } else if (mode === 'title') {
            pad.value = pad.value.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }
        localStorage.setItem(NOTES_KEY, pad.value);
        updateNoteStats();
        App.showToast(`Applied ${mode} case!`, "info");
    }

    function updateNoteStats() {
        const pad = document.getElementById('scratchpad-textarea');
        if (!pad) return;
        const text = pad.value;

        const charCount = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+/g) || []).length : 0;
        const readTimeMin = Math.ceil(words / 200);

        document.getElementById('notes-stat-words').textContent = words.toLocaleString();
        document.getElementById('notes-stat-chars').textContent = charCount.toLocaleString();
        document.getElementById('notes-stat-sentences').textContent = sentences.toLocaleString();
        document.getElementById('notes-stat-readtime').textContent = `${readTimeMin} min read`;
    }

    return {
        init,
        generatePassword,
        convertUnits
    };
})();
