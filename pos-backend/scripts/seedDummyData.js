const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Load models
const Company = require('../models/Company');
const Store = require('../models/Store');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Unit = require('../models/Unit');
const User = require('../models/User');
const ShopSettings = require('../models/ShopSettings');
const LoyaltySettings = require('../models/LoyaltySettings');

// Company data
const companiesData = [
    {
        name: 'QuickBite Fast Food',
        type: 'Fast Food',
        email: 'quickbite@example.com',
        phone: '+1-555-0101',
        address: '123 Main Street, Downtown',
        stores: [
            { name: 'QuickBite Downtown', code: 'QB-DT', address: '123 Main Street, Downtown', pincode: '10001' },
            { name: 'QuickBite Mall', code: 'QB-ML', address: '456 Shopping Mall, Food Court', pincode: '10002' }
        ],
        products: [
            { name: 'Classic Burger', category: 'Burgers', purchasePrice: 3.50, sellingPrice: 7.99, gstPercent: 5 },
            { name: 'Cheese Burger', category: 'Burgers', purchasePrice: 4.00, sellingPrice: 8.99, gstPercent: 5 },
            { name: 'Chicken Nuggets (6pcs)', category: 'Sides', purchasePrice: 2.50, sellingPrice: 5.49, gstPercent: 5 },
            { name: 'French Fries (Large)', category: 'Sides', purchasePrice: 1.50, sellingPrice: 3.99, gstPercent: 5 },
            { name: 'Coca Cola (500ml)', category: 'Beverages', purchasePrice: 0.80, sellingPrice: 2.49, gstPercent: 5 },
            { name: 'Pepsi (500ml)', category: 'Beverages', purchasePrice: 0.80, sellingPrice: 2.49, gstPercent: 5 },
            { name: 'Veggie Wrap', category: 'Wraps', purchasePrice: 3.00, sellingPrice: 6.99, gstPercent: 5 },
            { name: 'Chicken Wrap', category: 'Wraps', purchasePrice: 3.50, sellingPrice: 7.49, gstPercent: 5 },
            { name: 'Ice Cream Sundae', category: 'Desserts', purchasePrice: 1.50, sellingPrice: 4.49, gstPercent: 5 },
            { name: 'Apple Pie', category: 'Desserts', purchasePrice: 1.20, sellingPrice: 3.99, gstPercent: 5 }
        ],
        units: [
            { name: 'Piece', shortName: 'Pc' },
            { name: 'Pack', shortName: 'Pk' },
            { name: 'Bottle', shortName: 'Bt' }
        ]
    },
    {
        name: 'MediCare Pharmacy',
        type: 'Medicine',
        email: 'medicare@example.com',
        phone: '+1-555-0202',
        address: '789 Health Avenue, Medical District',
        stores: [
            { name: 'MediCare Main Store', code: 'MC-MS', address: '789 Health Avenue, Medical District', pincode: '20001' },
            { name: 'MediCare Express', code: 'MC-EX', address: '321 Community Center, Near Hospital', pincode: '20002' }
        ],
        products: [
            { name: 'Paracetamol 500mg', category: 'Pain Relief', purchasePrice: 2.00, sellingPrice: 5.99, gstPercent: 12 },
            { name: 'Ibuprofen 400mg', category: 'Pain Relief', purchasePrice: 3.00, sellingPrice: 7.49, gstPercent: 12 },
            { name: 'Vitamin C Tablets', category: 'Vitamins', purchasePrice: 5.00, sellingPrice: 12.99, gstPercent: 12 },
            { name: 'Multivitamin Complex', category: 'Vitamins', purchasePrice: 8.00, sellingPrice: 19.99, gstPercent: 12 },
            { name: 'Hand Sanitizer', category: 'Personal Care', purchasePrice: 1.50, sellingPrice: 4.49, gstPercent: 18 },
            { name: 'Face Mask (Pack of 10)', category: 'Personal Care', purchasePrice: 3.00, sellingPrice: 8.99, gstPercent: 18 },
            { name: 'Digital Thermometer', category: 'Medical Devices', purchasePrice: 10.00, sellingPrice: 24.99, gstPercent: 18 },
            { name: 'Blood Pressure Monitor', category: 'Medical Devices', purchasePrice: 25.00, sellingPrice: 59.99, gstPercent: 18 },
            { name: 'First Aid Kit', category: 'Emergency', purchasePrice: 8.00, sellingPrice: 19.99, gstPercent: 12 },
            { name: 'Bandages (Pack of 20)', category: 'Emergency', purchasePrice: 2.00, sellingPrice: 5.99, gstPercent: 12 }
        ],
        units: [
            { name: 'Tablet', shortName: 'Tab' },
            { name: 'Bottle', shortName: 'Bt' },
            { name: 'Pack', shortName: 'Pk' },
            { name: 'Piece', shortName: 'Pc' }
        ]
    },
    {
        name: 'TechWorld Electronics',
        type: 'Electronics',
        email: 'techworld@example.com',
        phone: '+1-555-0303',
        address: '456 Tech Park, Innovation Hub',
        stores: [
            { name: 'TechWorld Flagship', code: 'TW-FG', address: '456 Tech Park, Innovation Hub', pincode: '30001' },
            { name: 'TechWorld City Center', code: 'TW-CC', address: '789 Downtown Plaza, City Center', pincode: '30002' }
        ],
        products: [
            { name: 'Wireless Earbuds', category: 'Audio', purchasePrice: 15.00, sellingPrice: 39.99, gstPercent: 18 },
            { name: 'Bluetooth Speaker', category: 'Audio', purchasePrice: 20.00, sellingPrice: 49.99, gstPercent: 18 },
            { name: 'USB-C Cable', category: 'Accessories', purchasePrice: 3.00, sellingPrice: 9.99, gstPercent: 18 },
            { name: 'Phone Charger', category: 'Accessories', purchasePrice: 5.00, sellingPrice: 14.99, gstPercent: 18 },
            { name: 'Power Bank 10000mAh', category: 'Accessories', purchasePrice: 12.00, sellingPrice: 29.99, gstPercent: 18 },
            { name: 'Laptop Stand', category: 'Computer Accessories', purchasePrice: 10.00, sellingPrice: 24.99, gstPercent: 18 },
            { name: 'Wireless Mouse', category: 'Computer Accessories', purchasePrice: 8.00, sellingPrice: 19.99, gstPercent: 18 },
            { name: 'Keyboard', category: 'Computer Accessories', purchasePrice: 15.00, sellingPrice: 39.99, gstPercent: 18 },
            { name: 'Screen Protector', category: 'Mobile Accessories', purchasePrice: 2.00, sellingPrice: 7.99, gstPercent: 18 },
            { name: 'Phone Case', category: 'Mobile Accessories', purchasePrice: 3.00, sellingPrice: 12.99, gstPercent: 18 }
        ],
        units: [
            { name: 'Piece', shortName: 'Pc' },
            { name: 'Pack', shortName: 'Pk' }
        ]
    }
];

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos-system');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Create owner user for company
const createOwnerUser = async (companyId, companyName) => {
    const email = `owner.${companyName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
        console.log(`  Owner user already exists for ${companyName}`);
        return user;
    }

    user = await User.create({
        name: `Owner ${companyName}`,
        email: email,
        password: 'password123',
        role: 'owner',
        companyId: companyId,
        isApproved: true,
        status: 'active',
        permissions: [
            'dashboard', 'billing', 'products', 'inventory', 'expired-products',
            'units', 'customers', 'employees', 'suppliers', 'purchases',
            'order-tracking', 'reports', 'expenses', 'alerts', 'settings', 'warehouses'
        ]
    });

    console.log(`  Created owner user: ${email} / password: password123`);
    return user;
};

// Seed data function
const seedData = async () => {
    try {
        console.log('\n🌱 Starting database seeding...\n');

        // Clear existing data (optional - comment out if you want to keep existing)
        console.log('Clearing existing companies and related data...');
        
        // Get company IDs to delete
        const existingCompanies = await Company.find({
            email: { $in: companiesData.map(c => c.email) }
        });
        
        for (const company of existingCompanies) {
            await Store.deleteMany({ companyId: company._id });
            await Warehouse.deleteMany({ companyId: company._id });
            await Product.deleteMany({ companyId: company._id });
            await Unit.deleteMany({ companyId: company._id });
            await User.deleteMany({ companyId: company._id });
            await ShopSettings.deleteMany({ companyId: company._id });
            await LoyaltySettings.deleteMany({ companyId: company._id });
            await Company.findByIdAndDelete(company._id);
        }
        
        console.log('Existing data cleared.\n');

        // Create companies with their data
        for (const companyData of companiesData) {
            console.log(`🏢 Creating ${companyData.name} (${companyData.type})...`);

            // 1. Create Company
            const company = await Company.create({
                name: companyData.name,
                email: companyData.email,
                phone: companyData.phone,
                address: companyData.address,
                plan: 'premium',
                subscriptionStatus: 'active',
                isActive: true
            });
            console.log(`  ✓ Company created: ${company.name}`);

            // 2. Create Warehouse
            const warehouse = await Warehouse.create({
                name: 'Main Warehouse',
                code: `${companyData.stores[0].code.split('-')[0]}-WH`,
                address: companyData.address,
                companyId: company._id,
                isDefault: true,
                isActive: true
            });
            console.log(`  ✓ Warehouse created: ${warehouse.name}`);

            // 3. Create Units
            const unitMap = {};
            for (const unitData of companyData.units) {
                const unit = await Unit.create({
                    name: unitData.name,
                    shortName: unitData.shortName,
                    companyId: company._id,
                    isActive: true
                });
                unitMap[unitData.name] = unit._id;
                console.log(`  ✓ Unit created: ${unit.name}`);
            }

            // 4. Create Stores
            const stores = [];
            for (let i = 0; i < companyData.stores.length; i++) {
                const storeData = companyData.stores[i];
                const store = await Store.create({
                    name: storeData.name,
                    code: storeData.code,
                    address: storeData.address,
                    pincode: storeData.pincode,
                    companyId: company._id,
                    defaultWarehouseId: warehouse._id,
                    isDefault: i === 0,
                    isActive: true
                });
                stores.push(store);
                console.log(`  ✓ Store created: ${store.name}`);

                // 5. Create Products for each store
                for (const productData of companyData.products) {
                    const unitName = companyData.units[0].name; // Use first unit as default
                    
                    await Product.create({
                        name: productData.name,
                        category: productData.category,
                        purchasePrice: productData.purchasePrice,
                        sellingPrice: productData.sellingPrice,
                        gstPercent: productData.gstPercent,
                        stockQty: 10, // Basic stock of 10
                        warehouseStock: 50,
                        minStockLevel: 5,
                        unit: unitMap[unitName],
                        storeId: store._id,
                        companyId: company._id,
                        productType: 'Single',
                        isActive: true,
                        barcode: `BAR-${companyData.type.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                    });
                }
                console.log(`  ✓ ${companyData.products.length} products created for ${store.name}`);
            }

            // 6. Create Owner User
            const owner = await createOwnerUser(company._id, companyData.name);

            // 7. Update stores with manager
            for (const store of stores) {
                store.manager = owner._id;
                await store.save();
            }

            // 8. Create Shop Settings
            await ShopSettings.create({
                companyId: company._id,
                shopName: companyData.name,
                address: companyData.address,
                contact: companyData.phone,
                email: companyData.email
            });
            console.log(`  ✓ Shop settings created`);

            // 9. Create Loyalty Settings for each store
            for (const store of stores) {
                await LoyaltySettings.create({
                    companyId: company._id,
                    storeId: store._id,
                    isEnabled: true,
                    pointsPerRupee: 1,
                    rupeeValuePerPoint: 0.10
                });
            }
            console.log(`  ✓ Loyalty settings created for ${stores.length} stores`);

            console.log(`\n✅ ${companyData.name} setup complete!\n`);
        }

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   • ${companiesData.length} Companies created`);
        console.log(`   • ${companiesData.length * 2} Stores created (2 per company)`);
        console.log(`   • ${companiesData.length} Warehouses created`);
        console.log(`   • ${companiesData.length * 10} Products created (10 per store)`);
        console.log(`   • ${companiesData.length} Owner users created`);
        console.log('\n👤 Login credentials for testing:');
        companiesData.forEach(company => {
            const email = `owner.${company.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
            console.log(`   • ${company.name}: ${email} / password: password123`);
        });

        process.exit(0);
    } catch (error) {
        console.error(`\n❌ Error seeding data: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

// Run the seed function
const runSeed = async () => {
    await connectDB();
    await seedData();
};

runSeed();
