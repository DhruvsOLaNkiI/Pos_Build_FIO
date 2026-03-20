const mongoose = require('mongoose');
const Company = require('../models/Company');
const Store = require('../models/Store');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Unit = require('../models/Unit');
const User = require('../models/User');
const ShopSettings = require('../models/ShopSettings');
const LoyaltySettings = require('../models/LoyaltySettings');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pos-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const deleteDummyData = async () => {
    try {
        console.log('🗑️  Starting to delete dummy data...\n');

        // Company names that were seeded
        const seededCompanyNames = [
            'QuickBite Fast Food',
            'MediCare Pharmacy', 
            'TechWorld Electronics'
        ];

        // Find companies to delete
        const companiesToDelete = await Company.find({ 
            name: { $in: seededCompanyNames }
        });

        if (companiesToDelete.length === 0) {
            console.log('⚠️  No seeded companies found to delete');
            return;
        }

        const companyIds = companiesToDelete.map(c => c._id);
        console.log(`📋 Found ${companiesToDelete.length} companies to delete:`);
        companiesToDelete.forEach(c => console.log(`   - ${c.name}`));

        // Get all stores for these companies
        const storesToDelete = await Store.find({ 
            companyId: { $in: companyIds }
        });
        const storeIds = storesToDelete.map(s => s._id);

        // Get all warehouses for these companies
        const warehousesToDelete = await Warehouse.find({ 
            companyId: { $in: companyIds }
        });
        const warehouseIds = warehousesToDelete.map(w => w._id);

        console.log(`\n📦 Found ${storesToDelete.length} stores to delete`);
        console.log(`🏭 Found ${warehousesToDelete.length} warehouses to delete`);

        // Delete in correct order (to avoid foreign key constraints)

        // 1. Delete LoyaltySettings
        const loyaltyResult = await LoyaltySettings.deleteMany({ 
            companyId: { $in: companyIds }
        });
        console.log(`✅ Deleted ${loyaltyResult.deletedCount} loyalty settings`);

        // 2. Delete ShopSettings
        const shopSettingsResult = await ShopSettings.deleteMany({ 
            companyId: { $in: companyIds }
        });
        console.log(`✅ Deleted ${shopSettingsResult.deletedCount} shop settings`);

        // 3. Delete Products
        const productResult = await Product.deleteMany({ 
            storeId: { $in: storeIds }
        });
        console.log(`✅ Deleted ${productResult.deletedCount} products`);

        // 4. Delete Units
        const unitResult = await Unit.deleteMany({ 
            companyId: { $in: companyIds }
        });
        console.log(`✅ Deleted ${unitResult.deletedCount} units`);

        // 5. Delete Users (owners) for these companies
        const userResult = await User.deleteMany({ 
            companyId: { $in: companyIds }
        });
        console.log(`✅ Deleted ${userResult.deletedCount} users`);

        // 6. Delete Stores
        const storeResult = await Store.deleteMany({ 
            companyId: { $in: companyIds }
        });
        console.log(`✅ Deleted ${storeResult.deletedCount} stores`);

        // 7. Delete Warehouses
        const warehouseResult = await Warehouse.deleteMany({ 
            companyId: { $in: companyIds }
        });
        console.log(`✅ Deleted ${warehouseResult.deletedCount} warehouses`);

        // 8. Finally delete Companies
        const companyResult = await Company.deleteMany({ 
            name: { $in: seededCompanyNames }
        });
        console.log(`✅ Deleted ${companyResult.deletedCount} companies`);

        console.log('\n🎉 All dummy data has been successfully deleted!');
        
    } catch (error) {
        console.error('❌ Error deleting dummy data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
};

// Run the deletion
deleteDummyData();
