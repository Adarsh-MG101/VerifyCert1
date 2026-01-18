# How to Create a Working Template

## The Problem
Microsoft Word often splits placeholders like `{{name}}` across multiple XML tags, causing errors.

## Solution: Create Template in Notepad First

### Step 1: Create in Notepad
1. Open **Notepad** (not Word)
2. Type this exact text:

```
CERTIFICATE OF COMPLETION

This is to certify that {{name}} has successfully completed the {{course}} program at {{organization_name}}.

Duration: {{start_date}} to {{end_date}}
Issue Date: {{date}}

Certificate ID: {{certificate_id}}
```

3. Save as `certificate.txt` or any text

### Step 2: Copy to Word
1. Open Microsoft Word
2. **Select All** in Notepad (Ctrl+A) and **Copy** (Ctrl+C)
3. In Word, **Paste** (Ctrl+V) - Use "Keep Text Only" if prompted
4. Now you can format it (fonts, bold, center, etc.)
5. **Save As** → `certificate.docx`

### Step 3: Upload
Upload the `.docx` file in Dashboard → Templates

## Available Placeholders
The system will auto-detect these:
- `{{name}}`
- `{{course}}`
- `{{organization_name}}`
- `{{start_date}}`
- `{{end_date}}`
- `{{date}}`
- `{{certificate_id}}` (auto-generated)

## Important Rules
✅ **DO**: Type placeholders in one go without stopping
✅ **DO**: Use lowercase with underscores
✅ **DO**: Paste from Notepad first

❌ **DON'T**: Type placeholders directly in Word
❌ **DON'T**: Copy-paste placeholders within Word
❌ **DON'T**: Use spaces in placeholder names
