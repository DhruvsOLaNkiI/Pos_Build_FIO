require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Purchase = require('./models/Purchase');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Set all existing purchases to 'delivered' since their stock was already added
        const result = await Purchase.updateMany(
            { deliveryStatus: { $exists: false } },
            {
                $set: {
                    deliveryStatus: 'delivered',
                    deliveredAt: new Date()
                }
            }
        );

        console.log(`Migrated ${result.modifiedCount} existing purchases to 'delivered' status.`);

        // Also set purchases that have deliveryStatus but not 'delivered'
        // (in case of partial migration)
        const result2 = await Purchase.updateMany(
            { deliveryStatus: { $in: [null, undefined] } },
            {
                $set: {
                    deliveryStatus: 'delivered',
                    deliveredAt: new Date()
                }
            }
        );

        if (result2.modifiedCount > 0) {
            console.log(`Additional ${result2.modifiedCount} purchases migrated.`);
        }

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrate();
