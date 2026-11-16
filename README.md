# ⚡ DailyMate — Everyday Responsive Utility Suite

> An all-in-one, privacy-first web utility suite built purely with **HTML5, CSS3, and modern Vanilla JavaScript**. 
> Zero backend dependencies, zero server file uploads, and 100% client-side processing.

---

## 🌟 Key Features & Tools

### 1. ⚡ QR Code Studio & Scanner
* **Multi-type encoding**: Website URLs, Plain Text, Wi-Fi networks (SSID, Password, Security), Contact vCards, Emails, and Phone numbers.
* **Full visual styling**: Live foreground & background color pickers, resolution size slider (160px–500px), and margin control.
* **Error correction & logos**: Four error correction levels (L, M, Q, H) and center icon stamping (Link, Wi-Fi, Heart, Star, or custom uploaded logos).
* **Instant Export**: Download as high-res PNG, vector SVG, or copy directly to the system clipboard.
* **Built-in QR Scanner**: Upload any QR code image for client-side decoding.

### 2. 🖼️ Image Compressor & Resizer
* **Intelligent Compression**: Reduce file sizes up to 85% with an adjustable quality slider (10% to 100%).
* **Custom Dimensions**: Resize by exact pixel width and height with aspect ratio lock, or use one-click scale presets (25%, 50%, 75%, 100%).
* **Multi-format Conversion**: Export to JPEG, modern WebP, or lossless PNG.
* **Live Comparison**: Side-by-side original vs. compressed preview with real-time saved percentage and byte calculations.

### 3. 🎨 Filter & Watermark Studio
* **Photo Adjustments**: Real-time canvas sliders for Brightness, Contrast, Saturation, Grayscale, Sepia, Invert, and Blur.
* **Transformations**: 90° Clockwise and Counter-Clockwise rotation, plus Horizontal and Vertical flips.
* **Custom Watermarks**: Overlay custom text with configurable font size, opacity, position (Center, Bottom-Right, Top-Left, or repeating Diagonal Tile), and color.

### 4. 📄 Images to PDF Converter
* **Multi-Page Compilation**: Upload multiple images (JPG, PNG, WebP) and reorder pages with up/down arrows.
* **Custom Layouts**: Select page sizes (A4, US Letter, Legal), orientation (Portrait or Landscape), and margin widths.
* **Pure Client-Side Engine**: Powered by `SimplePDF`, generating valid standard PDF-1.4 documents directly in the browser.

### 5. 💰 Budget Planner & 50/30/20 Rule Analyzer
* **Financial Health Benchmark**: Visual 50/30/20 rule breakdown:
  * **50% Needs**: Housing, utilities, groceries, health, and transport.
  * **30% Wants**: Dining out, shopping, hobbies, and subscriptions.
  * **20% Savings & Debt**: Investments, emergency fund, and loan paydowns.
* **Interactive SVG Charts**: Dynamic Donut chart for category expenditures and Bar chart for monthly cashflow comparison.
* **Transaction Ledger**: Add, edit, filter, search, and delete transactions with currency switcher ($, €, £, ₹, ¥, C$, A$).
* **Export & Persistence**: Download full CSV reports, print summaries, and persist data in `localStorage`.

### 6. 🧮 Daily Calculators
* **Loan & EMI Calculator**: Monthly payments, total interest, principal vs. interest donut chart, and collapsible amortization schedule.
* **Tip & Bill Splitter**: Calculate tip amounts (presets or custom slider), split tabs between multiple diners, round up totals, and copy shareable text summaries.
* **Age & Date Calculator**: Calculate exact age in years, months, days, and total hours; live countdown to next birthday; plus calendar days and business days between dates.
* **BMI & Calorie Health Calculator**: Metric and Imperial units, BMI category score with a visual gauge pointer, healthy weight range, BMR, and daily calorie maintenance/weight-loss targets.
* **Discount & Sales Tax Calculator**: Compute sale prices with stacked coupon codes and regional sales tax.

### 7. 🛠️ Productivity Suite
* **Secure Password Generator**: Cryptographically strong random passwords (`window.crypto`), length slider (6–64 chars), character toggles, ambiguity filters, and live entropy strength meters.
* **Universal Unit Converter**: Bidirectional instant conversion across Length, Weight, Temperature, Speed, and Digital Storage.
* **Quick Notes & Scratchpad**: Auto-saved browser scratchpad with live word/character counters, reading time estimate, case formatting tools, and `.txt` file export.

---

## 💎 Free Tier & DailyMate Pro Model

DailyMate is designed with a realistic modern utility business model:
* **Free Tier (Ad-Supported)**: Fully functional with non-intrusive, tasteful sponsor ad placeholders labeled "Sponsored Ad" and a "Remove Ads with Pro" link.
* **DailyMate Pro (Interactive Demo)**:
  * Click **"Upgrade to Pro"** in the top navigation or banner.
  * Click **"Activate Pro Free Demo"** to instantly test the Pro experience.
  * All ads vanish dynamically, a sparkling **"★ PRO ACTIVE"** badge illuminates the navbar, and batch processing perks unlock.
  * Toggle between Free and Pro tiers at any time to preview both modes.

---

## 🚀 How to Run

Because DailyMate is built with pure standard web technologies, **no build step, npm, or server is required**:

1. **Directly in your browser**: Double-click `index.html` or drag it into any web browser (Chrome, Edge, Firefox, Safari).
2. **Via local server** (optional):
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

---

## 📁 Project Architecture

```
dailyy use web/
├── index.html                  # Single-Page Application (SPA) structure & views
├── README.md                   # Documentation and user guide
├── css/
│   ├── style.css               # Design system, CSS variables, dark/light themes, hero, ads, modals
│   ├── tools.css               # Tool workspaces, sliders, visual charts, tables, previews
│   └── responsive.css          # Mobile navigation drawer & responsive breakpoints
├── js/
│   ├── app.js                  # Main controller: routing, search, favorites, theme, ads, Pro modal
│   ├── lib/
│   │   ├── qrcode.min.js       # Standalone pure JS QR code generator (Canvas & SVG)
│   │   └── simple-pdf.js       # Client-side PDF-1.4 document builder
│   └── tools/
│       ├── qr-generator.js     # QR code generation, styling, center logos, and scanner
│       ├── image-tools.js      # Image compressor, resizer, and filter & watermark studio
│       ├── pdf-tools.js        # Multi-page Images-to-PDF compiler
│       ├── budget-planner.js   # 50/30/20 budget planner, SVG charts, and CSV export
│       ├── calculators.js      # Loan EMI, Tip Splitter, Age/Date, BMI, and Discount calculators
│       └── productivity.js     # Secure password generator, unit converter, and scratchpad
```

---

## 🔒 Privacy Guarantee

* **100% Client-Side**: No photos, documents, receipts, or financial data ever leave your computer.
* **Zero Analytics / Tracking**: Your privacy is respected by default.
* **Offline Ready**: Functions completely without an internet connection.
