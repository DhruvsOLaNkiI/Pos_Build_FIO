const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sampleProducts = [
    // Nestle Products
    { name: 'Maggi 2-Min Noodles 140g', category: 'Noodles', brand: 'Nestle', purchasePrice: 12, sellingPrice: 14, gstPercent: 5, stockQty: 50, minStockLevel: 10, barcode: 'NST001' },
    { name: 'Maggi Hot Heads 140g', category: 'Noodles', brand: 'Nestle', purchasePrice: 30, sellingPrice: 35, gstPercent: 5, stockQty: 30, minStockLevel: 10, barcode: 'NST002' },
    { name: 'Nescafe Classic 100g', category: 'Beverages', brand: 'Nestle', purchasePrice: 180, sellingPrice: 210, gstPercent: 12, stockQty: 20, minStockLevel: 5, barcode: 'NST003' },
    { name: 'KitKat 4 Finger 37.3g', category: 'Chocolates', brand: 'Nestle', purchasePrice: 28, sellingPrice: 35, gstPercent: 18, stockQty: 40, minStockLevel: 10, barcode: 'NST004' },
    { name: 'Nestle Everyday Dairy Whitener 400g', category: 'Dairy', brand: 'Nestle', purchasePrice: 140, sellingPrice: 165, gstPercent: 5, stockQty: 15, minStockLevel: 5, barcode: 'NST005' },

    // Amul Products
    { name: 'Amul Gold Milk 500ml', category: 'Dairy', brand: 'Amul', purchasePrice: 28, sellingPrice: 31, gstPercent: 0, stockQty: 60, minStockLevel: 20, barcode: 'AML001' },
    { name: 'Amul Butter 100g', category: 'Dairy', brand: 'Amul', purchasePrice: 48, sellingPrice: 56, gstPercent: 12, stockQty: 25, minStockLevel: 10, barcode: 'AML002' },
    { name: 'Amul Cheese Slice 200g', category: 'Dairy', brand: 'Amul', purchasePrice: 90, sellingPrice: 110, gstPercent: 12, stockQty: 20, minStockLevel: 5, barcode: 'AML003' },
    { name: 'Amul Dark Chocolate 150g', category: 'Chocolates', brand: 'Amul', purchasePrice: 120, sellingPrice: 145, gstPercent: 18, stockQty: 15, minStockLevel: 5, barcode: 'AML004' },
    { name: 'Amul Lassi Mango 200ml', category: 'Beverages', brand: 'Amul', purchasePrice: 18, sellingPrice: 25, gstPercent: 5, stockQty: 35, minStockLevel: 10, barcode: 'AML005' },

    // Britannia Products
    { name: 'Britannia Good Day Butter 75g', category: 'Biscuits', brand: 'Britannia', purchasePrice: 22, sellingPrice: 28, gstPercent: 18, stockQty: 45, minStockLevel: 15, barcode: 'BRT001' },
    { name: 'Britannia Marie Gold 250g', category: 'Biscuits', brand: 'Britannia', purchasePrice: 30, sellingPrice: 38, gstPercent: 18, stockQty: 40, minStockLevel: 10, barcode: 'BRT002' },
    { name: 'Britannia Bread 400g', category: 'Bakery', brand: 'Britannia', purchasePrice: 35, sellingPrice: 42, gstPercent: 0, stockQty: 20, minStockLevel: 5, barcode: 'BRT003' },
    { name: 'Britannia 50-50 Maska Chaska 120g', category: 'Biscuits', brand: 'Britannia', purchasePrice: 18, sellingPrice: 22, gstPercent: 18, stockQty: 50, minStockLevel: 10, barcode: 'BRT004' },

    // Parle Products
    { name: 'Parle-G Gold 100g', category: 'Biscuits', brand: 'Parle', purchasePrice: 18, sellingPrice: 22, gstPercent: 18, stockQty: 60, minStockLevel: 15, barcode: 'PRL001' },
    { name: 'Parle Hide & Seek 120g', category: 'Biscuits', brand: 'Parle', purchasePrice: 30, sellingPrice: 38, gstPercent: 18, stockQty: 35, minStockLevel: 10, barcode: 'PRL002' },
    { name: 'Parle Frooti Mango 600ml', category: 'Beverages', brand: 'Parle', purchasePrice: 28, sellingPrice: 35, gstPercent: 12, stockQty: 40, minStockLevel: 10, barcode: 'PRL003' },

    // ITC Products
    { name: 'Aashirvaad Atta 5kg', category: 'Staples', brand: 'ITC', purchasePrice: 220, sellingPrice: 265, gstPercent: 0, stockQty: 25, minStockLevel: 5, barcode: 'ITC001' },
    { name: 'Sunfeast Dark Fantasy 75g', category: 'Biscuits', brand: 'ITC', purchasePrice: 28, sellingPrice: 35, gstPercent: 18, stockQty: 30, minStockLevel: 10, barcode: 'ITC002' },
    { name: 'Bingo Mad Angles 72.5g', category: 'Snacks', brand: 'ITC', purchasePrice: 16, sellingPrice: 20, gstPercent: 12, stockQty: 50, minStockLevel: 15, barcode: 'ITC003' },
    { name: 'Yippee Noodles 140g', category: 'Noodles', brand: 'ITC', purchasePrice: 12, sellingPrice: 14, gstPercent: 5, stockQty: 40, minStockLevel: 10, barcode: 'ITC004' },

    // HUL (Hindustan Unilever) Products
    { name: 'Tata Tea Gold 500g', category: 'Beverages', brand: 'Tata', purchasePrice: 200, sellingPrice: 240, gstPercent: 5, stockQty: 15, minStockLevel: 5, barcode: 'TTA001' },
    { name: 'Surf Excel Matic 1kg', category: 'Home Care', brand: 'HUL', purchasePrice: 240, sellingPrice: 290, gstPercent: 18, stockQty: 10, minStockLevel: 3, barcode: 'HUL001' },
    { name: 'Lux Soap 100g', category: 'Personal Care', brand: 'HUL', purchasePrice: 30, sellingPrice: 38, gstPercent: 18, stockQty: 50, minStockLevel: 15, barcode: 'HUL002' },
    { name: 'Lifebuoy Handwash 190ml', category: 'Personal Care', brand: 'HUL', purchasePrice: 65, sellingPrice: 79, gstPercent: 18, stockQty: 20, minStockLevel: 5, barcode: 'HUL003' },
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected...');

        let created = 0;
        let skipped = 0;

        for (const product of sampleProducts) {
            const exists = await Product.findOne({ barcode: product.barcode });
            if (exists) {
                skipped++;
                console.log(`⏩ Skipped (already exists): ${product.name}`);
            } else {
                await Product.create(product);
                created++;
                console.log(`✅ Added: ${product.name} [${product.brand}]`);
            }
        }

        console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error.message);
        process.exit(1);
    }
};

seedProducts();
