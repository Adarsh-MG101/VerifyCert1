const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Login
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                organization: user.organization // Include organization ID in payload
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log Activity
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const activity = new Activity({
            userId: user._id,
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
            type: 'login'
        });
        await activity.save();

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify token (for frontend to check if logged in)
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

const auth = require('../middleware/auth');

// Change Password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Find user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check current password (optional if disabled on frontend)
        if (currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect current password' });
            }
        }

        // Update password (middleware in User model handles hashing)
        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Activity Logs
router.get('/activity', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ userId: req.user.userId })
            .sort({ timestamp: -1 })
            .limit(50);
        res.json({ success: true, activities });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        const lastSession = await Activity.findOne({
            userId: req.user.userId,
            type: 'login',
            endedAt: { $exists: false }
        }).sort({ timestamp: -1 });

        if (lastSession) {
            lastSession.endedAt = Date.now();
            await lastSession.save();
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
