const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const email = process.argv[2];
        const password = process.argv[3];
        const name = process.argv[4] || 'Super Admin';

        if (!email || !password) {
            console.log('Usage: node scripts/createSuperAdmin.js <email> <password> <name>');
            process.exit(1);
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log('User already exists. Updating role to super-admin...');
            userExists.status = 'active';
            userExists.isApproved = true;
            userExists.role = 'super-admin';
            await userExists.save();
            console.log('Role updated successfully.');
        } else {
            console.log('Creating new super-admin user...');
            await User.create({
                name,
                email,
                password,
                role: 'super-admin',
                status: 'active',
                isApproved: true
            });
            console.log('Super Admin created successfully.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createSuperAdmin();
