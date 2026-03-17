require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const seedKnorrSoups = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/pos_system');
        console.log('MongoDB Connected');

        const knorrSoups = [
            {
                name: 'Knorr Classic Soup',
                variant: 'Thick Tomato',
                category: 'Grocery',
                brand: 'Knorr',
                purchasePrice: 8,
                sellingPrice: 10,
                stockQty: 50,
                gstPercent: 5,
                barcode: '8901030383181', // Dummy
            },
            {
                name: 'Knorr Classic Soup',
                variant: 'Mixed Vegetable',
                category: 'Grocery',
                brand: 'Knorr',
                purchasePrice: 8,
                sellingPrice: 10,
                stockQty: 45,
                gstPercent: 5,
                barcode: '8901030383182',
            },
            {
                name: 'Knorr Classic Soup',
                variant: 'Sweet Corn Veg',
                category: 'Grocery',
                brand: 'Knorr',
                purchasePrice: 8,
                sellingPrice: 10,
                stockQty: 60,
                gstPercent: 5,
                barcode: '8901030383183',
            },
            {
                name: 'Knorr Classic Soup',
                variant: 'Hot & Sour Veg',
                category: 'Grocery',
                brand: 'Knorr',
                purchasePrice: 8,
                sellingPrice: 10,
                stockQty: 30,
                gstPercent: 5,
                barcode: '8901030383184',
            }
        ];

        for (const soup of knorrSoups) {
            // Check if exists to avoid dupes
            const existing = await Product.findOne({ name: soup.name, variant: soup.variant });
            if (!existing) {
                await Product.create(soup);
                console.log(`Added: ${soup.name} (${soup.variant})`);
            } else {
                console.log(`Already exists: ${soup.name} (${soup.variant})`);
            }
        }

        console.log('Knorr Soups seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedKnorrSoups();
