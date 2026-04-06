const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load models after connection
let Product, Store;

// Create uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Download image
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(filepath); });
            } else {
                reject(new Error(`Status ${response.statusCode}`));
            }
        }).on('error', reject);
    });
};

// Products that appear on Home Page (from screenshot)
const homePageProducts = [
    { name: 'Wireless Headphones', category: 'Electronics', price: 1999, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
    { name: 'Running Sneakers', category: 'Footwear', price: 3499, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
    { name: 'Smart Watch', category: 'Electronics', price: 4500, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
    { name: 'Cotton T-Shirt', category: 'Clothing', price: 599, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
    { name: 'Organic Coffee', category: 'Beverages', price: 650, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
    { name: 'Stainless Steel Bottle', category: 'Home', price: 450, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400' },
    { name: 'Yoga Mat', category: 'Health', price: 80, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400' },
    { name: 'Bluetooth Speaker', category: 'Electronics', price: 280, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' }
];

const addHomePageProducts = async () => {
    try {
        // Connect to MongoDB first
        await mongoose.connect('mongodb://localhost:27017/pos-system');
        console.log('✅ Connected to MongoDB');
        
        // Now load models
        Product = require('../models/Product');
        Store = require('../models/Store');
        
        // Get the first available store
        const store = await Store.findOne();
        if (!store) {
            console.log('❌ No store found');
            return;
        }
        
        console.log(`📦 Adding products to store: ${store.name}\n`);
        
        let added = 0;
        
        for (const prod of homePageProducts) {
            // Check if product exists
            const existing = await Product.findOne({ name: prod.name, storeId: store._id });
            if (existing) {
                console.log(`⏭️  ${prod.name} already exists`);
                continue;
            }
            
            // Download image
            const filename = `product-${Date.now()}-${added}.jpg`;
            const filepath = path.join(uploadsDir, filename);
            await downloadImage(prod.image, filepath);
            
            // Create product
            const product = await Product.create({
                name: prod.name,
                category: prod.category,
                brand: 'Generic',
                purchasePrice: Math.round(prod.price * 0.6),
                sellingPrice: prod.price,
                gstPercent: 18,
                stockQty: 20,
                warehouseStock: 50,
                minStockLevel: 5,
                productType: 'Single',
                unit: null,
                storeId: store._id,
                companyId: store.companyId,
                imageUrl: `/uploads/products/${filename}`,
                isActive: true
            });
            
            console.log(`✅ Added: ${prod.name}`);
            added++;
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log(`\n🎉 Added ${added} products with images!`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Done');
    }
};

addHomePageProducts();
