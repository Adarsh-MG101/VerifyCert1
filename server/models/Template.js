const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    filePath: { type: String, required: true }, // Path to uploaded .docx
    placeholders: [{ type: String }],
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);
