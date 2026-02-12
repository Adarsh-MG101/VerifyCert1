const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Simple fetch call to Gemini API
async function callGemini(prompt) {
    const apiKey = process.env.AI_STUDIO;
    if (!apiKey) {
        throw new Error('AI_STUDIO API key not found in environment variables. Please check your .env file.');
    }

    // Confirming key loading (redacted)
    console.log('🔑 API Key Check:', apiKey ? `Found (Starts with ${apiKey.substring(0, 4)}...)` : 'NOT FOUND');

    // Using v1beta and gemini-2.0-flash as per user's successful curl test
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
            temperature: 0.4,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        }
    };

    console.log('🤖 Calling Gemini API (v1beta/gemini-1.5-flash)...');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.error) {
            console.error('🤖 Gemini API Error Payload:', JSON.stringify(data.error, null, 2));
            throw new Error(`Gemini API Error: ${data.error.message || 'Unknown API Error'}`);
        }

        if (!data.candidates || data.candidates.length === 0) {
            console.error('🤖 No candidates returned:', JSON.stringify(data, null, 2));
            throw new Error('AI did not return any results. It might have been blocked by safety filters.');
        }

        const candidate = data.candidates[0];

        if (candidate.finishReason === 'SAFETY') {
            throw new Error('AI response was blocked by safety filters.');
        }

        if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
            console.error('🤖 Unexpected candidate format:', JSON.stringify(candidate, null, 2));
            throw new Error('AI returned an unexpected response format.');
        }

        return candidate.content.parts[0].text;
    } catch (err) {
        console.error('🤖 Fetch/Parsing Error:', err);
        throw err;
    }
}

router.post('/suggest', auth, async (req, res) => {
    try {
        const { text, mode, customPrompt } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text provided for AI analysis' });
        }

        let prompt = '';
        switch (mode) {
            case 'grammar':
                prompt = `Fix any grammar, spelling, or punctuation errors in the following text. Return ONLY the corrected text, no explanations:\n\n"${text}"`;
                break;
            case 'professional':
                prompt = `Rewrite the following text to sound more professional, polite, and corporate. Keep the core meaning the same. Return ONLY the rewritten text:\n\n"${text}"`;
                break;
            case 'shorten':
                prompt = `Shorten the following text while keeping the most important information. Return ONLY the shortened text:\n\n"${text}"`;
                break;
            case 'scan':
                prompt = `You are a proofreading assistant. Analyze the following text and find all spelling and grammar errors. 
                Return the results as a JSON array of objects. Each object must have:
                - "original": the exact word or phrase with the error
                - "suggestion": the corrected version
                - "reason": a short explanation of the error
                
                Text to analyze:
                "${text}"
                
                Respond ONLY with a valid JSON array, no other text or explanation. If no errors are found, return [].`;
                break;
            case 'custom':
                prompt = `${customPrompt}. Apply this instruction to the following text and return ONLY the result:\n\n"${text}"`;
                break;
            default:
                prompt = `Improve the following text. Return ONLY the result:\n\n"${text}"`;
        }

        const result = await callGemini(prompt);
        res.json({ suggestion: (result || '').trim() });
    } catch (err) {
        console.error('AI Route Error:', err);
        res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
    }
});

module.exports = router;
