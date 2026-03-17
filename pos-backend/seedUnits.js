const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Unit = require('./models/Unit');

// Load env vars
dotenv.config({ path: '../.env' });

// Add database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const defaultUnits = [
    { name: 'Kilograms', shortName: 'kg', baseUnit: '1000g' },
    { name: 'Liters', shortName: 'L', baseUnit: '1000ml' },
    { name: 'Dozen', shortName: 'dz', baseUnit: '12pcs' },
    { name: 'Pieces', shortName: 'pcs', baseUnit: '' },
    { name: 'Boxes', shortName: 'bx', baseUnit: '' },
    { name: 'Tons', shortName: 't', baseUnit: '1000kg' },
    { name: 'Grams', shortName: 'g', baseUnit: '' },
    { name: 'Meters', shortName: 'm', baseUnit: '100cm' },
    { name: 'Centimeters', shortName: 'cm', baseUnit: '' },
];

const seedUnits = async () => {
    try {
        await connectDB();

        console.log('Clearing existing units...');
        await Unit.deleteMany();

        console.log('Seeding default units...');
        await Unit.insertMany(defaultUnits);

        console.log('Units seeded successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error seeding units: ${error}`);
        process.exit(1);
    }
};

seedUnits();
