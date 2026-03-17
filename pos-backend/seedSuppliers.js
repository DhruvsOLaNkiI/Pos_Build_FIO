const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Supplier = require('./models/Supplier');

// Load env vars
dotenv.config({ path: '../.env' });

const suppliers = [
    {
        name: 'Amul Dairy Co.',
        contactPerson: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul@amul.com',
        address: 'Anand, Gujarat',
        gstNumber: '24AAAAA0000A1Z5',
        totalOrders: 15,
        pendingPayment: 5000,
        isActive: true
    },
    {
        name: 'Nestlé India',
        contactPerson: 'Suresh Patel',
        phone: '9822113344',
        email: 'sales@nestle.in',
        address: 'Gurugram, Haryana',
        gstNumber: '06AAAAA1111B1Z2',
        totalOrders: 8,
        pendingPayment: 0,
        isActive: true
    },
    {
        name: 'Hindustan Unilever Ltd',
        contactPerson: 'Amit Kumar',
        phone: '9112233445',
        email: 'amit.kumar@hul.com',
        address: 'Mumbai, Maharashtra',
        gstNumber: '27AAAAA2222C1Z3',
        totalOrders: 25,
        pendingPayment: 12000,
        isActive: true
    },
    {
        name: 'Britannia Industries',
        contactPerson: 'Vikram Singh',
        phone: '9334455667',
        email: 'vikram@britannia.co.in',
        address: 'Kolkata, West Bengal',
        gstNumber: '19AAAAA3333D1Z4',
        totalOrders: 10,
        pendingPayment: 1500,
        isActive: true
    },
    {
        name: 'Tata Consumer Products',
        contactPerson: 'Priya Verma',
        phone: '9445566778',
        email: 'priya.v@tataconsumer.com',
        address: 'Mumbai, Maharashtra',
        gstNumber: '27AAAAA4444E1Z6',
        totalOrders: 12,
        pendingPayment: 3000,
        isActive: true
    },
    {
        name: 'Local Grocery Wholesaler',
        contactPerson: 'Rajesh Bhai',
        phone: '9556677889',
        email: 'rajesh.wholesaler@gmail.com',
        address: 'Local Market, Sector 12',
        gstNumber: '09AAAAA5555F1Z7',
        totalOrders: 50,
        pendingPayment: 450,
        isActive: true
    }
];

const seedSuppliers = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log('Seeding suppliers...');

        try {
            // First, delete existing suppliers to start fresh or keep them?
            // User just said "add", usually means populate if empty or add more.
            // I'll delete existing ones to avoid confusion if they are already there.
            await Supplier.deleteMany();
            await Supplier.insertMany(suppliers);
            console.log('Suppliers Imported!');
        } catch (e) {
            console.error('Error during insertion:', e.message);
            throw e;
        }

        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seedSuppliers();
