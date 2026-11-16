/**
 * DailyMate - Image Tools Suite (Compressor, Resizer, Converter & Filter Studio)
 */
const ImageTools = (function () {
    // Compressor State
    let originalFile = null;
    let originalImage = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let originalSize = 0;
    let compressedBlob = null;

    // Filter Studio State
    let studioImage = null;
    let studioOriginalSrc = null;
    let studioRotation = 0;
    let studioFlipH = false;
    let studioFlipV = false;

    function init() {
        bindCompressorEvents();
        bindStudioEvents();
    }

    // ==========================================
    // 1. IMAGE COMPRESSOR & RESIZER
    // ==========================================
    function bindCompressorEvents() {
        const dropZone = document.getElementById('compressor-dropzone');
        const fileInput = document.getElementById('compressor-file-input');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-active');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-active');
                if (e.dataTransfer.files.length > 0) {
                    handleCompressorFile(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleCompressorFile(e.target.files[0]);
                }
            });
        }

        // Quality slider
        const qualitySlider = document.getElementById('compress-quality');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                document.getElementById('compress-quality-val').textContent = `${e.target.value}%`;
                processCompression();
            });
        }

        // Dimension inputs
        const widthInput = document.getElementById('compress-width');
        const heightInput = document.getElementById('compress-height');
        const keepAspect = document.getElementById('compress-keep-aspect');

        if (widthInput && heightInput) {
            widthInput.addEventListener('input', () => {
                if (keepAspect && keepAspect.checked && originalWidth > 0) {
                    const w = parseInt(widthInput.value, 10);
                    if (!isNaN(w) && w > 0) {
                        const h = Math.round(w * (originalHeight / originalWidth));
                        heightInput.value = h;
                    }
                }
                debounce(processCompression, 250)();
            });

            heightInput.addEventListener('input', () => {
                if (keepAspect && keepAspect.checked && originalHeight > 0) {
                    const h = parseInt(heightInput.value, 10);
                    if (!isNaN(h) && h > 0) {
                        const w = Math.round(h * (originalWidth / originalHeight));
                        widthInput.value = w;
                    }
                }
                debounce(processCompression, 250)();
            });
        }

        // Scale preset buttons (25%, 50%, 75%, 100%)
        document.querySelectorAll('.scale-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scale = parseFloat(btn.dataset.scale);
                if (originalWidth > 0 && widthInput && heightInput) {
                    widthInput.value = Math.round(originalWidth * scale);
                    heightInput.value = Math.round(originalHeight * scale);
                    processCompression();
                }
            });
        });

        // Format dropdown
        const formatSelect = document.getElementById('compress-format');
        if (formatSelect) {
            formatSelect.addEventListener('change', processCompression);
        }

        // Download button
        const downloadBtn = document.getElementById('compress-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadCompressedImage);
        }

        // Pro batch compress demo button
        const batchBtn = document.getElementById('compress-batch-btn');
        if (batchBtn) {
            batchBtn.addEventListener('click', () => {
                if (!App.isProActive()) {
                    App.openProModal("Batch Image Compression is a Pro Feature!");
                } else {
                    App.showToast("Pro Feature Active: Multi-file batch compressor unlocked!", "success");
                    fileInput.setAttribute('multiple', 'true');
                    fileInput.click();
                }
            });
        }

        // Reset button
        const resetBtn = document.getElementById('compress-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetCompressor);
        }
    }

    function handleCompressorFile(file) {
        if (!file.type.startsWith('image/')) {
            App.showToast("Please upload a valid image file (JPG, PNG, WebP)", "error");
            return;
        }

        originalFile = file;
        originalSize = file.size;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                originalImage = img;
                originalWidth = img.naturalWidth;
                originalHeight = img.naturalHeight;

                // Update UI
                document.getElementById('compress-orig-size').textContent = formatFileSize(originalSize);
                document.getElementById('compress-orig-dim').textContent = `${originalWidth} × ${originalHeight} px`;
                document.getElementById('compress-width').value = originalWidth;
                document.getElementById('compress-height').value = originalHeight;

                const origPreview = document.getElementById('compress-orig-preview');
                if (origPreview) origPreview.src = evt.target.result;

                document.getElementById('compressor-workspace').classList.remove('hidden');
                document.getElementById('compressor-dropzone').classList.add('compact');

                processCompression();
                App.showToast("Image loaded successfully!", "info");
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }

    function processCompression() {
        if (!originalImage) return;

        const width = parseInt(document.getElementById('compress-width').value, 10) || originalWidth;
        const height = parseInt(document.getElementById('compress-height').value, 10) || originalHeight;
        const quality = parseInt(document.getElementById('compress-quality').value, 10) / 100;
        const format = document.getElementById('compress-format').value; // 'image/jpeg', 'image/png', 'image/webp'

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // If target is JPEG and original had transparency, fill white background
        if (format === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) return;
            compressedBlob = blob;
            const newSize = blob.size;
            const savedBytes = originalSize - newSize;
            const savedPercent = Math.max(0, Math.round((savedBytes / originalSize) * 100));

            // Update result display
            document.getElementById('compress-new-size').textContent = formatFileSize(newSize);
            document.getElementById('compress-new-dim').textContent = `${canvas.width} × ${canvas.height} px`;

            const badge = document.getElementById('compress-savings-badge');
            if (badge) {
                if (savedBytes > 0) {
                    badge.textContent = `Saved ${savedPercent}% (${formatFileSize(savedBytes)})`;
                    badge.className = 'badge badge-success';
                } else {
                    badge.textContent = `+${Math.abs(savedPercent)}% (Quality enhanced)`;
                    badge.className = 'badge badge-warning';
                }
            }

            const compPreview = document.getElementById('compress-new-preview');
            if (compPreview) {
                compPreview.src = URL.createObjectURL(blob);
            }
        }, format, quality);
    }

    function downloadCompressedImage() {
        if (!compressedBlob) {
            App.showToast("No compressed image ready to download", "error");
            return;
        }

        const format = document.getElementById('compress-format').value;
        let ext = 'jpg';
        if (format === 'image/png') ext = 'png';
        if (format === 'image/webp') ext = 'webp';

        const baseName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, "") : 'image';
        const filename = `${baseName}-dailymate.${ext}`;

        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);

        App.showToast(`Downloaded ${filename}!`, "success");
    }

    function resetCompressor() {
        originalFile = null;
        originalImage = null;
        compressedBlob = null;
        document.getElementById('compressor-workspace').classList.add('hidden');
        document.getElementById('compressor-dropzone').classList.remove('compact');
        document.getElementById('compressor-file-input').value = '';
    }

    // ==========================================
    // 2. IMAGE FILTERS & WATERMARK STUDIO
    // ==========================================
    function bindStudioEvents() {
        const studioDrop = document.getElementById('studio-dropzone');
        const studioInput = document.getElementById('studio-file-input');

        if (studioDrop && studioInput) {
            studioDrop.addEventListener('click', () => studioInput.click());
            studioDrop.addEventListener('dragover', (e) => {
                e.preventDefault();
                studioDrop.classList.add('drag-active');
            });
            studioDrop.addEventListener('dragleave', () => studioDrop.classList.remove('drag-active'));
            studioDrop.addEventListener('drop', (e) => {
                e.preventDefault();
                studioDrop.classList.remove('drag-active');
                if (e.dataTransfer.files.length > 0) {
                    handleStudioFile(e.dataTransfer.files[0]);
                }
            });

            studioInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleStudioFile(e.target.files[0]);
                }
            });
        }

        // Sliders
        const sliders = [
            'studio-brightness', 'studio-contrast', 'studio-saturation',
            'studio-grayscale', 'studio-sepia', 'studio-invert', 'studio-blur'
        ];
        sliders.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    const valEl = document.getElementById(`${id}-val`);
                    if (valEl) {
                        const unit = id === 'studio-blur' ? 'px' : '%';
                        valEl.textContent = `${e.target.value}${unit}`;
                    }
                    renderStudioCanvas();
                });
            }
        });

        // Rotate & Flip buttons
        const btnRotRight = document.getElementById('studio-rotate-right');
        if (btnRotRight) btnRotRight.addEventListener('click', () => {
            studioRotation = (studioRotation + 90) % 360;
            renderStudioCanvas();
        });

        const btnRotLeft = document.getElementById('studio-rotate-left');
        if (btnRotLeft) btnRotLeft.addEventListener('click', () => {
            studioRotation = (studioRotation - 90 + 360) % 360;
            renderStudioCanvas();
        });

        const btnFlipH = document.getElementById('studio-flip-h');
        if (btnFlipH) btnFlipH.addEventListener('click', () => {
            studioFlipH = !studioFlipH;
            renderStudioCanvas();
        });

        const btnFlipV = document.getElementById('studio-flip-v');
        if (btnFlipV) btnFlipV.addEventListener('click', () => {
            studioFlipV = !studioFlipV;
            renderStudioCanvas();
        });

        // Watermark controls
        const wmEnable = document.getElementById('studio-wm-enable');
        const wmInputs = ['studio-wm-text', 'studio-wm-size', 'studio-wm-color', 'studio-wm-opacity', 'studio-wm-pos'];
        if (wmEnable) {
            wmEnable.addEventListener('change', (e) => {
                document.getElementById('studio-wm-controls').classList.toggle('hidden', !e.target.checked);
                renderStudioCanvas();
            });
        }
        wmInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', renderStudioCanvas);
        });

        // Reset & Download
        const btnReset = document.getElementById('studio-reset-btn');
        if (btnReset) btnReset.addEventListener('click', resetStudioControls);

        const btnDownload = document.getElementById('studio-download-btn');
        if (btnDownload) btnDownload.addEventListener('click', downloadStudioImage);
    }

    function handleStudioFile(file) {
        if (!file.type.startsWith('image/')) {
            App.showToast("Please upload an image file", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                studioImage = img;
                studioOriginalSrc = evt.target.result;
                studioRotation = 0;
                studioFlipH = false;
                studioFlipV = false;

                document.getElementById('studio-workspace').classList.remove('hidden');
                document.getElementById('studio-dropzone').classList.add('compact');
                renderStudioCanvas();
                App.showToast("Image ready for editing!", "success");
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderStudioCanvas() {
        if (!studioImage) return;

        const canvas = document.getElementById('studio-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Dimensions accounting for 90 or 270 deg rotation
        const isSwapped = (studioRotation === 90 || studioRotation === 270);
        const naturalW = studioImage.naturalWidth;
        const naturalH = studioImage.naturalHeight;
        canvas.width = isSwapped ? naturalH : naturalW;
        canvas.height = isSwapped ? naturalW : naturalH;

        // Apply filters
        const b = document.getElementById('studio-brightness')?.value || 100;
        const c = document.getElementById('studio-contrast')?.value || 100;
        const s = document.getElementById('studio-saturation')?.value || 100;
        const g = document.getElementById('studio-grayscale')?.value || 0;
        const sep = document.getElementById('studio-sepia')?.value || 0;
        const inv = document.getElementById('studio-invert')?.value || 0;
        const blur = document.getElementById('studio-blur')?.value || 0;

        ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) sepia(${sep}%) invert(${inv}%) blur(${blur}px)`;

        // Coordinate transforms for rotation & flip
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((studioRotation * Math.PI) / 180);
        ctx.scale(studioFlipH ? -1 : 1, studioFlipV ? -1 : 1);
        ctx.drawImage(studioImage, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
        ctx.restore();

        // Render Watermark if enabled (without filter blur/invert)
        ctx.filter = 'none';
        const wmEnable = document.getElementById('studio-wm-enable')?.checked;
        if (wmEnable) {
            renderWatermark(ctx, canvas.width, canvas.height);
        }
    }

    function renderWatermark(ctx, width, height) {
        const text = document.getElementById('studio-wm-text')?.value || 'DailyMate';
        const size = parseInt(document.getElementById('studio-wm-size')?.value || '32', 10);
        const color = document.getElementById('studio-wm-color')?.value || '#ffffff';
        const opacity = parseFloat(document.getElementById('studio-wm-opacity')?.value || '0.7');
        const pos = document.getElementById('studio-wm-pos')?.value || 'center';

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.font = `bold ${size}px sans-serif`;
        ctx.textBaseline = 'middle';

        if (pos === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(text, width / 2, height / 2);
        } else if (pos === 'bottom-right') {
            ctx.textAlign = 'right';
            ctx.fillText(text, width - 24, height - 24);
        } else if (pos === 'top-left') {
            ctx.textAlign = 'left';
            ctx.fillText(text, 24, 24 + size / 2);
        } else if (pos === 'tile') {
            // Diagonal repeating tile
            ctx.textAlign = 'center';
            ctx.translate(width / 2, height / 2);
            ctx.rotate(-Math.PI / 6);
            ctx.translate(-width / 2, -height / 2);
            const stepX = size * text.length * 1.2;
            const stepY = size * 4;
            for (let y = -height; y < height * 2; y += stepY) {
                for (let x = -width; x < width * 2; x += stepX) {
                    ctx.fillText(text, x, y);
                }
            }
        }
        ctx.restore();
    }

    function resetStudioControls() {
        document.getElementById('studio-brightness').value = 100;
        document.getElementById('studio-brightness-val').textContent = '100%';
        document.getElementById('studio-contrast').value = 100;
        document.getElementById('studio-contrast-val').textContent = '100%';
        document.getElementById('studio-saturation').value = 100;
        document.getElementById('studio-saturation-val').textContent = '100%';
        document.getElementById('studio-grayscale').value = 0;
        document.getElementById('studio-grayscale-val').textContent = '0%';
        document.getElementById('studio-sepia').value = 0;
        document.getElementById('studio-sepia-val').textContent = '0%';
        document.getElementById('studio-invert').value = 0;
        document.getElementById('studio-invert-val').textContent = '0%';
        document.getElementById('studio-blur').value = 0;
        document.getElementById('studio-blur-val').textContent = '0px';

        studioRotation = 0;
        studioFlipH = false;
        studioFlipV = false;

        renderStudioCanvas();
        App.showToast("All filters reset to original", "info");
    }

    function downloadStudioImage() {
        const canvas = document.getElementById('studio-canvas');
        if (!canvas) return;

        const a = document.createElement('a');
        a.download = `dailymate-edit-${Date.now()}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        App.showToast("Enhanced image downloaded!", "success");
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        formatFileSize
    };
})();
