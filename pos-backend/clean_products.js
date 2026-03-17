const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos-system').then(async () => {
    const Product = require('./models/Product');
    const allProducts = await Product.find();

    let deletedCount = 0;
    for (const p of allProducts) {
        if (!p.name || p.name.trim() === '') {
            await Product.findByIdAndDelete(p._id);
            deletedCount++;
        }
    }

    console.log(`Successfully deleted ${deletedCount} ghost products with empty names.`);
    process.exit(0);
}).catch(console.error);
