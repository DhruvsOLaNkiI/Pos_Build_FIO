/**
 * Migration Script
 * Updates existing Purchases and Suppliers to use InventoryItem IDs instead of Product IDs.
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Purchase = require('./models/Purchase');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a map of productId -> inventoryItemId
        const products = await Product.find({ inventoryItemId: { $exists: true } });
        const productToInvMap = {};
        products.forEach(p => {
            productToInvMap[p._id.toString()] = p.inventoryItemId.toString();
        });
        console.log(`Loaded ${Object.keys(productToInvMap).length} product mapping entries.`);

        // Update Purchases
        const purchases = await Purchase.find();
        let purchasesUpdated = 0;
        for (const purchase of purchases) {
            let changed = false;
            for (const item of purchase.items) {
                const oldId = item.product.toString();
                if (productToInvMap[oldId]) {
                    item.product = productToInvMap[oldId];
                    changed = true;
                }
            }
            if (changed) {
                await purchase.save();
                purchasesUpdated++;
            }
        }
        console.log(`Updated ${purchasesUpdated} purchases.`);

        // Update Suppliers
        const suppliers = await Supplier.find();
        let suppliersUpdated = 0;
        for (const supplier of suppliers) {
            let changed = false;
            if (supplier.catalog && supplier.catalog.length > 0) {
                for (const catItem of supplier.catalog) {
                    if (!catItem.product) continue;
                    const oldId = catItem.product.toString();
                    if (productToInvMap[oldId]) {
                        catItem.product = productToInvMap[oldId];
                        changed = true;
                    }
                }
            }
            if (changed) {
                await supplier.save();
                suppliersUpdated++;
            }
        }
        console.log(`Updated ${suppliersUpdated} suppliers.`);

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrate();
