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

// 1. Upload Template (Protected)
router.post('/templates', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const placeholders = await extractPlaceholders(req.file.path);

        const template = new Template({
            name: req.body.name || req.file.originalname,
            filePath: req.file.path,
            placeholders: placeholders
        });

        await template.save();
        res.json(template);
    } catch (err) {
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
router.post('/generate', auth, async (req, res) => {
    try {
        const { templateId, data } = req.body;
        const template = await Template.findById(templateId);
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const uniqueId = crypto.randomUUID();

        // Generate QR Code
        // Generate QR Code
        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${uniqueId}`;
        const qrCodeBuffer = await QRCode.toBuffer(verificationUrl);

        // Prepare Data
        // IMPORTANT: For docx-templates to treat this as an image, it needs { width, height, data, extension }
        // and 'data' should be a Buffer (or base64).
        const finalData = {
            certificate_id: uniqueId,
            qr_code: {
                width: 3,
                height: 3,
                data: qrCodeBuffer, // raw buffer
                extension: '.png'
            },
            ...data
        };

        // Load template file
        const templateBuffer = fs.readFileSync(template.filePath);

        // 1. Fill the DOCX Template
        let outputBuffer;
        try {
            outputBuffer = await createReport({
                template: templateBuffer,
                data: finalData,
                cmdDelimiter: ['{{', '}}'],
                // processLineBreaks: true, // typical option
                // noSandbox: true // sometimes helps
            });
            // (No temp file to clean up)
        } catch (error) {
            console.error('❌ Template filling error:', error.message);
            return res.status(400).json({
                error: 'Template formatting issue',
                details: error.message
            });
        }

        // 2. Save Filled Data to Temp DOCX path
        // We name it identical to the target PDF so conversion is straightforward
        const tempDocxPath = path.join(__dirname, `../uploads/${uniqueId}.docx`);
        fs.writeFileSync(tempDocxPath, outputBuffer);

        // 3. Convert DOCX to PDF using LibreOffice (Direct Command)
        // This avoids issues with libreoffice-convert wrapper on Windows
        const pdfPath = `uploads/${uniqueId}.pdf`;
        const absolutePdfPath = path.join(__dirname, `../${pdfPath}`);

        try {
            // Path to LibreOffice - Check common Windows paths
            const possiblePaths = [
                'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
            ];
            let sofficePath = possiblePaths.find(p => fs.existsSync(p));

            // Fallback: If not found in default paths, try using 'soffice' command (requires PATH)
            if (!sofficePath) {
                sofficePath = 'soffice';
            }

            const outputDir = path.dirname(absolutePdfPath);

            // Execute conversion
            // --headless: no GUI
            // --convert-to pdf: target format
            // --outdir: where to save
            const cmd = `"${sofficePath}" --headless --convert-to pdf --outdir "${outputDir}" "${tempDocxPath}"`;

            await new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(stderr || error.message));
                    } else {
                        resolve(stdout);
                    }
                });
            });

            // Verify output exists
            if (!fs.existsSync(absolutePdfPath)) {
                throw new Error('PDF file was not created by LibreOffice.');
            }

            // Cleanup temp docx
            fs.unlinkSync(tempDocxPath);

        } catch (pdfErr) {
            console.error('❌ PDF Conversion Error:', pdfErr);
            return res.status(500).json({
                error: 'PDF Conversion Failed.',
                details: pdfErr.message
            });
        }

        // 4. Save Document Record
        const newDoc = new Document({
            uniqueId,
            data: finalData,
            filePath: pdfPath,
            template: template._id
        });
        await newDoc.save();

        res.json({ success: true, document: newDoc, downloadUrl: `/uploads/${uniqueId}.pdf` });

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

module.exports = router;
