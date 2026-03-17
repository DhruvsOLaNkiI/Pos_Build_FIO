/**
 * Seed InventoryItem collection from existing Products.
 * Run once: node seedInventory.js
 * 
 * This creates an InventoryItem for each Product that doesn't already
 * have a matching entry, and links the Product back via inventoryItemId.
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');
const InventoryItem = require('./models/InventoryItem');

const seedInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find();
        console.log(`Found ${products.length} products to seed into inventory`);

        let created = 0;
        let linked = 0;

        for (const product of products) {
            // Skip if already linked
            if (product.inventoryItemId) {
                console.log(`  ✓ ${product.name} already linked`);
                linked++;
                continue;
            }

            // Create InventoryItem from Product data
            const invItem = await InventoryItem.create({
                name: product.name,
                category: product.category,
                brand: product.brand || '',
                unit: product.unit,
                purchasePrice: product.purchasePrice,
                stockQty: product.stockQty, // Copy current stock as warehouse stock
                minStockLevel: product.minStockLevel,
                barcode: product.barcode || undefined,
            });

            // Link Product back to InventoryItem
            product.inventoryItemId = invItem._id;
            await product.save();

            console.log(`  + Created & linked: ${product.name} (warehouse stock: ${invItem.stockQty})`);
            created++;
        }

        console.log(`\nDone! Created ${created} inventory items, ${linked} already linked.`);
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error.message);
        process.exit(1);
    }
};

seedInventory();
