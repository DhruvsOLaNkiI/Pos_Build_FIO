require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');
const InventoryItem = require('./models/InventoryItem');
const Warehouse = require('./models/Warehouse');
const WarehouseInventory = require('./models/WarehouseInventory');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos_system');
        console.log('✅ Connected to MongoDB');

        // Assuming there is at least one warehouse (Main Warehouse)
        let mainWarehouse = await Warehouse.findOne({ isDefault: true });
        if (!mainWarehouse) {
            mainWarehouse = await Warehouse.findOne();
        }

        if (!mainWarehouse) {
            console.error('❌ No warehouse found. Please create a warehouse first.');
            process.exit(1);
        }

        console.log(`📌 Using Warehouse: ${mainWarehouse.name} (${mainWarehouse._id})`);

        const products = await Product.find({ isActive: true });
        let migratedCount = 0;

        for (const product of products) {
            // Check if WarehouseInventory already exists for this product
            let wi = await WarehouseInventory.findOne({
                warehouseId: mainWarehouse._id,
                productId: product._id
            });

            if (!wi) {
                // If it doesn't exist, we must create it
                // We'll initialize it to 0 first, then see if we can get a real number
                let initialStock = product.stockQty || 0;

                // If the product has an underlying InventoryItem (it should), get stock from there
                if (product.inventoryItemId) {
                    const invItem = await InventoryItem.findById(product.inventoryItemId);
                    if (invItem && invItem.stockQty > 0) {
                        initialStock = invItem.stockQty;
                    }
                }

                if (initialStock > 0) {
                    await WarehouseInventory.create({
                        warehouseId: mainWarehouse._id,
                        productId: product._id,
                        stockQty: initialStock
                    });

                    product.warehouseStock = 0; // The flat field is deprecated
                    await product.save();

                    migratedCount++;
                    console.log(`⚡ Migrated ${product.name} | Initial Stock: ${initialStock}`);
                }
            } else if (wi.stockQty === 0) {
                // Even if standard WI exists but is zero, let's see if there's raw legacy inventory we can salvage
                if (product.inventoryItemId) {
                    const invItem = await InventoryItem.findById(product.inventoryItemId);
                    if (invItem && invItem.stockQty > 0) {
                        wi.stockQty = invItem.stockQty;
                        await wi.save();
                        migratedCount++;
                        console.log(`♻️  Salvaged ${product.name} | Stock: ${invItem.stockQty}`);
                    }
                }
            }
        }

        console.log(`🎉 Migration complete! Handled ${migratedCount} obsolete stock records.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

migrate();
