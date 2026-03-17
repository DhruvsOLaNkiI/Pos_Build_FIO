/**
 * Migration: Extract weight/volume/flavour from product names into the `variant` field.
 * 
 * Examples:
 *   "Amul Butter 100g"       → name: "Amul Butter",       variant: "100g"
 *   "Amul Gold Milk 500ml"   → name: "Amul Gold Milk",    variant: "500ml"
 *   "Aashirvaad Atta 5kg"    → name: "Aashirvaad Atta",   variant: "5kg"
 *   "Bingo Mad Angles 72.5g" → name: "Bingo Mad Angles",  variant: "72.5g"
 *   "Coca Cola 750ml"        → name: "Coca Cola",          variant: "750ml"
 *   "Red Bulb 9W LED"        → name: "Red Bulb 9W LED"    (no match — kept as-is)
 *
 * Run once:  node migrateProductVariants.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Regex to extract trailing weight/volume patterns like 100g, 500ml, 5kg, 1L, 72.5g, 200ml, etc.
// Also captures patterns like "1.5 Kg", "250 ml" with optional space
const WEIGHT_REGEX = /\s+(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|kgs|ml|l|ltr|litre|litres|liter|liters)\s*$/i;

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const products = await Product.find();
        console.log(`Found ${products.length} products to check.\n`);

        let updated = 0;
        let skipped = 0;

        for (const product of products) {
            const match = product.name.match(WEIGHT_REGEX);

            if (match) {
                const quantity = match[1]; // e.g. "100"
                const unit = match[2].toLowerCase(); // e.g. "g"

                // Normalize unit names
                let normalizedUnit = unit;
                if (['g', 'gm', 'gms', 'gram', 'grams'].includes(unit)) normalizedUnit = 'g';
                else if (['kg', 'kgs'].includes(unit)) normalizedUnit = 'Kg';
                else if (['ml'].includes(unit)) normalizedUnit = 'ml';
                else if (['l', 'ltr', 'litre', 'litres', 'liter', 'liters'].includes(unit)) normalizedUnit = 'L';

                const variantStr = `${quantity}${normalizedUnit}`;
                const cleanName = product.name.replace(WEIGHT_REGEX, '').trim();

                // Only set variant if it wasn't already set
                if (!product.variant || product.variant === '') {
                    product.variant = variantStr;
                }
                product.name = cleanName;

                await product.save();
                console.log(`  ✏️  "${product.name}" → variant: "${variantStr}"`);
                updated++;
            } else {
                console.log(`  ⏩ "${product.name}" — no weight/volume found, skipping`);
                skipped++;
            }
        }

        // Now mark products that share the same name as 'Variable' type
        const allProducts = await Product.find();
        const nameGroups = {};
        allProducts.forEach(p => {
            const key = p.name.trim().toLowerCase();
            if (!nameGroups[key]) nameGroups[key] = [];
            nameGroups[key].push(p);
        });

        let grouped = 0;
        for (const [name, group] of Object.entries(nameGroups)) {
            if (group.length > 1) {
                for (const p of group) {
                    if (p.productType !== 'Variable') {
                        p.productType = 'Variable';
                        await p.save();
                        grouped++;
                    }
                }
                console.log(`\n  🔗 Grouped "${group[0].name}" — ${group.length} variants marked as Variable`);
            }
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Migration complete!`);
        console.log(`   Updated: ${updated} products`);
        console.log(`   Skipped: ${skipped} products`);
        console.log(`   Grouped: ${grouped} products marked as Variable`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    }
};

run();
