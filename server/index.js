require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const User = require('./models/User');

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected');
        await seedAdmin();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Admin Seeding Function
const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@verifycert.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const admin = new User({
                name: 'Admin',
                email: adminEmail,
                password: process.env.ADMIN_PASSWORD || 'Admin@123',
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Admin user created automatically');
        } else {
            console.log('ℹ️ Admin user already exists');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/index'));
app.get('/', (req, res) => res.send('VerifyCert API Running'));

// Init Uploads Folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
