const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true, unique: true },
    data: { type: Map, of: mongoose.Schema.Types.Mixed }, // Stores the filled values (Strings, Objects like QR code)
    filePath: { type: String }, // Path to generated PDF
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', DocumentSchema);
