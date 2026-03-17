require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');
const InventoryItem = require('./models/InventoryItem');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all products that have an inventoryItemId
        const products = await Product.find({ inventoryItemId: { $exists: true } });
        let updatedCount = 0;

        for (const product of products) {
            const invItem = await InventoryItem.findById(product.inventoryItemId);
            if (invItem && product.sellingPrice !== undefined) {
                invItem.sellingPrice = product.sellingPrice;
                await invItem.save();
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} InventoryItems with selling prices.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrate();
