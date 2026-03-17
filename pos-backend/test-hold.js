const mongoose = require('mongoose');
const HeldOrder = require('./models/HeldOrder');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const doc = new HeldOrder({
            cart: [{
                product: new mongoose.Types.ObjectId(),
                name: 'Test',
                price: 100,
                quantity: 1
            }],
            subtotal: 100,
            total: 100,
            cashier: new mongoose.Types.ObjectId()
        });
        await doc.validate();
        console.log("Validation passed");
    } catch (err) {
        console.log("Validation failed:", err.message);
    }
    process.exit(0);
});
