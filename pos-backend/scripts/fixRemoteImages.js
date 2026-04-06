const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pos-system')
    .then(async () => {
        const Product = require('../models/Product');
        
        // Find products with remote URLs
        const products = await Product.find({
            imageUrl: { $regex: '^https://' }
        });
        
        console.log(`Found ${products.length} products with remote URLs\n`);
        
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
        
        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            const filename = `product-fixed-${Date.now()}-${i}.jpg`;
            const filepath = path.join(uploadsDir, filename);
            const localUrl = `/uploads/products/${filename}`;
            
            console.log(`[${i + 1}/${products.length}] ${p.name}`);
            
            try {
                // Download image
                await new Promise((resolve, reject) => {
                    https.get(p.imageUrl, (res) => {
                        if (res.statusCode === 200) {
                            const file = fs.createWriteStream(filepath);
                            res.pipe(file);
                            file.on('finish', () => { file.close(); resolve(); });
                        } else {
                            reject(new Error(`Status ${res.statusCode}`));
                        }
                    }).on('error', reject);
                });
                
                // Update product
                p.imageUrl = localUrl;
                await p.save();
                console.log(`   ✅ ${localUrl}\n`);
                
                // Small delay
                await new Promise(r => setTimeout(r, 200));
                
            } catch (err) {
                console.log(`   ❌ Error: ${err.message}\n`);
            }
        }
        
        console.log('🎉 Done! Refresh the Home Page to see images.');
        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
