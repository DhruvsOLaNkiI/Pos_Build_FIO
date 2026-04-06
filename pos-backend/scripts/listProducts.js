const mongoose = require('mongoose');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pos-system')
    .then(async () => {
        const products = await Product.find({})
            .select('name category brand sellingPrice stockQty imageUrl')
            .sort({ category: 1, name: 1 });

        console.log('\n📦 TOTAL PRODUCTS:', products.length);
        console.log('═══════════════════════════════════════════════════════════════\n');

        let currentCategory = '';
        products.forEach((p, i) => {
            if (p.category !== currentCategory) {
                currentCategory = p.category;
                console.log('\n🏷️  CATEGORY:', currentCategory.toUpperCase());
                console.log('─────────────────────────────────────────────────────────────');
            }
            const hasImage = p.imageUrl ? '✅' : '❌';
            console.log(`${i + 1}. ${hasImage} ${p.name} (₹${p.sellingPrice}) - Stock: ${p.stockQty}`);
        });

        console.log('\n═══════════════════════════════════════════════════════════════');
        const withImages = products.filter(p => p.imageUrl).length;
        console.log(`✅ With Images: ${withImages} | ❌ Without Images: ${products.length - withImages}`);

        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
