const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['auth', 'user', 'system', 'login', 'registration'],
        required: true
    },
    status: {
        type: String,
        enum: ['passed', 'failed'],
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    error: {
        type: String
    },
    duration: {
        type: Number // in ms
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TestResult', TestResultSchema);
