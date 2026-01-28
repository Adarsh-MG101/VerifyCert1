# VerifyCert

VerifyCert is a premium document generation and verification system designed for organizations to issue tamper-proof certificates and documents. It features high-fidelity PDF generation from Word templates, public verification pages, and bulk processing capabilities.

## 🚀 Features

- **Premium UI**: Modern, high-conversion glassmorphism design with a dark theme.
- **Template Management**: Upload and manage Microsoft Word (.docx) templates with dynamic placeholders.
- **Automated Generation**: Real-time PDF generation with custom data injection and automated QR code placement.
- **Bulk Processing**: Generate hundreds of certificates at once by uploading a simple CSV file.
- **Instant Verification**: Public verification portal allowing anyone to scan a QR code or enter a Document ID to verify authenticity directly against the database.
- **Email Delivery**: Send generated certificates directly to recipients via email.
- **Secure Authentication**: Role-based access control (Admin/User) with secure password hashing and JWT sessions.

## 🛠 Technology Stack

- **Frontend**: Next.js 16 (React 19), Tailwind CSS v4, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **PDF Engine**: LibreOffice (headless) for perfect Word-to-PDF conversion.
- **Template Engine**: docx-templates for precise data mapping.
- **Tools**: Puppeteer (thumbnails), QRCode (generation), Nodemailer (email).

## 📁 Project Structure

- `/client`: Next.js frontend application.
- `/server`: Node.js/Express backend API.
- `/uploads`: Storage for templates and generated documents.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas)
- LibreOffice (Installed and added to your system PATH)

### 1. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
BASE_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=VerifyCert <your_email@gmail.com>
```
Start the server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
```
Create a `.env.local` file in the `client` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
Start the application:
```bash
npm run dev
```

---

## 📄 Template Creation Guide

To ensure your templates work perfectly without XML fragmentation errors, follow these steps:

### The Problem
Microsoft Word often splits placeholders like `{{name}}` across multiple hidden XML tags if you type them directly or edit them, which causes the template engine to fail.

### The Solution (The "Notepad" Method)
1. **Create in Notepad**: Open a plain text editor (Notepad, TextEdit).
2. **Type your placeholders**: Write your content with variables like `{{name}}`, `{{course}}`, `{{date}}`.
3. **Copy to Word**: Select all (Ctrl+A), Copy (Ctrl+C).
4. **Paste in Word**: In your certificate design, use "Keep Text Only" paste.
5. **Format**: Now you can change fonts, colors, and sizes safely.

### Available Placeholders
- `{{name}}`, `{{course}}`, `{{date}}`, etc. (User defined)
- `{{certificate_id}}`: Auto-injected unique ID (Case-sensitive).
- `{{qr}}`: Place an image in Word and set its **Alt Text** to `{{qr}}` for exact positioning.

---

## 📊 Bulk Generation Guide

Generate multiple certificates at once using a CSV file.

### CSV Structure
- **Headers**: Must exactly match the placeholder names in your template.
- **Data**: One recipient per row.

**Example CSV:**
```csv
name,course,date,grade
John Doe,Web Development,2024-01-15,A+
Jane Smith,Data Science,2024-01-15,A
```

### Steps
1. Navigate to **Generate Multiple** in the Dashboard.
2. Select your template.
3. Upload your CSV file.
4. Click **Generate All**.
5. Download the resulting **ZIP file** containing all individual PDFs.

---

## 🔍 Verification Process

Each document is assigned a `uniqueId`. Verification works by querying the database's `documents` collection:
1. **Public Search**: Go to the homepage and enter the Document ID.
2. **QR Scan**: Scanning the QR code on a certificate takes you directly to its public verification page.
3. **Data Integrity**: The values shown on the verification page come directly from the server, ensuring they haven't been tampered with in the PDF file.

---

## 📜 License
© 2026 VerifyCert Team. All Rights Reserved.
