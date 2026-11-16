/**
 * DailyMate - QR Code Generator & Scanner Tool
 */
const QRTool = (function () {
    let qrInstance = null;
    let currentLogoImg = null;

    function init() {
        bindEvents();
        generateQR();
    }

    function bindEvents() {
        // Tab switching (URL, Text, WiFi, Contact, Email, Phone)
        const typeTabs = document.querySelectorAll('.qr-type-btn');
        typeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                typeTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const type = tab.dataset.type;
                switchQRType(type);
            });
        });

        // Input changes trigger regeneration
        const inputs = document.querySelectorAll('#qr-inputs input, #qr-inputs textarea, #qr-inputs select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(generateQR, 200));
            input.addEventListener('change', generateQR);
        });

        // Styling controls
        const fgColor = document.getElementById('qr-fg-color');
        const bgColor = document.getElementById('qr-bg-color');
        const sizeRange = document.getElementById('qr-size');
        const marginRange = document.getElementById('qr-margin');
        const ecLevel = document.getElementById('qr-ec-level');
        const logoSelect = document.getElementById('qr-logo-preset');
        const logoUpload = document.getElementById('qr-logo-upload');

        if (fgColor) fgColor.addEventListener('input', (e) => {
            document.getElementById('qr-fg-hex').value = e.target.value;
            generateQR();
        });
        if (bgColor) bgColor.addEventListener('input', (e) => {
            document.getElementById('qr-bg-hex').value = e.target.value;
            generateQR();
        });
        if (document.getElementById('qr-fg-hex')) {
            document.getElementById('qr-fg-hex').addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    fgColor.value = e.target.value;
                    generateQR();
                }
            });
        }
        if (document.getElementById('qr-bg-hex')) {
            document.getElementById('qr-bg-hex').addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    bgColor.value = e.target.value;
                    generateQR();
                }
            });
        }

        if (sizeRange) sizeRange.addEventListener('input', (e) => {
            document.getElementById('qr-size-val').textContent = `${e.target.value}px`;
            generateQR();
        });

        if (marginRange) marginRange.addEventListener('input', (e) => {
            document.getElementById('qr-margin-val').textContent = e.target.value;
            generateQR();
        });

        if (ecLevel) ecLevel.addEventListener('change', generateQR);

        // Logo preset or upload
        if (logoSelect) {
            logoSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'none') {
                    currentLogoImg = null;
                    generateQR();
                } else {
                    createPresetLogo(val, (img) => {
                        currentLogoImg = img;
                        generateQR();
                    });
                }
            });
        }

        if (logoUpload) {
            logoUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        const img = new Image();
                        img.onload = function () {
                            currentLogoImg = img;
                            if (logoSelect) logoSelect.value = 'custom';
                            generateQR();
                            App.showToast("Custom logo attached to QR code!", "success");
                        };
                        img.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Action buttons
        const btnPng = document.getElementById('qr-download-png');
        if (btnPng) btnPng.addEventListener('click', downloadPNG);

        const btnSvg = document.getElementById('qr-download-svg');
        if (btnSvg) btnSvg.addEventListener('click', downloadSVG);

        const btnCopy = document.getElementById('qr-copy-btn');
        if (btnCopy) btnCopy.addEventListener('click', copyToClipboard);

        // QR Scanner upload
        const qrScanFile = document.getElementById('qr-scan-file');
        if (qrScanFile) {
            qrScanFile.addEventListener('change', handleScanFile);
        }
    }

    function switchQRType(type) {
        document.querySelectorAll('.qr-field-group').forEach(group => {
            group.classList.add('hidden');
        });
        const target = document.getElementById(`qr-group-${type}`);
        if (target) target.classList.remove('hidden');
        generateQR();
    }

    function getFormattedText() {
        const activeTab = document.querySelector('.qr-type-btn.active');
        const type = activeTab ? activeTab.dataset.type : 'url';

        switch (type) {
            case 'url': {
                let url = document.getElementById('qr-input-url')?.value.trim() || 'https://dailymate.io';
                if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) {
                    url = 'https://' + url;
                }
                return url;
            }
            case 'text':
                return document.getElementById('qr-input-text')?.value.trim() || 'Welcome to DailyMate!';
            case 'wifi': {
                const ssid = document.getElementById('qr-wifi-ssid')?.value.trim() || 'MyHomeWiFi';
                const pass = document.getElementById('qr-wifi-pass')?.value || '';
                const auth = document.getElementById('qr-wifi-auth')?.value || 'WPA';
                const hidden = document.getElementById('qr-wifi-hidden')?.checked ? 'true' : 'false';
                // Standard WiFi QR format: WIFI:S:MySSID;T:WPA;P:MyPassword;H:false;;
                return `WIFI:S:${escapeWifi(ssid)};T:${auth};P:${escapeWifi(pass)};H:${hidden};;`;
            }
            case 'contact': {
                const name = document.getElementById('qr-vcard-name')?.value.trim() || 'Alex Doe';
                const phone = document.getElementById('qr-vcard-phone')?.value.trim() || '+1 555 0192';
                const email = document.getElementById('qr-vcard-email')?.value.trim() || 'alex@example.com';
                const org = document.getElementById('qr-vcard-org')?.value.trim() || 'DailyMate Inc';
                return `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nORG:${org}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
            }
            case 'email': {
                const to = document.getElementById('qr-email-to')?.value.trim() || 'contact@example.com';
                const subj = encodeURIComponent(document.getElementById('qr-email-subject')?.value.trim() || 'Hello');
                const body = encodeURIComponent(document.getElementById('qr-email-body')?.value.trim() || 'Sent via DailyMate');
                return `mailto:${to}?subject=${subj}&body=${body}`;
            }
            case 'phone': {
                const num = document.getElementById('qr-phone-number')?.value.trim() || '+15550192';
                return `tel:${num}`;
            }
            default:
                return 'https://dailymate.io';
        }
    }

    function escapeWifi(str) {
        return str.replace(/([\\;,:"])/g, '\\$1');
    }

    function generateQR() {
        const text = getFormattedText();
        const container = document.getElementById('qr-code-render');
        if (!container) return;

        const fgColor = document.getElementById('qr-fg-color')?.value || '#0f172a';
        const bgColor = document.getElementById('qr-bg-color')?.value || '#ffffff';
        const size = parseInt(document.getElementById('qr-size')?.value || '280', 10);
        const margin = parseInt(document.getElementById('qr-margin')?.value || '3', 10);
        const ecStr = document.getElementById('qr-ec-level')?.value || 'H';

        let correctLevel = QRCode.CorrectLevel.H;
        if (ecStr === 'L') correctLevel = QRCode.CorrectLevel.L;
        if (ecStr === 'M') correctLevel = QRCode.CorrectLevel.M;
        if (ecStr === 'Q') correctLevel = QRCode.CorrectLevel.Q;

        container.innerHTML = '';

        try {
            qrInstance = new QRCode(container, {
                text: text,
                width: size,
                height: size,
                colorDark: fgColor,
                colorLight: bgColor,
                margin: margin,
                correctLevel: correctLevel
            });

            // If a logo is selected or uploaded, draw it in the center on top of the canvas
            if (currentLogoImg) {
                setTimeout(() => {
                    const canvas = container.querySelector('canvas');
                    if (canvas) {
                        overlayLogoOnCanvas(canvas, currentLogoImg, bgColor);
                    }
                }, 40);
            }

            // Update details
            const detailEl = document.getElementById('qr-payload-preview');
            if (detailEl) {
                detailEl.textContent = text.length > 70 ? text.substring(0, 70) + '...' : text;
                detailEl.title = text;
            }
        } catch (err) {
            console.error("QR Generation error:", err);
            container.innerHTML = `<div class="qr-error-msg">Payload too long or invalid parameters (${err.message}).</div>`;
        }
    }

    function overlayLogoOnCanvas(canvas, logoImg, bgColor) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const logoSize = Math.floor(size * 0.22); // 22% of QR size for high scannability
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;
        const radius = Math.floor(logoSize * 0.2);

        // Draw background badge pill
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, x - 4, y - 4, logoSize + 8, logoSize + 8, radius + 2);
        ctx.fillStyle = bgColor || '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 8;
        ctx.fill();

        // Clip rounded rectangle for logo
        ctx.beginPath();
        roundRect(ctx, x, y, logoSize, logoSize, radius);
        ctx.clip();
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();
    }

    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    function createPresetLogo(type, callback) {
        const c = document.createElement('canvas');
        c.width = 120;
        c.height = 120;
        const ctx = c.getContext('2d');

        // Draw styled icon
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(60, 60, 56, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let symbol = '🔗';
        if (type === 'wifi') {
            ctx.fillStyle = '#059669';
            ctx.beginPath(); ctx.arc(60, 60, 56, 0, Math.PI * 2); ctx.fill();
            symbol = '📶';
        } else if (type === 'heart') {
            ctx.fillStyle = '#e11d48';
            ctx.beginPath(); ctx.arc(60, 60, 56, 0, Math.PI * 2); ctx.fill();
            symbol = '♥';
        } else if (type === 'star') {
            ctx.fillStyle = '#d97706';
            ctx.beginPath(); ctx.arc(60, 60, 56, 0, Math.PI * 2); ctx.fill();
            symbol = '★';
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillText(symbol, 60, 64);

        const img = new Image();
        img.onload = () => callback(img);
        img.src = c.toDataURL();
    }

    function downloadPNG() {
        const canvas = document.querySelector('#qr-code-render canvas');
        if (!canvas) {
            App.showToast("Please generate a QR code first", "error");
            return;
        }
        const link = document.createElement('a');
        link.download = `dailymate-qr-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        App.showToast("QR Code downloaded as PNG!", "success");
    }

    function downloadSVG() {
        if (!qrInstance) {
            App.showToast("Please generate a QR code first", "error");
            return;
        }
        const svgString = qrInstance.getSVG();
        if (!svgString) {
            App.showToast("Failed to render SVG", "error");
            return;
        }
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `dailymate-qr-${Date.now()}.svg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        App.showToast("QR Code downloaded as vector SVG!", "success");
    }

    async function copyToClipboard() {
        const canvas = document.querySelector('#qr-code-render canvas');
        if (!canvas) return;

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("Could not create blob");
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                App.showToast("QR Code copied to clipboard!", "success");
            });
        } catch (err) {
            console.warn("ClipboardItem write failed, fallback to data url", err);
            // Fallback: copy payload text
            const text = getFormattedText();
            navigator.clipboard.writeText(text);
            App.showToast("QR content copied to clipboard!", "info");
        }
    }

    function handleScanFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                const resBox = document.getElementById('qr-scan-result');
                const resText = document.getElementById('qr-scan-text');
                resBox.classList.remove('hidden');

                // Inspect image metadata and inform user
                resText.innerHTML = `<strong>Image loaded:</strong> ${file.name} (${img.width}x${img.height}px)<br>` +
                    `<span class="text-muted">Client-side instant preview: Ready for decoding.</span>`;
                App.showToast("QR image loaded successfully!", "success");
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    return {
        init,
        generateQR,
        downloadPNG,
        downloadSVG,
        copyToClipboard
    };
})();
