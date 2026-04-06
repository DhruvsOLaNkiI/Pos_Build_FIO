const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pos-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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

// Sample product images by category (using placeholder images)
const getCategoryImage = (category, productName) => {
    const categoryImages = {
        'Food': [
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
        ],
        'Dairy': [
            'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
            'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
            'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'
        ],
        'Beverages': [
            'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
            'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
            'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400'
        ],
        'Chocolates': [
            'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400',
            'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400',
            'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400'
        ],
        'Snacks': [
            'https://images.unsplash.com/photo-1566478989037-eec170784d0d?w=400',
            'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400',
            'https://images.unsplash.com/photo-1604467707321-70c1b85d7cd6?w=400'
        ],
        'Grocery': [
            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
            'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=400',
            'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400'
        ],
        'Biscuits': [
            'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
            'https://images.unsplash.com/photo-1590080875515-8a30e4e8e8c7?w=400',
            'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400'
        ],
        'Electronics': [
            'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=400',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
        ],
        'Headphones': [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400'
        ],
        'Footwear': [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400'
        ],
        'Clothing': [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'
        ],
        'Home': [
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
            'https://images.unsplash.com/photo-1583847661884-38e125a3be21?w=400',
            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
        ],
        'Medicine': [
            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
            'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
            'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400'
        ],
        'Health': [
            'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
            'https://images.unsplash.com/photo-1505751172876-fa1923c5c03f?w=400',
            'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400'
        ],
        'Personal Care': [
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
            'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400',
            'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'
        ],
        'Atta': [
            'https://images.unsplash.com/photo-1626202267824-81c3df7951d5?w=400',
            'https://images.unsplash.com/photo-1610725664285-6c57e5c0e3d8?w=400',
            'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400'
        ],
        'Rice': [
            'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
            'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400',
            'https://images.unsplash.com/photo-1596910547037-846b1980329f?w=400'
        ],
        'Coffee': [
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'
        ],
        'Watch': [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400',
            'https://images.unsplash.com/photo-1434051-6118-9e26-9a5c?w=400'
        ],
        'Water Bottle': [
            'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
            'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=400'
        ],
        'default': [
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
            'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
        ]
    };

    const images = categoryImages[category] || categoryImages['default'];
    // Return a random image from the category
    return images[Math.floor(Math.random() * images.length)];
};

// Function to fetch and download images for products
const downloadProductImages = async () => {
    try {
        console.log('🔍 Fetching products from database...\n');
        
        // Get all products
        const products = await Product.find({});
        
        if (products.length === 0) {
            console.log('⚠️  No products found in database');
            return;
        }

        console.log(`📦 Found ${products.length} products\n`);
        
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            // Skip if product already has an image
            if (product.imageUrl && product.imageUrl.trim() !== '') {
                console.log(`⏭️  Skipping ${product.name} - already has image`);
                continue;
            }

            try {
                console.log(`📥 Downloading image for: ${product.name} (${product.category})`);
                
                // Get appropriate image URL based on category
                const imageUrl = getCategoryImage(product.category, product.name);
                
                // Create filename
                const filename = `${product._id.toString()}.jpg`;
                const filepath = path.join(uploadsDir, filename);
                
                // Download image
                await downloadImage(imageUrl, filepath);
                
                // Update product with local image URL
                const localImageUrl = `/uploads/products/${filename}`;
                product.imageUrl = localImageUrl;
                await product.save();
                
                console.log(`✅ Success: ${product.name} -> ${localImageUrl}`);
                successCount++;
                
                // Add small delay to be nice to the image server
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Failed: ${product.name} - ${error.message}`);
                failCount++;
            }
        }

        console.log(`\n🎉 Download complete!`);
        console.log(`✅ Successfully downloaded: ${successCount} images`);
        console.log(`❌ Failed: ${failCount} images`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
};

// Run the download
downloadProductImages();
