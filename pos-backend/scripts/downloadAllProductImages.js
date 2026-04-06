const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Product = require('../models/Product');

// Connect to MongoDB (no deprecated options)
mongoose.connect('mongodb://localhost:27017/pos-system');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to download image from URL
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(filepath);
                });
            } else {
                reject(new Error(`Download failed with status ${response.statusCode}`));
            }
        }).on('error', reject);
    });
};

// Sample product images by category AND product name
const getProductImage = (category, productName) => {
    const name = productName.toLowerCase();
    
    // Product-specific images
    const productSpecificImages = {
        'running sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        'wireless headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        'smart watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        'cotton t-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        'organic coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        'stainless steel bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        'yoga mat': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
        'bluetooth speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'
    };
    
    // Check for product-specific image
    for (const [key, url] of Object.entries(productSpecificImages)) {
        if (name.includes(key)) return url;
    }
    
    // Category-based fallback
    const categoryImages = {
        'Footwear': ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
        'Electronics': ['https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=400'],
        'Clothing': ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        'Beverages': ['https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'],
        'Home': ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'],
        'Health': ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'],
        'Fast Food': ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'],
        'Medicine': ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400']
    };
    
    const images = categoryImages[category] || ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'];
    return images[0];
};

// Download for ALL products (including existing ones)
const downloadAllProductImages = async () => {
    try {
        console.log('🔍 Fetching ALL products from database...\n');
        
        const products = await Product.find({});
        
        if (products.length === 0) {
            console.log('⚠️  No products found');
            return;
        }

        console.log(`📦 Total products: ${products.length}\n`);
        
        let successCount = 0;
        let skipCount = 0;

        for (const product of products) {
            try {
                console.log(`📥 Processing: ${product.name} (${product.category || 'No Category'})`);
                
                // Get image URL based on product name and category
                const imageUrl = getProductImage(product.category, product.name);
                
                // Create filename using product ID
                const filename = `${product._id.toString()}.jpg`;
                const filepath = path.join(uploadsDir, filename);
                
                // Download image (overwrite if exists)
                await downloadImage(imageUrl, filepath);
                
                // Update product
                const localImageUrl = `/uploads/products/${filename}`;
                product.imageUrl = localImageUrl;
                await product.save();
                
                console.log(`✅ ${product.name} -> ${localImageUrl}`);
                successCount++;
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.error(`❌ Failed: ${product.name} - ${error.message}`);
            }
        }

        console.log(`\n🎉 Complete! ✅ ${successCount} images downloaded/updated`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Done');
    }
};

downloadAllProductImages();
