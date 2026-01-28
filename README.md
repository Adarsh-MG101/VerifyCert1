# VerifyCert

A document generation and verification system.

## Setup

1. **Backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Runs on http://localhost:5000

2. **Frontend**:
   ```bash
   cd client
   npm run dev
   ```
   Runs on http://localhost:3000

## Usage Guide

1. **Dashboard** (Admin/Org): Go to `http://localhost:3000/dashboard`
   - **Templates**: Upload a `.docx` file with placeholders like `{{name}}`, `{{course}}`.
   - **Generate**: Select a template, fill the form, and generate a PDF.
   
2. **Verification** (Public):
   - Scan the QR code on the PDF.
   - Or go to `http://localhost:3000` and enter the Document ID.

## Features
- Template Management (DOCX)
- Automated PDF Generation with QR Code
- Public Verification Page
- Premium Glassmorphism UI
