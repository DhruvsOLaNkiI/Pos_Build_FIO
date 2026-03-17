const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Store = require('../models/Store');
const { geocodePincode } = require('../utils/geocoder');

const migrateStores = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const stores = await Store.find({});
        console.log(`Found ${stores.length} stores to check.`);

        for (const store of stores) {
            if (store.pincode && store.location.coordinates[0] === 0 && store.location.coordinates[1] === 0) {
                console.log(`Geocoding store ${store.name} with pincode: ${store.pincode}`);
                const coords = await geocodePincode(store.pincode);
                
                if (coords) {
                    store.location = {
                        type: 'Point',
                        coordinates: [coords.lng, coords.lat]
                    };
                    await store.save();
                    console.log(`✅ Updated ${store.name}`);
                } else {
                    console.log(`❌ Failed to geocode ${store.name}`);
                }
            } else {
                console.log(`⏭️  Skipping ${store.name} (already has coords or no pincode)`);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateStores();
