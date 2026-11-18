/**
 * DailyMate - Application UI Controller
 * Manages workspace rendering, theme switching, AI settings & modal dialogs.
 * Blank tool section ready for future AI automation integration.
 */

const App = (function () {
    const THEME_KEY = 'dailymate_theme';

    function init() {
        initTheme();
        DailyMateAI.init();
        bindEvents();
        renderWorkspace();
        updateConnectionBadge();
    }

    // ==========================================
    // THEME CONTROLLER
    // ==========================================
    function initTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) {
            setTheme(saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        const icon = document.getElementById('theme-toggle-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
    }

    // ==========================================
    // EVENTS & BINDINGS
    // ==========================================
    function bindEvents() {
        // Theme toggle
        document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

        // AI Config Modal
        document.querySelectorAll('.open-config-modal-btn').forEach(btn => {
            btn.addEventListener('click', openConfigModal);
        });
        document.getElementById('config-modal-close')?.addEventListener('click', closeConfigModal);
        document.getElementById('config-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'config-modal-overlay') closeConfigModal();
        });
        document.getElementById('ai-config-form')?.addEventListener('submit', handleSaveConfig);

        // Add Tool Modal
        document.querySelectorAll('.open-add-tool-modal-btn').forEach(btn => {
            btn.addEventListener('click', openAddToolModal);
        });
        document.getElementById('add-tool-modal-close')?.addEventListener('click', closeAddToolModal);
        document.getElementById('add-tool-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'add-tool-modal-overlay') closeAddToolModal);
        });
        document.getElementById('add-tool-form')?.addEventListener('submit', handleAddTool);

        // Clear Workspace button
        document.getElementById('clear-workspace-btn')?.addEventListener('click', handleClearWorkspace);

        // Task Execution
        document.getElementById('execute-task-btn')?.addEventListener('click', handleExecuteTask);
        document.getElementById('ai-command-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleExecuteTask();
            }
        });
    }

    // ==========================================
    // WORKSPACE RENDERING (BLANK / CLEAN)
    // ==========================================
    function renderWorkspace() {
        const container = document.getElementById('ai-tools-container');
        if (!container) return;

        const tools = DailyMateAI.getTools();

        if (tools.length === 0) {
            // Pristine, clean blank workspace ready for future AI automation
            container.innerHTML = `
                <div class="blank-workspace-card">
                    <div class="blank-workspace-icon">⚡</div>
                    <h3 class="blank-workspace-title">DailyMate Tool Workspace</h3>
                    <p class="blank-workspace-desc">
                        Workspace is clean and ready for AI automation integration. No placeholder tools or dummy data loaded.
                    </p>
                    <div class="blank-workspace-actions">
                        <button class="btn btn-primary open-config-modal-btn">
                            ⚙️ Connect AI Endpoint
                        </button>
                        <button class="btn btn-secondary open-add-tool-modal-btn">
                            + Register AI Automation
                        </button>
                    </div>
                    <div class="integration-guide-box">
                        <span class="guide-badge">Ready for Integration</span>
                        <p class="guide-text">
                            Developer / Agent Hook: Use <code>DailyMateAI.registerTool({...})</code> or connect your OpenAI, Gemini, Anthropic, or local Ollama endpoints in Settings.
                        </p>
                    </div>
                </div>
            `;
            // Re-bind modal buttons in newly rendered blank card
            container.querySelector('.open-config-modal-btn')?.addEventListener('click', openConfigModal);
            container.querySelector('.open-add-tool-modal-btn')?.addEventListener('click', openAddToolModal);
            return;
        }

        // Render real registered tools
        container.innerHTML = `
            <div class="tools-grid">
                ${tools.map(tool => `
                    <div class="tool-card">
                        <div class="tool-card-header">
                            <span class="tool-badge">${escapeHtml(tool.category)}</span>
                            <button class="btn-icon-delete" onclick="App.deleteTool('${tool.id}')" title="Remove tool">✕</button>
                        </div>
                        <h4 class="tool-card-title">${escapeHtml(tool.name)}</h4>
                        <p class="tool-card-desc">${escapeHtml(tool.description || 'Custom AI automated utility')}</p>
                        <div class="tool-card-footer">
                            <button class="btn btn-primary text-xs w-100" onclick="App.triggerTool('${tool.id}')">Run Automation &rarr;</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function updateConnectionBadge() {
        const badge = document.getElementById('ai-status-badge');
        if (!badge) return;

        const configured = DailyMateAI.isConfigured();
        if (configured) {
            badge.className = 'status-badge status-connected';
            badge.innerHTML = '● AI Connected';
        } else {
            badge.className = 'status-badge status-ready';
            badge.innerHTML = '○ AI Engine Ready';
        }
    }

    // ==========================================
    // EXECUTION & ACTIONS (NO FAKE RESULTS)
    // ==========================================
    async function handleExecuteTask() {
        const input = document.getElementById('ai-command-input');
        const outputConsole = document.getElementById('ai-output-console');
        const outputText = document.getElementById('ai-output-text');
        const btn = document.getElementById('execute-task-btn');

        if (!input || !outputConsole || !outputText) return;

        const prompt = input.value.trim();
        if (!prompt) {
            showToast("Please enter an automation task or instruction.", "warning");
            return;
        }

        outputConsole.classList.remove('hidden');
        outputText.innerHTML = '<span class="status-running">● Dispatching to AI automation engine...</span>';
        if (btn) btn.disabled = true;

        try {
            const result = await DailyMateAI.executeAutomation(prompt);

            if (result.status === 'unconfigured') {
                outputText.innerHTML = `
                    <div class="console-alert console-warning">
                        <strong>Endpoint Not Connected</strong>
                        <p>${result.message}</p>
                        <button class="btn btn-secondary text-xs mt-2" onclick="App.openConfigModal()">Configure AI Backend &rarr;</button>
                    </div>
                `;
            } else if (result.status === 'success') {
                outputText.textContent = JSON.stringify(result.data, null, 2);
                showToast("Automation task executed.", "success");
            }
        } catch (err) {
            outputText.innerHTML = `
                <div class="console-alert console-error">
                    <strong>Execution Error:</strong> ${escapeHtml(err.message)}
                </div>
            `;
            showToast(err.message, "error");
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function handleClearWorkspace() {
        DailyMateAI.clearTools();
        const outputConsole = document.getElementById('ai-output-console');
        if (outputConsole) outputConsole.classList.add('hidden');
        const input = document.getElementById('ai-command-input');
        if (input) input.value = '';

        renderWorkspace();
        showToast("Workspace cleared.", "info");
    }

    function deleteTool(toolId) {
        DailyMateAI.removeTool(toolId);
        renderWorkspace();
        showToast("Tool removed from workspace.", "info");
    }

    function triggerTool(toolId) {
        const tools = DailyMateAI.getTools();
        const tool = tools.find(t => t.id === toolId);
        if (!tool) return;

        const input = document.getElementById('ai-command-input');
        if (input) {
            input.value = `Execute ${tool.name}`;
            input.focus();
        }
        handleExecuteTask();
    }

    // ==========================================
    // MODALS: AI CONFIGURATION & ADD TOOL
    // ==========================================
    function openConfigModal() {
        const modal = document.getElementById('config-modal-overlay');
        const config = DailyMateAI.getConfig();

        if (document.getElementById('ai-provider-select')) {
            document.getElementById('ai-provider-select').value = config.provider || 'gemini';
        }
        if (document.getElementById('ai-endpoint-input')) {
            document.getElementById('ai-endpoint-input').value = config.endpoint || '';
        }
        if (document.getElementById('ai-apikey-input')) {
            document.getElementById('ai-apikey-input').value = config.apiKey || '';
        }
        if (document.getElementById('ai-model-input')) {
            document.getElementById('ai-model-input').value = config.model || '';
        }

        if (modal) modal.classList.remove('hidden');
    }

    function closeConfigModal() {
        document.getElementById('config-modal-overlay')?.classList.add('hidden');
    }

    function handleSaveConfig(e) {
        e.preventDefault();
        const provider = document.getElementById('ai-provider-select')?.value || 'gemini';
        const endpoint = document.getElementById('ai-endpoint-input')?.value.trim() || '';
        const apiKey = document.getElementById('ai-apikey-input')?.value.trim() || '';
        const model = document.getElementById('ai-model-input')?.value.trim() || '';

        DailyMateAI.saveConfig({
            provider,
            endpoint,
            apiKey,
            model
        });

        closeConfigModal();
        updateConnectionBadge();
        showToast("AI configuration saved successfully.", "success");
    }

    function openAddToolModal() {
        document.getElementById('add-tool-modal-overlay')?.classList.remove('hidden');
    }

    function closeAddToolModal() {
        document.getElementById('add-tool-modal-overlay')?.classList.add('hidden');
    }

    function handleAddTool(e) {
        e.preventDefault();
        const name = document.getElementById('tool-name-input')?.value.trim();
        const desc = document.getElementById('tool-desc-input')?.value.trim();
        const category = document.getElementById('tool-cat-select')?.value || 'automation';

        if (!name) {
            showToast("Please provide a tool name.", "warning");
            return;
        }

        const id = 'tool_' + Date.now();
        DailyMateAI.registerTool({
            id,
            name,
            description: desc,
            category
        });

        // Reset form & close
        document.getElementById('tool-name-input').value = '';
        document.getElementById('tool-desc-input').value = '';
        closeAddToolModal();

        renderWorkspace();
        showToast(`Registered automation tool: "${name}"`, "success");
    }

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === container) container.removeChild(toast);
            }, 300);
        }, duration);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return {
        init,
        openConfigModal,
        closeConfigModal,
        openAddToolModal,
        closeAddToolModal,
        deleteTool,
        triggerTool,
        showToast
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
