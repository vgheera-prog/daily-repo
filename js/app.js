/**
 * DailyMate - Core Application Controller
 * Handles SPA routing, search, favorites, theme toggle, Pro membership, ad controller, and toasts.
 */
const App = (function () {
    const THEME_KEY = 'dailymate_theme_mode';
    const FAVORITES_KEY = 'dailymate_user_favorites';
    const PRO_KEY = 'dailymate_is_pro_member';

    // Tool Directory
    const TOOLS = [
        {
            id: 'qr-generator',
            title: 'QR Code Studio',
            subtitle: 'Generate & customize QR codes with logos, colors & formats',
            category: 'qr',
            badge: 'Popular',
            badgeType: 'badge-primary',
            icon: '⚡',
            keywords: ['qr', 'generator', 'wifi', 'vcard', 'barcode', 'scan', 'url', 'svg', 'png']
        },
        {
            id: 'image-compressor',
            title: 'Image Compressor',
            subtitle: 'Reduce image size up to 85% with zero visual quality loss',
            category: 'media',
            badge: 'Free',
            badgeType: 'badge-success',
            icon: '🖼️',
            keywords: ['image', 'compress', 'optimize', 'shrink', 'resize', 'jpg', 'png', 'webp']
        },
        {
            id: 'image-studio',
            title: 'Filter & Watermark',
            subtitle: 'Rotate, flip, enhance with photo filters & custom watermarks',
            category: 'media',
            badge: 'New',
            badgeType: 'badge-accent',
            icon: '🎨',
            keywords: ['filter', 'photo', 'watermark', 'rotate', 'flip', 'contrast', 'brightness', 'canvas']
        },
        {
            id: 'images-to-pdf',
            title: 'Images to PDF',
            subtitle: 'Combine multiple photos into clean, formatted PDF documents',
            category: 'pdf',
            badge: 'Popular',
            badgeType: 'badge-primary',
            icon: '📄',
            keywords: ['pdf', 'images to pdf', 'convert', 'document', 'merge', 'a4', 'letter']
        },
        {
            id: 'budget-planner',
            title: 'Budget & 50/30/20',
            subtitle: 'Smart personal finance tracker, SVG charts & health rule analysis',
            category: 'finance',
            badge: 'Featured',
            badgeType: 'badge-accent',
            icon: '💰',
            keywords: ['budget', 'money', 'finance', 'expense', 'income', '50 30 20', 'savings', 'tracker', 'csv']
        },
        {
            id: 'loan-calculator',
            title: 'Loan & EMI Calculator',
            subtitle: 'Calculate monthly payments, total interest & amortization schedules',
            category: 'calculators',
            badge: 'Free',
            badgeType: 'badge-success',
            icon: '📊',
            keywords: ['loan', 'emi', 'mortgage', 'interest', 'car loan', 'amortization', 'finance']
        },
        {
            id: 'tip-calculator',
            title: 'Tip & Bill Splitter',
            subtitle: 'Split restaurant bills fairly among friends with exact tip breakdown',
            category: 'calculators',
            badge: 'Free',
            badgeType: 'badge-success',
            icon: '🧾',
            keywords: ['tip', 'bill', 'split', 'restaurant', 'dinner', 'percent', 'share']
        },
        {
            id: 'age-calculator',
            title: 'Age & Date Calculator',
            subtitle: 'Exact age in days/hours, birthday countdown & date difference',
            category: 'calculators',
            badge: 'Free',
            badgeType: 'badge-success',
            icon: '🎂',
            keywords: ['age', 'birthday', 'date', 'days between', 'calendar', 'countdown', 'time']
        },
        {
            id: 'bmi-calculator',
            title: 'BMI & Calorie Health',
            subtitle: 'Body mass index, healthy weight range, BMR & daily calorie goals',
            category: 'calculators',
            badge: 'Health',
            badgeType: 'badge-accent',
            icon: '❤️',
            keywords: ['bmi', 'weight', 'health', 'calorie', 'bmr', 'tdee', 'fitness', 'diet']
        },
        {
            id: 'discount-calculator',
            title: 'Discount & Tax',
            subtitle: 'Compute shopping discounts, stacked coupons & sales tax in seconds',
            category: 'calculators',
            badge: 'Free',
            badgeType: 'badge-success',
            icon: '🏷️',
            keywords: ['discount', 'sale', 'tax', 'shopping', 'coupon', 'savings', 'percent off']
        },
        {
            id: 'password-generator',
            title: 'Password Generator',
            subtitle: 'Cryptographically strong, uncrackable passwords with entropy meter',
            category: 'productivity',
            badge: 'Secure',
            badgeType: 'badge-primary',
            icon: '🔒',
            keywords: ['password', 'generator', 'security', 'crypto', 'entropy', 'pin', 'random']
        },
        {
            id: 'unit-converter',
            title: 'Universal Unit Converter',
            subtitle: 'Convert length, weight, temperature, speed & digital storage',
            category: 'productivity',
            badge: 'Free',
            badgeType: 'badge-success',
            icon: '🔄',
            keywords: ['convert', 'units', 'length', 'weight', 'temp', 'celsius', 'fahrenheit', 'kg', 'lbs']
        },
        {
            id: 'scratchpad',
            title: 'Notes & Scratchpad',
            subtitle: 'Quick scratchpad with auto-save, word counter & text tools',
            category: 'productivity',
            badge: 'Local',
            badgeType: 'badge-neutral',
            icon: '📝',
            keywords: ['notes', 'scratchpad', 'text', 'word count', 'memo', 'editor']
        }
    ];

    let favorites = [];
    let isPro = false;
    let currentFilter = 'all';

    function init() {
        loadSettings();
        bindGlobalEvents();
        renderToolGrid();
        renderFavorites();
        handleRouting();

        // Initialize sub-tools
        QRTool.init();
        ImageTools.init();
        PDFTools.init();
        BudgetPlanner.init();
        Calculators.init();
        Productivity.init();

        updateProUI();
    }

    function loadSettings() {
        // Theme init
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }

        // Favorites init
        try {
            favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || ['qr-generator', 'budget-planner', 'image-compressor'];
        } catch (e) {
            favorites = ['qr-generator', 'budget-planner', 'image-compressor'];
        }

        // Pro init
        isPro = localStorage.getItem(PRO_KEY) === 'true';
    }

    function bindGlobalEvents() {
        // SPA Hash Change
        window.addEventListener('hashchange', handleRouting);

        // Theme Toggle Button
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', toggleTheme);
        }

        // Pro Buttons
        document.querySelectorAll('.open-pro-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => openProModal());
        });

        const proModalClose = document.getElementById('pro-modal-close');
        if (proModalClose) {
            proModalClose.addEventListener('click', closeProModal);
        }

        const proModalOverlay = document.getElementById('pro-modal-overlay');
        if (proModalOverlay) {
            proModalOverlay.addEventListener('click', (e) => {
                if (e.target === proModalOverlay) closeProModal();
            });
        }

        const proToggleBtn = document.getElementById('pro-toggle-demo-btn');
        if (proToggleBtn) {
            proToggleBtn.addEventListener('click', toggleProMembership);
        }

        // Category Filter Tabs on Home
        document.querySelectorAll('.category-filter-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.category-filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentFilter = pill.dataset.category;
                renderToolGrid();
            });
        });

        // Search Inputs (Hero and Navbar)
        const heroSearch = document.getElementById('hero-search-input');
        if (heroSearch) {
            heroSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                renderToolGrid(query);
            });
        }

        // Quick search keyboard shortcut Ctrl+K / Cmd+K
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const s = document.getElementById('hero-search-input');
                if (s) {
                    s.focus();
                    s.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });

        // Mobile Menu Drawer Toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mobileDrawer = document.getElementById('mobile-drawer');
        const mobileClose = document.getElementById('mobile-drawer-close');

        if (mobileToggle && mobileDrawer) {
            mobileToggle.addEventListener('click', () => mobileDrawer.classList.add('open'));
            if (mobileClose) mobileClose.addEventListener('click', () => mobileDrawer.classList.remove('open'));
            mobileDrawer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => mobileDrawer.classList.remove('open'));
            });
        }
    }

    // ==========================================
    // ROUTING & NAVIGATION
    // ==========================================
    function handleRouting() {
        const hash = window.location.hash.replace('#', '') || 'home';
        const homeView = document.getElementById('view-home');
        const toolContainers = document.querySelectorAll('.tool-view');
        const breadcrumb = document.getElementById('view-breadcrumb');

        if (hash === 'home' || !hash) {
            if (homeView) homeView.classList.remove('hidden');
            toolContainers.forEach(el => el.classList.add('hidden'));
            if (breadcrumb) breadcrumb.classList.add('hidden');
            document.title = 'DailyMate — Everyday Free Utility Suite & Calculators';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const tool = TOOLS.find(t => t.id === hash);
        if (!tool) {
            window.location.hash = 'home';
            return;
        }

        // Show specific tool view
        if (homeView) homeView.classList.add('hidden');
        toolContainers.forEach(el => el.classList.add('hidden'));

        const targetEl = document.getElementById(`view-${tool.id}`);
        if (targetEl) {
            targetEl.classList.remove('hidden');
            if (breadcrumb) {
                breadcrumb.classList.remove('hidden');
                document.getElementById('breadcrumb-current-tool').textContent = tool.title;
            }
            document.title = `${tool.title} — DailyMate`;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.warn(`View #view-${tool.id} not found.`);
        }
    }

    function navigateTo(toolId) {
        window.location.hash = toolId;
    }

    // ==========================================
    // TOOL GRID & SEARCH
    // ==========================================
    function renderToolGrid(searchQuery = '') {
        const grid = document.getElementById('tools-grid');
        if (!grid) return;

        let filtered = TOOLS;

        if (currentFilter !== 'all') {
            filtered = filtered.filter(t => t.category === currentFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(searchQuery) ||
                t.subtitle.toLowerCase().includes(searchQuery) ||
                t.keywords.some(k => k.toLowerCase().includes(searchQuery))
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results-card">
                    <span class="no-results-icon">🔍</span>
                    <h3>No utilities found for "${searchQuery}"</h3>
                    <p>Try searching for keywords like "pdf", "qr", "loan", "image", or "budget".</p>
                    <button class="btn btn-secondary mt-3" onclick="document.getElementById('hero-search-input').value=''; App.renderToolGrid();">Clear Search</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(tool => {
            const isFav = favorites.includes(tool.id);
            return `
                <div class="tool-card" onclick="App.navigateTo('${tool.id}')">
                    <div class="tool-card-header">
                        <div class="tool-icon-box">${tool.icon}</div>
                        <div class="tool-card-badges">
                            <span class="badge ${tool.badgeType}">${tool.badge}</span>
                            <button class="fav-star-btn ${isFav ? 'starred' : ''}"
                                onclick="event.stopPropagation(); App.toggleFavorite('${tool.id}')"
                                title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                                ${isFav ? '★' : '☆'}
                            </button>
                        </div>
                    </div>
                    <h3 class="tool-card-title">${tool.title}</h3>
                    <p class="tool-card-desc">${tool.subtitle}</p>
                    <div class="tool-card-footer">
                        <span class="tool-launch-text">Launch Tool &rarr;</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderFavorites() {
        const favSection = document.getElementById('favorites-section');
        const favGrid = document.getElementById('favorites-grid');
        if (!favSection || !favGrid) return;

        const favTools = TOOLS.filter(t => favorites.includes(t.id));

        if (favTools.length === 0) {
            favSection.classList.add('hidden');
            return;
        }

        favSection.classList.remove('hidden');
        favGrid.innerHTML = favTools.map(tool => `
            <div class="tool-card tool-card-fav" onclick="App.navigateTo('${tool.id}')">
                <div class="tool-card-header">
                    <div class="tool-icon-box">${tool.icon}</div>
                    <button class="fav-star-btn starred"
                        onclick="event.stopPropagation(); App.toggleFavorite('${tool.id}')"
                        title="Remove from favorites">
                        ★
                    </button>
                </div>
                <h4 class="tool-card-title text-sm">${tool.title}</h4>
                <p class="tool-card-desc text-xs">${tool.subtitle}</p>
            </div>
        `).join('');
    }

    function toggleFavorite(toolId) {
        if (favorites.includes(toolId)) {
            favorites = favorites.filter(id => id !== toolId);
            showToast("Removed from favorites", "info");
        } else {
            favorites.push(toolId);
            showToast("Added to pinned favorites!", "success");
        }
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        renderToolGrid();
        renderFavorites();
    }

    // ==========================================
    // THEME CONTROLLER
    // ==========================================
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        const iconEl = document.getElementById('theme-toggle-icon');
        if (iconEl) {
            iconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
        showToast(`Switched to ${next} mode`, "info");
    }

    // ==========================================
    // PRO MEMBERSHIP & ADS SYSTEM
    // ==========================================
    function isProActive() {
        return isPro;
    }

    function openProModal(customMessage = null) {
        const modal = document.getElementById('pro-modal-overlay');
        const note = document.getElementById('pro-modal-custom-note');
        if (note) {
            note.textContent = customMessage || '';
            note.classList.toggle('hidden', !customMessage);
        }
        if (modal) modal.classList.remove('hidden');
    }

    function closeProModal() {
        const modal = document.getElementById('pro-modal-overlay');
        if (modal) modal.classList.add('hidden');
    }

    function toggleProMembership() {
        isPro = !isPro;
        localStorage.setItem(PRO_KEY, isPro ? 'true' : 'false');
        updateProUI();
        closeProModal();

        if (isPro) {
            showToast("🎉 DailyMate Pro Unlocked! All ads hidden & Pro perks enabled.", "success", 4000);
        } else {
            showToast("Returned to Free Ad-Supported Tier.", "info", 3000);
        }
    }

    function updateProUI() {
        const proBadge = document.getElementById('nav-pro-badge');
        const toggleBtn = document.getElementById('pro-toggle-demo-btn');
        const adElements = document.querySelectorAll('.ad-banner-slot');

        if (proBadge) {
            proBadge.classList.toggle('hidden', !isPro);
        }

        if (toggleBtn) {
            toggleBtn.textContent = isPro ? 'Downgrade to Free Tier (Demo)' : 'Activate Pro Free Demo (Instant)';
            toggleBtn.className = isPro ? 'btn btn-secondary' : 'btn btn-pro-glow';
        }

        // Ad hiding / showing
        adElements.forEach(ad => {
            if (isPro) {
                ad.classList.add('ad-hidden');
            } else {
                ad.classList.remove('ad-hidden');
            }
        });
    }

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-msg">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    return {
        init,
        navigateTo,
        renderToolGrid,
        toggleFavorite,
        toggleTheme,
        openProModal,
        closeProModal,
        toggleProMembership,
        isProActive,
        showToast
    };
})();

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
