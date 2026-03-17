/**
 * Migration Script: Assign existing data to the first Company.
 * 
 * This script is for the initial migration ONLY.
 * Run it once after creating your Super Admin account.
 * 
 * Usage:
 *   node scripts/migrateToMultiTenancy.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Company = require('../models/Company');
const User = require('../models/User');
const Store = require('../models/Store');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const WarehouseInventory = require('../models/WarehouseInventory');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const migrateToMultiTenancy = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔗 Connected to MongoDB...\n');

        // Find or create a primary company
        let primaryCompany = await Company.findOne();
        if (!primaryCompany) {
            // Find the owner user to get their info for the company
            const owner = await User.findOne({ role: 'owner' });
            primaryCompany = await Company.create({
                name: owner ? `${owner.name}'s Business` : 'Primary Business',
                email: owner?.email || 'admin@primary.com',
                plan: 'premium',
                isActive: true,
            });
            console.log(`✅ Created primary company: "${primaryCompany.name}" (${primaryCompany._id})`);
        } else {
            console.log(`✅ Using existing primary company: "${primaryCompany.name}" (${primaryCompany._id})`);
        }

        const cid = primaryCompany._id;

        // Helper to update a model
        const updateModel = async (Model, name) => {
            const result = await Model.updateMany(
                { companyId: { $exists: false } },
                { $set: { companyId: cid } }
            );
            console.log(`   → ${name}: ${result.modifiedCount} documents updated`);
        };

        // Update all Owner and Employee users without a companyId
        const userResult = await User.updateMany(
            { role: { $ne: 'super-admin' }, companyId: { $exists: false } },
            { $set: { companyId: cid } }
        );
        console.log(`   → Users: ${userResult.modifiedCount} documents updated`);

        await updateModel(Store, 'Stores');
        await updateModel(Warehouse, 'Warehouses');
        await updateModel(Product, 'Products');
        await updateModel(InventoryItem, 'InventoryItems');
        await updateModel(WarehouseInventory, 'WarehouseInventory');
        await updateModel(Sale, 'Sales');
        await updateModel(Purchase, 'Purchases');
        await updateModel(Expense, 'Expenses');
        await updateModel(Customer, 'Customers');
        await updateModel(Supplier, 'Suppliers');

        console.log('\n✅ Migration complete! All existing data is now linked to the primary company.');
        mongoose.connection.close();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateToMultiTenancy();
