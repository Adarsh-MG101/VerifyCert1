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
const nodemailer = require('nodemailer');

const Template = require('../models/Template');
const Document = require('../models/Document');
const Organization = require('../models/Organization');
const auth = require('../middleware/auth');
const PizZip = require('pizzip');

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
    // Match any placeholder, but normalize to uppercase for storage and UI
    const regex = /\{\{(.*?)\}\}/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
        const placeholder = match[1].trim().toUpperCase();
        if (placeholder !== 'CERTIFICATE_ID' && placeholder !== 'QR_CODE' && placeholder !== 'QR') {
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

router.post('/generate', auth, async (req, res) => {
    try {
        const { templateId, data } = req.body;
        const template = await Template.findById(templateId);
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const uniqueId = crypto.randomUUID();

        // Generate QR Code Buffer
        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${uniqueId}`;
        const qrCodeBuffer = await QRCode.toBuffer(verificationUrl);

        // Prepare Data with maximum redundancy
        console.error(`Attempting to generate certificate: ${uniqueId}`);
        // Prepare Data with maximum redundancy
        console.log(`--- Starting Generation for: ${uniqueId} ---`);
        // Prepare the QR Image Object directly (Avoids width: undefined errors)
        const qrImage = {
            width: 4,
            height: 4,
            data: qrCodeBuffer,
            extension: '.png'
        };

        // Normalize all user data to uppercase
        const normalizedData = {};
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'string') {
                normalizedData[key] = data[key].toUpperCase();
            } else {
                normalizedData[key] = data[key];
            }
        });

        const finalData = {
            ...normalizedData,
            CERTIFICATE_ID: uniqueId, // Main ID (keeps its casing)
            certificate_id: uniqueId,
            "Certificate ID": uniqueId,
            CERTIFICATEID: uniqueId,
            ID: uniqueId,
            QR: qrImage,
            QRCODE: qrImage
        };

        // --- SAFE CASING MAPPER: Map source template tags to uppercase data ---
        try {
            const docTextObj = await mammoth.extractRawText({ path: template.filePath });
            const docText = docTextObj.value;
            const tagRegex = /\{\{(.*?)\}\}/g;
            let m;
            while ((m = tagRegex.exec(docText)) !== null) {
                const rawTag = m[1].trim();
                const capsTag = rawTag.toUpperCase();

                // If it's an image command like {{IMAGE qr}}, map the data from finalData['QR']
                if (capsTag.startsWith('IMAGE ') && rawTag !== capsTag) {
                    const dataKey = capsTag.replace('IMAGE ', '');
                    if (finalData[dataKey]) {
                        finalData[rawTag] = finalData[dataKey];
                    }
                }

                // If template has e.g. {{certificate_id}} and we have it in finalData as CERTIFICATE_ID, clone it
                // BUT: We skip CERTIFICATE_ID if we want to preserve its original casing from the database
                const idTags = ['CERTIFICATE_ID', 'CERTIFICATE ID', 'CERTIFICATEID', 'ID', 'UNIQUE_ID', 'DOC_ID'];
                if (idTags.includes(capsTag)) {
                    finalData[rawTag] = uniqueId;
                } else if (finalData[capsTag] !== undefined && finalData[rawTag] === undefined) {
                    finalData[rawTag] = finalData[capsTag];
                }
            }


        } catch (e) {
            console.error('Casing mapper failed:', e);
        }




        // 1. NUCLEAR PRE-PROCESSOR: Bridge any and all XML fragmentation
        let templateBuffer = fs.readFileSync(template.filePath);
        try {
            const zip = new PizZip(templateBuffer);
            const xmlFiles = zip.file(/\.xml$/);

            // This regex matches {{QR}} even if every single character is in its own XML node/tag
            const nuclearQrRegex = /\{(<[^>]+>)*\{(<[^>]+>)*\s*[qQ](<[^>]+>)*[rR](<[^>]+>)*\s*\}(<[^>]+>)*\}/g;
            const nuclearQrCodeRegex = /\{(<[^>]+>)*\{(<[^>]+>)*\s*[qQ](<[^>]+>)*[rR](<[^>]+>)*[cC](<[^>]+>)*[oO](<[^>]+>)*[dD](<[^>]+>)*[eE](<[^>]+>)*\s*\}(<[^>]+>)*\}/g;



            let transformed = false;
            xmlFiles.forEach(file => {
                let content = file.asText();
                let docTransformed = false;

                if (nuclearQrRegex.test(content) || nuclearQrCodeRegex.test(content)) {
                    console.log(`📦 Nuclear scan found fragmented QR tag in ${file.name}, fixing...`);
                    content = content.replace(nuclearQrRegex, '{{IMAGE QR}}');
                    content = content.replace(nuclearQrCodeRegex, '{{IMAGE QR}}');
                    docTransformed = true;
                }


                if (docTransformed) {

                    zip.file(file.name, content);
                    transformed = true;
                }
            });


            if (transformed) {
                templateBuffer = zip.generate({ type: 'nodebuffer' });
            }
        } catch (e) {
            console.error('Nuclear pre-processing failed:', e);
        }

        // 2. Fill the DOCX Template with Image Support
        let outputBuffer;
        try {
            outputBuffer = await createReport({
                template: templateBuffer,
                data: finalData,
                cmdDelimiter: ['{{', '}}'],
                additionalJsContext: {
                    IMAGE: (data) => data
                }
            });
        } catch (error) {

            console.error('❌ Template filling error:', error.message);
            return res.status(400).json({
                error: 'Template formatting issue',
                details: error.message
            });
        }

        // Convert Filled DOCX to PDF using LibreOffice
        const pdfFilename = `uploads/${uniqueId}.pdf`;
        const absolutePdfPath = path.join(__dirname, `../${pdfFilename}`);
        const tempDocxPath = path.join(__dirname, `../uploads/${uniqueId}.docx`);

        // Save the generated DOCX first to convert it
        fs.writeFileSync(tempDocxPath, outputBuffer);

        try {
            const possiblePaths = [
                'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
            ];
            let sofficePath = possiblePaths.find(p => fs.existsSync(p)) || 'soffice';

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

        } catch (pdfErr) {
            console.error('❌ PDF Processing Error:', pdfErr);
            return res.status(500).json({
                error: 'PDF conversion failed.',
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
        // Case-insensitive search for the uniqueId
        const doc = await Document.findOne({
            uniqueId: { $regex: `^${req.params.id}$`, $options: 'i' }
        }).populate('template');

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

        const { templateId } = req.body;
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
                // Prepare data
                const qrImage = {
                    width: 4,
                    height: 4,
                    data: qrCodeBuffer,
                    extension: '.png'
                };

                // Normalize all row data to uppercase
                const normalizedRowData = {};
                Object.keys(rowData).forEach(key => {
                    if (typeof rowData[key] === 'string') {
                        normalizedRowData[key] = rowData[key].toUpperCase();
                    } else {
                        normalizedRowData[key] = rowData[key];
                    }
                });

                const finalData = {
                    ...normalizedRowData,
                    CERTIFICATE_ID: uniqueId,
                    certificate_id: uniqueId,
                    "Certificate ID": uniqueId,
                    CERTIFICATEID: uniqueId,
                    ID: uniqueId,
                    QR: qrImage,
                    QRCODE: qrImage
                };

                // --- SAFE CASING MAPPER FOR BULK ---
                try {
                    // Extract tags from raw text to avoid XML breakage
                    const docTextObj = await mammoth.extractRawText({ path: template.filePath });
                    const docText = docTextObj.value;
                    const tagRegex = /\{\{(.*?)\}\}/g;
                    let m;
                    while ((m = tagRegex.exec(docText)) !== null) {
                        const rawTag = m[1].trim();
                        const capsTag = rawTag.toUpperCase();

                        if (capsTag.startsWith('IMAGE ') && rawTag !== capsTag) {
                            const dataKey = capsTag.replace('IMAGE ', '');
                            if (finalData[dataKey]) {
                                finalData[rawTag] = finalData[dataKey];
                            }
                        }

                        const idTags = ['CERTIFICATE_ID', 'CERTIFICATE ID', 'CERTIFICATEID', 'ID', 'UNIQUE_ID', 'DOC_ID'];
                        if (idTags.includes(capsTag)) {
                            finalData[rawTag] = uniqueId;
                        } else if (finalData[capsTag] !== undefined && finalData[rawTag] === undefined) {
                            finalData[rawTag] = finalData[capsTag];
                        }
                    }


                } catch (e) {
                    console.error('Bulk casing mapper failed:', e);
                }




                // 1. NUCLEAR PRE-PROCESSOR FOR BULK
                let rowTemplateBuffer = fs.readFileSync(template.filePath);
                try {
                    const zip = new PizZip(rowTemplateBuffer);
                    const xmlFiles = zip.file(/\.xml$/);
                    const nuclearQrRegex = /\{(<[^>]+>)*\{(<[^>]+>)*\s*[qQ](<[^>]+>)*[rR](<[^>]+>)*\s*\}(<[^>]+>)*\}/g;
                    const nuclearQrCodeRegex = /\{(<[^>]+>)*\{(<[^>]+>)*\s*[qQ](<[^>]+>)*[rR](<[^>]+>)*[cC](<[^>]+>)*[oO](<[^>]+>)*[dD](<[^>]+>)*[eE](<[^>]+>)*\s*\}(<[^>]+>)*\}/g;



                    let transformed = false;
                    xmlFiles.forEach(file => {
                        let content = file.asText();
                        let docTransformed = false;

                        if (nuclearQrRegex.test(content) || nuclearQrCodeRegex.test(content)) {
                            content = content.replace(nuclearQrRegex, '{{IMAGE QR}}');
                            content = content.replace(nuclearQrCodeRegex, '{{IMAGE QR}}');
                            docTransformed = true;
                        }


                        if (docTransformed) {

                            zip.file(file.name, content);
                            transformed = true;
                        }
                    });

                    if (transformed) {
                        rowTemplateBuffer = zip.generate({ type: 'nodebuffer' });
                    }
                } catch (e) {
                    console.error('Row pre-processing failed:', e);
                }

                const outputBuffer = await createReport({
                    template: rowTemplateBuffer,
                    data: finalData,
                    cmdDelimiter: ['{{', '}}'],
                    additionalJsContext: {
                        IMAGE: (data) => data
                    }
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
                let sofficePath = possiblePaths.find(p => fs.existsSync(p)) || 'soffice';

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

// 6. Send Email with Certificate or ZIP
router.post('/send-email', auth, async (req, res) => {
    try {
        const { documentId, recipientEmail } = req.body;
        let absolutePath;
        let filename;
        let subject;

        if (documentId.startsWith('zip:')) {
            // Case: Bulk ZIP
            const relativePath = documentId.replace('zip:', '');
            absolutePath = path.join(__dirname, '..', relativePath);
            filename = 'certificates_batch.zip';
            subject = 'Your Bulk Certificates Batch';
        } else {
            // Case: Single Document
            const doc = await Document.findById(documentId).populate('template');
            if (!doc) return res.status(404).json({ error: 'Document not found' });
            absolutePath = path.join(__dirname, '..', doc.filePath);
            filename = `${doc.template.name}.pdf`;
            subject = `Your Certificate: ${doc.template.name}`;
        }

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Create Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: recipientEmail,
            subject: subject,
            text: `Hello,\n\nPlease find the requested file(s) attached.\n\nRegards,\nVerifyCert Team`,
            attachments: [
                {
                    filename: filename,
                    path: absolutePath
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully!' });

    } catch (err) {
        console.error('❌ Email sending error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2.7 Update Template Name (Protected)
router.put('/templates/:id', auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });

        // Check if another template already has this name
        const existingTemplate = await Template.findOne({ name, _id: { $ne: req.params.id } });
        if (existingTemplate) {
            return res.status(400).json({ error: 'A template with this name already exists' });
        }

        template.name = name;
        await template.save();
        res.json(template);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. List All Generated Documents (Protected)
router.get('/documents', auth, async (req, res) => {
    try {
        const { search, startDate, endDate, templateId } = req.query;
        let query = {};

        if (templateId) {
            query.template = templateId;
        }

        if (search) {
            // Search in uniqueId or common data fields
            // We convert the map to an array of objects for easier searching if it were an aggregation, 
            // but for now we search uniqueId and a few common fields
            query.$or = [
                { uniqueId: { $regex: search, $options: 'i' } },
                { 'data.NAME': { $regex: search, $options: 'i' } },
                { 'data.EMAIL': { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Document.countDocuments(query);
        const documents = await Document.find(query)
            .populate('template', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            documents,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


