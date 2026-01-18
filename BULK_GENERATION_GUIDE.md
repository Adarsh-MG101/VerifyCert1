# Bulk Certificate Generation - CSV Format Guide

## Overview
The bulk generation feature allows you to generate multiple certificates at once by uploading a CSV file with recipient data.

## CSV Format

### Structure
- **First Row (Header)**: Column names must match the placeholder variables in your template
- **Subsequent Rows**: Data for each certificate recipient

### Example

If your template has placeholders: `{{name}}`, `{{course}}`, `{{date}}`, `{{grade}}`

Your CSV should look like:

```csv
name,course,date,grade
John Doe,Web Development,2024-01-15,A+
Jane Smith,Data Science,2024-01-15,A
Bob Johnson,Machine Learning,2024-01-16,B+
Alice Williams,Cloud Computing,2024-01-16,A
```

### Important Notes

1. **Automatic Fields**: Do NOT include these in your CSV - they are auto-generated:
   - `certificate_id` - Unique ID for each certificate
   - `qr_code` - QR code for verification

2. **Column Names**: Must exactly match template placeholders (case-sensitive)

3. **File Format**: 
   - Save as `.csv` (Comma-Separated Values)
   - UTF-8 encoding recommended
   - No special formatting (plain text only)

4. **Filename Convention**: The generated PDFs will be named using the `name` field if present, otherwise the unique ID

## How to Use

1. **Select Template**: Choose the template you want to use
2. **Download Sample CSV**: Click the "Download Sample CSV" button to get a template with correct headers
3. **Fill Data**: Open the sample CSV and add your recipient data
4. **Upload**: Upload your completed CSV file
5. **Set QR Position**: Adjust X/Y coordinates for QR code placement
6. **Generate**: Click "Generate All PDFs"
7. **Download**: Download the ZIP file containing all generated certificates

## Tips

- Test with a small CSV (2-3 rows) first
- Check for typos in column names
- Ensure all required fields have data
- Large batches (100+ rows) may take a few minutes

## Error Handling

If some certificates fail to generate:
- The system will still create PDFs for successful rows
- Failed rows will be listed with error details
- You can download the successful PDFs and retry failed ones separately

## Example Templates

### Simple Certificate
```csv
name,achievement,date
John Doe,Completion of Course,January 15 2024
Jane Smith,Excellence in Studies,January 16 2024
```

### Detailed Certificate
```csv
name,course,instructor,date,grade,hours
John Doe,Python Programming,Dr. Smith,2024-01-15,A+,40
Jane Smith,Web Development,Prof. Johnson,2024-01-16,A,35
```

### Event Certificate
```csv
name,event,role,location,date
John Doe,Tech Conference 2024,Speaker,New York,Jan 15-17
Jane Smith,Tech Conference 2024,Attendee,New York,Jan 15-17
```
