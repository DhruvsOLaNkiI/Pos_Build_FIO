/**
 * One-time Migration Script: Backfill companyId on existing records
 * 
 * Run this script once after deploying the multi-tenant changes.
 * It will assign the correct companyId to documents that are missing it.
 * 
 * Usage: node scripts/migrate-companyId.js
 * 
 * IMPORTANT: Back up your database before running this script!
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import all models
const Company = require('../models/Company');
const User = require('../models/User');
const Unit = require('../models/Unit');
const DamageReport = require('../models/DamageReport');
const HeldOrder = require('../models/HeldOrder');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const ShopSettings = require('../models/ShopSettings');
const Store = require('../models/Store');
const Warehouse = require('../models/Warehouse');
const Offer = require('../models/Offer');
const LoyaltySettings = require('../models/LoyaltySettings');
const WarehouseInventory = require('../models/WarehouseInventory');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const InventoryItem = require('../models/InventoryItem');

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const migrate = async () => {
    try {
        await connectDB();

        // Get the first (or only) company — for single-tenant-to-multi-tenant migration
        const companies = await Company.find().sort({ createdAt: 1 });

        if (companies.length === 0) {
            console.log('❌ No companies found. Please create at least one company first.');
            process.exit(1);
        }

        const defaultCompany = companies[0];
        console.log(`\n🏢 Using default company: "${defaultCompany.name}" (${defaultCompany._id})\n`);

        // ---------- 1. Migrate Units ----------
        console.log('📦 Migrating Units...');
        const unitsWithoutCompany = await Unit.find({ companyId: { $exists: false } });
        if (unitsWithoutCompany.length > 0) {
            // Remove the old unique index on name if it exists
            try {
                await Unit.collection.dropIndex('name_1');
                console.log('   Dropped old unique index on name');
            } catch (e) {
                // Index might not exist, that's fine
            }

            for (const unit of unitsWithoutCompany) {
                unit.companyId = defaultCompany._id;
                await unit.save({ validateBeforeSave: false });
            }
            console.log(`   ✅ Migrated ${unitsWithoutCompany.length} units`);
        } else {
            console.log('   ✅ All units already have companyId');
        }

        // ---------- 2. Migrate DamageReports ----------
        console.log('🔨 Migrating DamageReports...');
        const dmgReports = await DamageReport.find({ companyId: { $exists: false } }).populate('reportedBy');
        let dmgCount = 0;
        for (const report of dmgReports) {
            if (report.reportedBy && report.reportedBy.companyId) {
                report.companyId = report.reportedBy.companyId;
            } else {
                report.companyId = defaultCompany._id;
            }
            await report.save({ validateBeforeSave: false });
            dmgCount++;
        }
        console.log(`   ✅ Migrated ${dmgCount} damage reports`);

        // ---------- 3. Migrate HeldOrders ----------
        console.log('🛒 Migrating HeldOrders...');
        const heldOrders = await HeldOrder.find({ companyId: { $exists: false } }).populate('cashier');
        let heldCount = 0;
        for (const order of heldOrders) {
            if (order.cashier && order.cashier.companyId) {
                order.companyId = order.cashier.companyId;
            } else {
                order.companyId = defaultCompany._id;
            }
            await order.save({ validateBeforeSave: false });
            heldCount++;
        }
        console.log(`   ✅ Migrated ${heldCount} held orders`);

        // ---------- 4. Migrate Attendance ----------
        console.log('📋 Migrating Attendance...');
        const attendanceRecords = await Attendance.find({ companyId: { $exists: false } }).populate('employee');
        let attCount = 0;
        for (const record of attendanceRecords) {
            if (record.employee && record.employee.companyId) {
                record.companyId = record.employee.companyId;
            } else {
                record.companyId = defaultCompany._id;
            }
            await record.save({ validateBeforeSave: false });
            attCount++;
        }
        console.log(`   ✅ Migrated ${attCount} attendance records`);

        // ---------- 5. Migrate Leaves ----------
        console.log('🏖️  Migrating Leaves...');
        const leaves = await Leave.find({ companyId: { $exists: false } }).populate('employee');
        let leaveCount = 0;
        for (const leave of leaves) {
            if (leave.employee && leave.employee.companyId) {
                leave.companyId = leave.employee.companyId;
            } else {
                leave.companyId = defaultCompany._id;
            }
            await leave.save({ validateBeforeSave: false });
            leaveCount++;
        }
        console.log(`   ✅ Migrated ${leaveCount} leave records`);

        // ---------- 6. Migrate ShopSettings ----------
        console.log('⚙️  Migrating ShopSettings...');
        const settingsWithoutCompany = await ShopSettings.find({ companyId: { $exists: false } });
        if (settingsWithoutCompany.length > 0) {
            for (const settings of settingsWithoutCompany) {
                settings.companyId = defaultCompany._id;
                await settings.save({ validateBeforeSave: false });
            }
            console.log(`   ✅ Migrated ${settingsWithoutCompany.length} shop settings`);
        } else {
            console.log('   ✅ All shop settings already have companyId');
        }

        // ---------- 7. Migrate Offers ----------
        console.log('🎫 Migrating Offers...');
        const offers = await Offer.find({ companyId: { $exists: false } });
        for (const offer of offers) {
            offer.companyId = defaultCompany._id;
            await offer.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${offers.length} offers`);

        // ---------- 8. Migrate LoyaltySettings ----------
        console.log('💎 Migrating LoyaltySettings...');
        const loyaltySettings = await LoyaltySettings.find({ companyId: { $exists: false } });
        for (const ls of loyaltySettings) {
            ls.companyId = defaultCompany._id;
            await ls.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${loyaltySettings.length} loyalty settings`);

        // ---------- 9. Migrate WarehouseInventory ----------
        console.log('📦 Migrating WarehouseInventory...');
        const whInv = await WarehouseInventory.find({ companyId: { $exists: false } });
        for (const item of whInv) {
            item.companyId = defaultCompany._id;
            await item.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${whInv.length} warehouse inventory records`);

        // ---------- 10. Migrate InventoryItems ----------
        console.log('🗃️  Migrating InventoryItems...');
        const invItems = await InventoryItem.find({ companyId: { $exists: false } });
        for (const item of invItems) {
            item.companyId = defaultCompany._id;
            await item.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${invItems.length} inventory items`);

        // ---------- 11. Migrate Products ----------
        console.log('🏷️  Migrating Products...');
        const products = await Product.find({ companyId: { $exists: false } });
        for (const p of products) {
            p.companyId = defaultCompany._id;
            await p.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${products.length} products`);

        // ---------- 12. Migrate Sales ----------
        console.log('💰 Migrating Sales...');
        const sales = await Sale.find({ companyId: { $exists: false } });
        for (const s of sales) {
            s.companyId = defaultCompany._id;
            await s.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${sales.length} sales`);

        // ---------- 13. Migrate Suppliers ----------
        console.log('🚚 Migrating Suppliers...');
        const suppliers = await Supplier.find({ companyId: { $exists: false } });
        for (const sup of suppliers) {
            sup.companyId = defaultCompany._id;
            await sup.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${suppliers.length} suppliers`);

        // ---------- 14. Migrate Customers ----------
        console.log('👥 Migrating Customers...');
        const customers = await Customer.find({ companyId: { $exists: false } });
        for (const c of customers) {
            c.companyId = defaultCompany._id;
            await c.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${customers.length} customers`);

        // ---------- 15. Migrate Expenses ----------
        console.log('💸 Migrating Expenses...');
        const expenses = await Expense.find({ companyId: { $exists: false } });
        for (const e of expenses) {
            e.companyId = defaultCompany._id;
            await e.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${expenses.length} expenses`);

        // ---------- 16. Ensure default Store exists for defaultCompany ----------
        console.log('🏪 Ensuring default store exists...');
        const existingStore = await Store.findOne({ companyId: defaultCompany._id });
        if (!existingStore) {
            const storeCode = defaultCompany.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() + '-MAIN';
            await Store.create({
                name: `${defaultCompany.name} - Main Store`,
                code: storeCode,
                isDefault: true,
                isActive: true,
                companyId: defaultCompany._id,
            });
            console.log('   ✅ Created default store');
        } else {
            console.log(`   ✅ Default store already exists: "${existingStore.name}"`);
        }

        // ---------- 17. Ensure default Warehouse exists ----------
        console.log('🏭 Ensuring default warehouse exists...');
        const existingWarehouse = await Warehouse.findOne({ companyId: defaultCompany._id });
        if (!existingWarehouse) {
            const whCode = defaultCompany.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() + '-WH1';
            await Warehouse.create({
                name: `${defaultCompany.name} - Main Warehouse`,
                code: whCode,
                isDefault: true,
                isActive: true,
                companyId: defaultCompany._id,
            });
            console.log('   ✅ Created default warehouse');
        } else {
            console.log(`   ✅ Default warehouse already exists: "${existingWarehouse.name}"`);
        }

        // ---------- 18. Migrate Users ----------
        console.log('👤 Migrating Users...');
        const users = await User.find({ companyId: { $exists: false } });
        for (const u of users) {
             u.companyId = defaultCompany._id;
             await u.save({ validateBeforeSave: false });
        }
        console.log(`   ✅ Migrated ${users.length} users`);

        // ---------- 19. Migrate Companies ----------
        console.log('🏢 Ensuring Companies have default store/warehouse if missing...');
        // (Handled by the logic above for defaultCompany, but could be expanded for all companies)
        
        console.log('\n✅ Migration completed successfully!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
