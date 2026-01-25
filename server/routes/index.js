const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createReport = require('docx-templates').default;
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const crypto = require('crypto');
const mammoth = require('mammoth');
const { exec } = require('child_process');
const csv = require('csv-parser');
const archiver = require('archiver');

const Template = require('../models/Template');
const Document = require('../models/Document');
const Organization = require('../models/Organization');
const auth = require('../middleware/auth');

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Helper: Extract Placeholders
async function extractPlaceholders(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    const regex = /\{\{(.*?)\}\}/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
        const placeholder = match[1].trim();
        if (placeholder !== 'certificate_id' && placeholder !== 'qr_code') {
            matches.add(placeholder);
        }
    }
    return Array.from(matches);
}

// Helper: Generate Template Preview Thumbnail
async function generateThumbnail(docxPath, outputId) {
    const tempPdfName = path.basename(docxPath, '.docx') + '.pdf';
    const tempPdfPath = path.join(path.dirname(docxPath), tempPdfName);
    const pngPath = path.join(path.dirname(docxPath), `${outputId}.png`);

    // 1. Docx to PDF using LibreOffice
    const possiblePaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
    ];
    let sofficePath = possiblePaths.find(p => fs.existsSync(p)) || 'soffice';
    const outputDir = path.dirname(docxPath);
    const cmd = `"${sofficePath}" --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`;

    await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) resolve(stdout); // LibreOffice often sends "info" to stderr
            else resolve(stdout);
        });
    });

    if (!fs.existsSync(tempPdfPath)) {
        throw new Error('PDF conversion failed, cannot generate thumbnail.');
    }

    // 2. PDF to PNG using Puppeteer
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--hide-scrollbars',
            '--force-device-scale-factor=2' // Higher quality
        ]
    });

    try {
        const page = await browser.newPage();

        // Certificates are usually Landscape A4 (297x210mm)
        // We set a high-res landscape viewport
        await page.setViewport({ width: 1280, height: 905 });

        const absolutePdfPath = path.resolve(tempPdfPath);
        // toolbar=0, navpanes=0, scrollbar=0 and view=Fit to clean up the Chrome PDF viewer
        const pdfUrl = `file:///${absolutePdfPath.replace(/\\/g, '/')}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;

        await page.goto(pdfUrl, { waitUntil: 'networkidle0' });

        // Stabilization delay for the PDF viewer to center and scale the content
        await new Promise(r => setTimeout(r, 1500));

        await page.screenshot({
            path: pngPath,
            omitBackground: true
        });
    } finally {
        await browser.close();
        // Cleanup temp PDF
        if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath);
        }
    }

    return `uploads/${outputId}.png`;
}

// 1. Upload Template (Protected)
router.post('/templates', auth, upload.single('file'), async (req, res) => {
    let thumbnailPath = null;
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const templateName = req.body.name || req.file.originalname;
        const existingTemplate = await Template.findOne({ name: templateName });

        if (existingTemplate) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: `A template with the name "${templateName}" already exists.` });
        }

        const placeholders = await extractPlaceholders(req.file.path);

        if (placeholders.length === 0) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid Template: Must contain at least one dynamic placeholder (e.g. {{name}}).' });
        }

        // Generate Thumbnail
        const outputId = Date.now() + '-preview';
        thumbnailPath = await generateThumbnail(req.file.path, outputId);

        const template = new Template({
            name: templateName,
            filePath: req.file.path,
            thumbnailPath: thumbnailPath,
            placeholders: placeholders
        });

        await template.save();
        res.json(template);
    } catch (err) {
        console.error('Template Upload Error:', err);
        // Cleanup if something failed
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (thumbnailPath) {
            const absoluteThumbnailPath = path.join(__dirname, '..', thumbnailPath);
            if (fs.existsSync(absoluteThumbnailPath)) fs.unlinkSync(absoluteThumbnailPath);
        }
        res.status(500).json({ error: err.message });
    }
});

// 2. List Templates (Protected)
router.get('/templates', auth, async (req, res) => {
    try {
        const templates = await Template.find();
        res.json(templates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.5 Delete Template (Protected)
router.delete('/templates/:id', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });

        // Delete the file
        if (fs.existsSync(template.filePath)) {
            fs.unlinkSync(template.filePath);
        }

        // Delete the thumbnail
        if (template.thumbnailPath) {
            const absThumbnailPath = path.join(__dirname, '..', template.thumbnailPath);
            if (fs.existsSync(absThumbnailPath)) {
                fs.unlinkSync(absThumbnailPath);
            }
        }

        // Delete from database
        await Template.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.6 Get Stats (Protected)
router.get('/stats', auth, async (req, res) => {
    try {
        const totalTemplates = await Template.countDocuments();
        const totalDocuments = await Document.countDocuments();

        res.json({
            totalTemplates,
            documentsIssued: totalDocuments,
            pendingVerifications: 0 // Placeholder for future feature
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Generate Document (Protected)
// 3. Generate Document (Protected)
// 3. Generate Document (Protected)
router.post('/generate', auth, async (req, res) => {
    try {
        const { templateId, data, qrX, qrY } = req.body; // Extract user coordinates
        const template = await Template.findById(templateId);
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const uniqueId = crypto.randomUUID();

        // Generate QR Code
        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${uniqueId}`;
        const qrCodeBuffer = await QRCode.toBuffer(verificationUrl);

        // Prepare Data
        // We set qr_code to empty string so the {{qr_code}} tag is removed from the DOCX text
        const finalData = {
            certificate_id: uniqueId,
            qr_code: "",
            ...data
        };

        // Load template file
        const templateBuffer = fs.readFileSync(template.filePath);

        // 1. Fill the DOCX Template (Text only)
        let outputBuffer;
        try {
            outputBuffer = await createReport({
                template: templateBuffer,
                data: finalData,
                cmdDelimiter: ['{{', '}}']
            });
        } catch (error) {
            console.error('❌ Template filling error:', error.message);
            return res.status(400).json({
                error: 'Template formatting issue',
                details: error.message
            });
        }

        // 2. Save Filled Data to Temp DOCX path
        const tempDocxPath = path.join(__dirname, `../uploads/${uniqueId}.docx`);
        fs.writeFileSync(tempDocxPath, outputBuffer);

        // 3. Convert DOCX to PDF using LibreOffice
        const pdfFilename = `uploads/${uniqueId}.pdf`;
        const absolutePdfPath = path.join(__dirname, `../${pdfFilename}`);

        try {
            // Path to LibreOffice
            const possiblePaths = [
                'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
            ];
            let sofficePath = possiblePaths.find(p => fs.existsSync(p));
            if (!sofficePath) sofficePath = 'soffice';

            const outputDir = path.dirname(absolutePdfPath);
            const cmd = `"${sofficePath}" --headless --convert-to pdf --outdir "${outputDir}" "${tempDocxPath}"`;

            await new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) reject(new Error(stderr || error.message));
                    else resolve(stdout);
                });
            });

            if (!fs.existsSync(absolutePdfPath)) {
                throw new Error('PDF file was not created by LibreOffice.');
            }

            // Cleanup temp docx
            fs.unlinkSync(tempDocxPath);

            // ---------------------------------------------------------
            // 4. Post-Process: Add QR Code to the PDF
            // ---------------------------------------------------------
            const { PDFDocument } = require('pdf-lib');

            // Read the generated PDF
            const pdfBytes = fs.readFileSync(absolutePdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            // Embed the QR Code image
            const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

            // Get the first page
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();

            // Draw the QR Code using user coordinates or default to bottom-left (50, 50)
            const qrDims = 100; // 100x100 pixels
            firstPage.drawImage(qrImage, {
                x: qrX ? parseInt(qrX) : 50,
                y: qrY ? parseInt(qrY) : 50,
                width: qrDims,
                height: qrDims,
            });

            // Save the modified PDF back to the file
            const modifiedPdfBytes = await pdfDoc.save();
            fs.writeFileSync(absolutePdfPath, modifiedPdfBytes);

        } catch (pdfErr) {
            console.error('❌ PDF Processing Error:', pdfErr);
            return res.status(500).json({
                error: 'PDF conversion or QR embedding failed.',
                details: pdfErr.message
            });
        }

        // 5. Save Document Record
        const newDoc = new Document({
            uniqueId,
            data: finalData,
            filePath: pdfFilename,
            template: template._id
        });
        await newDoc.save();

        res.json({ success: true, document: newDoc, downloadUrl: `/${pdfFilename}` });

    } catch (err) {
        console.error('❌ Generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Verify Document
router.get('/verify/:id', async (req, res) => {
    try {
        const doc = await Document.findOne({ uniqueId: req.params.id }).populate('template');
        if (!doc) return res.status(404).json({ valid: false, message: 'Document not found' });

        res.json({
            valid: true,
            data: doc.data,
            templateName: doc.template.name,
            issuedAt: doc.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Bulk Generate from CSV (Protected)
router.post('/generate-bulk', auth, upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

        const { templateId, qrX, qrY } = req.body;
        const template = await Template.findById(templateId);
        if (!template) return res.status(404).json({ error: 'Template not found' });

        // Parse CSV
        const csvData = [];
        const csvPath = req.file.path;

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => csvData.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        if (csvData.length === 0) {
            fs.unlinkSync(csvPath);
            return res.status(400).json({ error: 'CSV file is empty' });
        }

        // Create a unique folder for this batch
        const batchId = crypto.randomUUID();
        const batchFolder = path.join(__dirname, `../uploads/batch_${batchId}`);
        fs.mkdirSync(batchFolder, { recursive: true });

        const generatedDocs = [];
        const errors = [];

        // Generate PDF for each row
        for (let i = 0; i < csvData.length; i++) {
            const rowData = csvData[i];
            const rowNumber = i + 2; // i is 0-indexed, skip header row (+1), so actual row is i+2

            // Validation: Check if all required placeholders have values in this row
            const missingValues = template.placeholders.filter(p => !rowData[p] || rowData[p].trim() === "");

            if (missingValues.length > 0) {
                errors.push({
                    row: rowNumber,
                    error: `Missing values for required field(s): ${missingValues.join(', ')}`,
                    data: rowData
                });
                continue; // Skip this row and move to the next
            }

            const uniqueId = crypto.randomUUID();
            try {
                // Generate QR Code
                const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${uniqueId}`;
                const qrCodeBuffer = await QRCode.toBuffer(verificationUrl);

                // Prepare data
                const finalData = {
                    certificate_id: uniqueId,
                    qr_code: "",
                    ...rowData
                };

                // Load template
                const templateBuffer = fs.readFileSync(template.filePath);

                // Fill DOCX
                const outputBuffer = await createReport({
                    template: templateBuffer,
                    data: finalData,
                    cmdDelimiter: ['{{', '}}']
                });

                // Save temp DOCX
                const tempDocxPath = path.join(batchFolder, `${uniqueId}.docx`);
                fs.writeFileSync(tempDocxPath, outputBuffer);

                // Convert to PDF
                const pdfPath = path.join(batchFolder, `${uniqueId}.pdf`);

                const possiblePaths = [
                    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
                ];
                let sofficePath = possiblePaths.find(p => fs.existsSync(p));
                if (!sofficePath) sofficePath = 'soffice';

                const cmd = `"${sofficePath}" --headless --convert-to pdf --outdir "${batchFolder}" "${tempDocxPath}"`;

                await new Promise((resolve, reject) => {
                    exec(cmd, (error, stdout, stderr) => {
                        if (error) reject(new Error(stderr || error.message));
                        else resolve(stdout);
                    });
                });

                if (!fs.existsSync(pdfPath)) {
                    throw new Error('PDF file was not created');
                }

                // Delete temp DOCX
                fs.unlinkSync(tempDocxPath);

                // Add QR Code to PDF
                const { PDFDocument } = require('pdf-lib');
                const pdfBytes = fs.readFileSync(pdfPath);
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
                const pages = pdfDoc.getPages();
                const firstPage = pages[0];

                const qrDims = 100;
                firstPage.drawImage(qrImage, {
                    x: qrX ? parseInt(qrX) : 50,
                    y: qrY ? parseInt(qrY) : 50,
                    width: qrDims,
                    height: qrDims,
                });

                const modifiedPdfBytes = await pdfDoc.save();
                fs.writeFileSync(pdfPath, modifiedPdfBytes);

                // Save to database
                const newDoc = new Document({
                    uniqueId,
                    data: finalData,
                    filePath: `uploads/batch_${batchId}/${uniqueId}.pdf`,
                    template: template._id
                });
                await newDoc.save();

                generatedDocs.push({
                    uniqueId,
                    filename: `${rowData.name || uniqueId}.pdf`,
                    path: pdfPath
                });

            } catch (err) {
                console.error(`Error generating PDF for row ${i + 1}:`, err);
                errors.push({ row: i + 1, error: err.message, data: rowData });
            }
        }

        // Delete CSV file
        fs.unlinkSync(csvPath);

        if (generatedDocs.length === 0) {
            // Clean up batch folder
            fs.rmSync(batchFolder, { recursive: true, force: true });
            return res.status(500).json({
                error: 'Failed to generate any PDFs',
                details: errors
            });
        }

        // Create ZIP file
        const zipPath = path.join(__dirname, `../uploads/batch_${batchId}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            // Clean up batch folder after zipping
            fs.rmSync(batchFolder, { recursive: true, force: true });

            res.json({
                success: true,
                totalRows: csvData.length,
                generated: generatedDocs.length,
                failed: errors.length,
                errors: errors,
                downloadUrl: `/uploads/batch_${batchId}.zip`,
                batchId: batchId
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        // Add all PDFs to ZIP
        generatedDocs.forEach(doc => {
            archive.file(doc.path, { name: doc.filename });
        });

        archive.finalize();

    } catch (err) {
        console.error('❌ Bulk generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
