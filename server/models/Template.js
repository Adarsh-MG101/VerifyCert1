const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    filePath: { type: String, required: true }, // Path to uploaded .docx
    canvasData: { type: String }, // JSON/XFDF representation of the visual editor
    isVisual: { type: Boolean, default: false }, // Flag to identify visual editor templates
    thumbnailPath: { type: String }, // Path to preview PNG
    placeholders: [{ type: String }],
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);
