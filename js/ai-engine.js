/**
 * DailyMate - Core AI Automation Engine
 * Clean, extensible architecture ready for AI models, agents & automation workflows.
 * No dummy content, no fake results.
 */

const DailyMateAI = (function () {
    const STORAGE_CONFIG_KEY = 'dailymate_ai_config';
    const STORAGE_TOOLS_KEY = 'dailymate_ai_tools';

    // State
    let config = {
        provider: 'gemini', // 'gemini', 'openai', 'anthropic', 'ollama', 'custom'
        endpoint: '',
        apiKey: '',
        model: ''
    };

    let registeredTools = [];
    let isExecuting = false;

    function init() {
        loadConfig();
        loadRegisteredTools();
    }

    function loadConfig() {
        try {
            const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
            if (saved) {
                config = Object.assign(config, JSON.parse(saved));
            }
        } catch (e) {
            console.error("Error loading DailyMate AI configuration:", e);
        }
    }

    function saveConfig(newConfig) {
        config = Object.assign(config, newConfig);
        try {
            localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
        } catch (e) {
            console.error("Error saving DailyMate AI configuration:", e);
        }
        return config;
    }

    function getConfig() {
        return Object.assign({}, config);
    }

    function loadRegisteredTools() {
        try {
            const saved = localStorage.getItem(STORAGE_TOOLS_KEY);
            if (saved) {
                registeredTools = JSON.parse(saved);
            } else {
                registeredTools = [];
            }
        } catch (e) {
            registeredTools = [];
        }
    }

    function saveRegisteredTools() {
        try {
            localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(registeredTools));
        } catch (e) {
            console.error("Error saving registered tools:", e);
        }
    }

    /**
     * Register a new AI automation tool dynamically
     */
    function registerTool(toolDef) {
        if (!toolDef || !toolDef.id || !toolDef.name) {
            throw new Error("Tool definition must include id and name.");
        }
        // Remove existing with same id if any
        registeredTools = registeredTools.filter(t => t.id !== toolDef.id);
        registeredTools.push({
            id: toolDef.id,
            name: toolDef.name,
            description: toolDef.description || '',
            category: toolDef.category || 'general',
            endpoint: toolDef.endpoint || '',
            createdAt: new Date().toISOString()
        });
        saveRegisteredTools();
        return registeredTools;
    }

    /**
     * Remove an AI automation tool
     */
    function removeTool(toolId) {
        registeredTools = registeredTools.filter(t => t.id !== toolId);
        saveRegisteredTools();
        return registeredTools;
    }

    /**
     * Clear all custom registered tools
     */
    function clearTools() {
        registeredTools = [];
        saveRegisteredTools();
        return registeredTools;
    }

    function getTools() {
        return registeredTools.slice();
    }

    /**
     * Check if AI integration is configured
     */
    function isConfigured() {
        return Boolean(config.apiKey || config.endpoint);
    }

    /**
     * Execute an automation instruction via the configured AI backend
     * No fake results: if unconfigured, cleanly returns status indicating real endpoint is needed.
     */
    async function executeAutomation(promptText) {
        if (!promptText || !promptText.trim()) {
            throw new Error("Prompt cannot be empty.");
        }

        if (isExecuting) {
            throw new Error("An automation task is already running.");
        }

        isExecuting = true;

        try {
            if (!isConfigured()) {
                return {
                    status: 'unconfigured',
                    message: 'No AI backend is currently connected. Please configure your API Key or custom endpoint in AI Settings to execute live automations.',
                    timestamp: new Date().toISOString()
                };
            }

            // Real dispatch to user-configured endpoint
            const targetUrl = config.endpoint || getDefaultEndpoint(config.provider);
            const headers = {
                'Content-Type': 'application/json'
            };

            if (config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }

            const payload = {
                model: config.model || getDefaultModel(config.provider),
                messages: [
                    { role: 'user', content: promptText.trim() }
                ]
            };

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Endpoint returned status ${response.status}: ${errText}`);
            }

            const data = await response.json();
            return {
                status: 'success',
                data: data,
                timestamp: new Date().toISOString()
            };

        } finally {
            isExecuting = false;
        }
    }

    function getDefaultEndpoint(provider) {
        switch (provider) {
            case 'openai':
                return 'https://api.openai.com/v1/chat/completions';
            case 'ollama':
                return 'http://localhost:11434/api/generate';
            default:
                return '';
        }
    }

    function getDefaultModel(provider) {
        switch (provider) {
            case 'openai': return 'gpt-4o-mini';
            case 'ollama': return 'llama3';
            default: return '';
        }
    }

    return {
        init,
        getConfig,
        saveConfig,
        isConfigured,
        registerTool,
        removeTool,
        clearTools,
        getTools,
        executeAutomation
    };
})();
