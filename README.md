# ⚡ DailyMate — AI Automation & Utility Workspace

> A clean, responsive, and privacy-first web utility workspace built purely with **HTML5, CSS3, and modern Vanilla JavaScript**.
> Engineered with a clean architecture ready for AI automation integration, agent workflows, and automated utilities.
> Zero placeholder data, zero fake results, and zero server bloat.

---

## 🌟 Overview

DailyMate provides a modular frontend canvas ready for AI tool integration:
* **Clean & Blank by Default**: No sample tools, mock ads, or fake placeholder results.
* **Extensible AI Automation Engine (`js/ai-engine.js`)**:
  * Programmatic tool registration API: `DailyMateAI.registerTool({...})`
  * Model & Webhook configuration manager (Gemini, OpenAI, Anthropic, Ollama, custom REST webhooks)
  * Real task execution pipeline with live status reporting (no fake results)
* **Responsive UI Design System**:
  * Light / Dark mode toggle with persistent state
  * Clean semantic HTML5 and CSS variable-driven styling
  * Execution console for real automation outputs

---

## 🚀 How to Run

1. Open `index.html` directly in any web browser.
2. Or run a simple local web server:
   ```powershell
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your browser.

---

## 🔌 AI Integration Guide

### 1. Connecting an AI Backend
Click **⚙️ AI Config** in the header or workspace:
* Select your provider: **Google Gemini**, **OpenAI**, **Anthropic**, **Local Ollama**, or **Custom Webhook**.
* Provide your API key and target model identifier.
* Settings are stored locally in your browser (`localStorage`).

### 2. Registering an AI Automation Tool Programmatically
```javascript
// Register a custom automated utility
DailyMateAI.registerTool({
    id: 'data-cleaner',
    name: 'Automated Data Cleaner',
    description: 'Formats and cleans incoming tabular data via AI',
    category: 'automation'
});
```

---

## 📁 Repository Structure

```
dailyy use web/
├── index.html          # Clean Single-Page Application (SPA) layout
├── README.md           # Documentation & AI integration guide
├── css/
│   ├── style.css       # Design system, themes & workspace styles
│   └── responsive.css  # Mobile and tablet breakpoints
└── js/
    ├── ai-engine.js    # AI automation & tool registration engine
    └── app.js          # UI controller, theme switcher & event bindings
```
