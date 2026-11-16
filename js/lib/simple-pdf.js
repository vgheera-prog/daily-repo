/**
 * SimplePDF - Pure JavaScript Client-Side PDF Generator
 * Zero-dependency, lightweight, produces standard PDF-1.4 documents.
 * Perfect for multi-page Images-to-PDF, text reports, and printable documents.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.SimplePDF = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {

    function SimplePDF(options) {
        options = options || {};
        // Standard A4 dimensions in points (72 points = 1 inch, 28.35 points = 1 cm)
        // A4: 595.28 x 841.89
        // Letter: 612 x 792
        this.pageSize = options.pageSize || 'a4';
        this.orientation = options.orientation || 'portrait';
        this.margin = options.margin !== undefined ? options.margin : 20; // in points
        this.pages = [];
        this.title = options.title || 'DailyMate Document';
    }

    SimplePDF.PAGE_SIZES = {
        'a4': { width: 595.28, height: 841.89 },
        'letter': { width: 612, height: 792 },
        'legal': { width: 612, height: 1008 }
    };

    SimplePDF.prototype.getDimensions = function (size, orientation) {
        var base = SimplePDF.PAGE_SIZES[size.toLowerCase()] || SimplePDF.PAGE_SIZES['a4'];
        if (orientation === 'landscape') {
            return { width: Math.max(base.width, base.height), height: Math.min(base.width, base.height) };
        }
        return { width: Math.min(base.width, base.height), height: Math.max(base.width, base.height) };
    };

    /**
     * Add an image page
     * @param {string|HTMLImageElement|HTMLCanvasElement} imgInput - Image element, canvas, or data URL / object with { dataUrl, width, height }
     * @param {Object} [pageOpts] - Optional per-page override
     */
    SimplePDF.prototype.addImagePage = function (imgData, pageOpts) {
        pageOpts = pageOpts || {};
        var orient = pageOpts.orientation || this.orientation;
        var pSize = pageOpts.pageSize || this.pageSize;
        var margin = pageOpts.margin !== undefined ? pageOpts.margin : this.margin;

        this.pages.push({
            type: 'image',
            data: imgData,
            orientation: orient,
            pageSize: pSize,
            margin: margin,
            title: pageOpts.title || ''
        });
    };

    /**
     * Add a text page / report
     */
    SimplePDF.prototype.addTextPage = function (lines, pageOpts) {
        pageOpts = pageOpts || {};
        this.pages.push({
            type: 'text',
            lines: lines,
            orientation: pageOpts.orientation || this.orientation,
            pageSize: pageOpts.pageSize || this.pageSize,
            margin: pageOpts.margin !== undefined ? pageOpts.margin : 30,
            title: pageOpts.title || this.title
        });
    };

    /**
     * Convert data URL to binary Uint8Array
     */
    function dataURLToUint8(dataURL) {
        var parts = dataURL.split(',');
        var b64 = parts[1];
        var binaryStr = atob(b64);
        var len = binaryStr.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Build the PDF document bytes
     * Returns a Promise resolving to a Blob (application/pdf)
     */
    SimplePDF.prototype.buildBlob = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            try {
                if (self.pages.length === 0) {
                    throw new Error("No pages have been added to the PDF.");
                }

                var objects = [];
                var objOffsets = [];

                function addObj(content) {
                    var id = objects.length + 1;
                    objects.push(content);
                    return id;
                }

                // Placeholder for Catalog and Pages Tree
                var catalogId = 1;
                var pagesTreeId = 2;
                objects.push(null); // 1: Catalog
                objects.push(null); // 2: Pages Tree

                var pageObjectIds = [];

                // Process each page
                for (var i = 0; i < self.pages.length; i++) {
                    var page = self.pages[i];
                    var dim = self.getDimensions(page.pageSize, page.orientation);
                    var pWidth = dim.width;
                    var pHeight = dim.height;

                    if (page.type === 'image') {
                        // Extract image info
                        var imgObj = page.data;
                        var rawJpegBytes = null;
                        var imgW = 0;
                        var imgH = 0;

                        if (imgObj.jpegBytes) {
                            rawJpegBytes = imgObj.jpegBytes;
                            imgW = imgObj.width;
                            imgH = imgObj.height;
                        } else if (typeof imgObj.dataUrl === 'string') {
                            rawJpegBytes = dataURLToUint8(imgObj.dataUrl);
                            imgW = imgObj.width || 800;
                            imgH = imgObj.height || 600;
                        } else {
                            throw new Error("Unsupported image input format");
                        }

                        // Calculate scaled position to fit page margins while preserving aspect ratio
                        var availW = pWidth - (page.margin * 2);
                        var availH = pHeight - (page.margin * 2);
                        var imgAspect = imgW / imgH;
                        var availAspect = availW / availH;

                        var drawW, drawH, drawX, drawY;
                        if (imgAspect > availAspect) {
                            drawW = availW;
                            drawH = availW / imgAspect;
                        } else {
                            drawH = availH;
                            drawW = availH * imgAspect;
                        }
                        drawX = page.margin + (availW - drawW) / 2;
                        drawY = page.margin + (availH - drawH) / 2;

                        // Create Image XObject
                        var imgXObjId = addObj({
                            type: 'stream',
                            header: '<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH +
                                    ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + rawJpegBytes.length + ' >>',
                            bytes: rawJpegBytes
                        });

                        // Content stream for drawing image
                        var contentStr = 'q ' + drawW.toFixed(2) + ' 0 0 ' + drawH.toFixed(2) + ' ' + drawX.toFixed(2) + ' ' + drawY.toFixed(2) + ' cm /Im' + imgXObjId + ' Do Q';
                        var contentBytes = new TextEncoder().encode(contentStr);

                        var contentObjId = addObj({
                            type: 'stream',
                            header: '<< /Length ' + contentBytes.length + ' >>',
                            bytes: contentBytes
                        });

                        // Page object
                        var pageObjId = addObj({
                            type: 'text',
                            content: '<< /Type /Page /Parent ' + pagesTreeId + ' 0 R\n' +
                                     '   /MediaBox [0 0 ' + pWidth.toFixed(2) + ' ' + pHeight.toFixed(2) + ']\n' +
                                     '   /Resources << /XObject << /Im' + imgXObjId + ' ' + imgXObjId + ' 0 R >> >>\n' +
                                     '   /Contents ' + contentObjId + ' 0 R\n>>'
                        });
                        pageObjectIds.push(pageObjId);

                    } else if (page.type === 'text') {
                        // Standard built-in Helvetica text stream
                        var streamParts = ['BT', '/F1 12 Tf', '14.4 TL'];
                        var startX = page.margin;
                        var startY = pHeight - page.margin;
                        streamParts.push(startX + ' ' + startY + ' Td');

                        if (page.title) {
                            streamParts.push('/F1 18 Tf');
                            streamParts.push('(' + escapePdfText(page.title) + ') Tj');
                            streamParts.push('T*');
                            streamParts.push('/F1 11 Tf');
                            streamParts.push('T*');
                        }

                        for (var lineIdx = 0; lineIdx < page.lines.length; lineIdx++) {
                            var line = page.lines[lineIdx];
                            if (line === '') {
                                streamParts.push('T*');
                            } else {
                                streamParts.push('(' + escapePdfText(line) + ') Tj');
                                streamParts.push('T*');
                            }
                        }
                        streamParts.push('ET');

                        var textStreamStr = streamParts.join('\n');
                        var textStreamBytes = new TextEncoder().encode(textStreamStr);

                        var textContentId = addObj({
                            type: 'stream',
                            header: '<< /Length ' + textStreamBytes.length + ' >>',
                            bytes: textStreamBytes
                        });

                        // Standard font object
                        var fontId = addObj({
                            type: 'text',
                            content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
                        });

                        var textPageId = addObj({
                            type: 'text',
                            content: '<< /Type /Page /Parent ' + pagesTreeId + ' 0 R\n' +
                                     '   /MediaBox [0 0 ' + pWidth.toFixed(2) + ' ' + pHeight.toFixed(2) + ']\n' +
                                     '   /Resources << /Font << /F1 ' + fontId + ' 0 R >> >>\n' +
                                     '   /Contents ' + textContentId + ' 0 R\n>>'
                        });
                        pageObjectIds.push(textPageId);
                    }
                }

                // Now fill in Catalog (obj 1) and Pages (obj 2)
                objects[0] = {
                    type: 'text',
                    content: '<< /Type /Catalog /Pages ' + pagesTreeId + ' 0 R >>'
                };

                var kidsStr = pageObjectIds.map(function (id) { return id + ' 0 R'; }).join(' ');
                objects[1] = {
                    type: 'text',
                    content: '<< /Type /Pages /Kids [' + kidsStr + '] /Count ' + pageObjectIds.length + ' >>'
                };

                // Assemble binary PDF chunks
                var chunks = [];
                var encoder = new TextEncoder();
                var currentOffset = 0;

                function writeString(str) {
                    var b = encoder.encode(str);
                    chunks.push(b);
                    currentOffset += b.length;
                }

                function writeBytes(bytes) {
                    chunks.push(bytes);
                    currentOffset += bytes.length;
                }

                // 1. Header
                writeString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

                // 2. Objects
                for (var objIdx = 0; objIdx < objects.length; objIdx++) {
                    var objNum = objIdx + 1;
                    objOffsets[objNum] = currentOffset;

                    writeString(objNum + ' 0 obj\n');
                    var item = objects[objIdx];
                    if (item.type === 'text') {
                        writeString(item.content + '\nendobj\n');
                    } else if (item.type === 'stream') {
                        writeString(item.header + '\nstream\n');
                        writeBytes(item.bytes);
                        writeString('\nendstream\nendobj\n');
                    }
                }

                // 3. Cross-reference Table (xref)
                var startXref = currentOffset;
                writeString('xref\n0 ' + (objects.length + 1) + '\n');
                writeString('0000000000 65535 f \n');
                for (var x = 1; x <= objects.length; x++) {
                    var offStr = ('0000000000' + objOffsets[x]).slice(-10);
                    writeString(offStr + ' 00000 n \n');
                }

                // 4. Trailer
                writeString('trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + catalogId + ' 0 R >>\n');
                writeString('startxref\n' + startXref + '\n%%EOF\n');

                var blob = new Blob(chunks, { type: 'application/pdf' });
                resolve(blob);
            } catch (err) {
                reject(err);
            }
        });
    };

    function escapePdfText(text) {
        return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    }

    /**
     * Helper to download blob directly in browser
     */
    SimplePDF.downloadBlob = function (blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1500);
    };

    return SimplePDF;
}));
