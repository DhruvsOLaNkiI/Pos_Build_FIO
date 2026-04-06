const mongoose = require('mongoose');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pos-system')
    .then(async () => {
        // Get ALL products with store info
        const products = await Product.find({})
            .populate('storeId', 'name code companyId')
            .select('name category brand sellingPrice stockQty imageUrl storeId');

        console.log('\n📦 ALL PRODUCTS IN DATABASE:', products.length);
        console.log('═══════════════════════════════════════════════════════════════\n');

        let currentCategory = '';
        products.forEach((p, i) => {
            if (p.category !== currentCategory) {
                currentCategory = p.category;
                console.log('\n🏷️  CATEGORY:', currentCategory ? currentCategory.toUpperCase() : 'UNKNOWN');
                console.log('─────────────────────────────────────────────────────────────');
            }
            const hasImage = p.imageUrl ? '✅' : '❌';
            const storeName = p.storeId ? p.storeId.name : 'No Store';
            console.log(`${i + 1}. ${hasImage} ${p.name} (₹${p.sellingPrice}) - Store: ${storeName}`);
        });

        console.log('\n═══════════════════════════════════════════════════════════════');
        const withImages = products.filter(p => p.imageUrl).length;
        const withoutImages = products.length - withImages;
        console.log(`✅ With Images: ${withImages} | ❌ Without Images: ${withoutImages}`);

        if (withoutImages > 0) {
            console.log('\n📝 Products needing images:');
            products.filter(p => !p.imageUrl).forEach(p => {
                console.log(`   - ${p.name} (${p.category})`);
            });
        }

        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
