/**
 * DailyMate - Images to PDF Tools
 */
const PDFTools = (function () {
    let imagePages = []; // Array of { id, file, name, dataUrl, width, height }

    function init() {
        bindEvents();
    }

    function bindEvents() {
        const dropZone = document.getElementById('pdf-dropzone');
        const fileInput = document.getElementById('pdf-file-input');

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
                    addFiles(e.dataTransfer.files);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    addFiles(e.target.files);
                    fileInput.value = '';
                }
            });
        }

        // Add more images button
        const addMoreBtn = document.getElementById('pdf-add-more-btn');
        if (addMoreBtn && fileInput) {
            addMoreBtn.addEventListener('click', () => fileInput.click());
        }

        // Clear all button
        const clearAllBtn = document.getElementById('pdf-clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', clearAllPages);
        }

        // Generate PDF button
        const generateBtn = document.getElementById('pdf-generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', generatePDF);
        }
    }

    function addFiles(fileList) {
        const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) {
            App.showToast("Please select valid image files (JPG, PNG, WebP)", "error");
            return;
        }

        // Non-pro limit check
        const isPro = App.isProActive();
        if (!isPro && imagePages.length + validFiles.length > 10) {
            App.showToast("Free tier is limited to 10 images per PDF. Unlock Pro for unlimited!", "warning");
        }

        let loadedCount = 0;
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = function (evt) {
                const img = new Image();
                img.onload = function () {
                    // Create JPEG canvas representation for PDF embedding
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.90);

                    imagePages.push({
                        id: 'page_' + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        size: file.size,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        dataUrl: jpegDataUrl,
                        thumbUrl: evt.target.result
                    });

                    loadedCount++;
                    if (loadedCount === validFiles.length) {
                        renderPageList();
                        App.showToast(`Added ${loadedCount} page${loadedCount > 1 ? 's' : ''}!`, "success");
                    }
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function renderPageList() {
        const listEl = document.getElementById('pdf-pages-list');
        const workspaceEl = document.getElementById('pdf-workspace');
        const emptyEl = document.getElementById('pdf-dropzone');
        const pageCountEl = document.getElementById('pdf-page-count');

        if (!listEl) return;

        if (imagePages.length === 0) {
            workspaceEl.classList.add('hidden');
            emptyEl.classList.remove('compact');
            return;
        }

        workspaceEl.classList.remove('hidden');
        emptyEl.classList.add('compact');
        if (pageCountEl) {
            pageCountEl.textContent = `${imagePages.length} Page${imagePages.length > 1 ? 's' : ''}`;
        }

        listEl.innerHTML = '';
        imagePages.forEach((page, index) => {
            const item = document.createElement('div');
            item.className = 'pdf-page-card';
            item.innerHTML = `
                <div class="pdf-page-badge">Page ${index + 1}</div>
                <div class="pdf-page-thumb-wrapper">
                    <img src="${page.thumbUrl}" alt="Page ${index + 1}" class="pdf-page-thumb" />
                </div>
                <div class="pdf-page-meta">
                    <span class="pdf-page-name" title="${page.name}">${page.name}</span>
                    <span class="pdf-page-dim">${page.width} × ${page.height}</span>
                </div>
                <div class="pdf-page-actions">
                    <button class="btn-icon" data-action="up" data-index="${index}" title="Move page up" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-icon" data-action="down" data-index="${index}" title="Move page down" ${index === imagePages.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-icon btn-danger" data-action="delete" data-index="${index}" title="Remove page">✕</button>
                </div>
            `;
            listEl.appendChild(item);
        });

        // Bind reorder & remove actions
        listEl.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const idx = parseInt(btn.dataset.index, 10);
                if (action === 'up' && idx > 0) {
                    const temp = imagePages[idx];
                    imagePages[idx] = imagePages[idx - 1];
                    imagePages[idx - 1] = temp;
                    renderPageList();
                } else if (action === 'down' && idx < imagePages.length - 1) {
                    const temp = imagePages[idx];
                    imagePages[idx] = imagePages[idx + 1];
                    imagePages[idx + 1] = temp;
                    renderPageList();
                } else if (action === 'delete') {
                    imagePages.splice(idx, 1);
                    renderPageList();
                    App.showToast("Page removed", "info");
                }
            });
        });
    }

    function clearAllPages() {
        if (imagePages.length === 0) return;
        if (confirm("Remove all uploaded pages?")) {
            imagePages = [];
            renderPageList();
            App.showToast("Cleared all pages", "info");
        }
    }

    async function generatePDF() {
        if (imagePages.length === 0) {
            App.showToast("Please add at least one image first", "error");
            return;
        }

        const btn = document.getElementById('pdf-generate-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="spinner"></span> Generating PDF...`;
        btn.disabled = true;

        try {
            const pageSize = document.getElementById('pdf-page-size')?.value || 'a4';
            const orientation = document.getElementById('pdf-orientation')?.value || 'portrait';
            const marginVal = parseInt(document.getElementById('pdf-margin')?.value || '20', 10);

            const pdf = new SimplePDF({
                pageSize: pageSize,
                orientation: orientation,
                margin: marginVal,
                title: 'DailyMate Document'
            });

            imagePages.forEach(page => {
                pdf.addImagePage({
                    dataUrl: page.dataUrl,
                    width: page.width,
                    height: page.height
                }, {
                    pageSize: pageSize,
                    orientation: orientation,
                    margin: marginVal
                });
            });

            const blob = await pdf.buildBlob();
            const filename = `dailymate-document-${Date.now()}.pdf`;
            SimplePDF.downloadBlob(blob, filename);

            App.showToast(`PDF created with ${imagePages.length} pages!`, "success");
        } catch (err) {
            console.error("PDF creation failed:", err);
            App.showToast(`Error creating PDF: ${err.message}`, "error");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    return {
        init,
        addFiles,
        generatePDF
    };
})();
