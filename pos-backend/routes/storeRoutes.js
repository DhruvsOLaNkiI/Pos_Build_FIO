const express = require('express');
const {
    getStores,
    getStore,
    createStore,
    updateStore,
    deleteStore
} = require('../controllers/storeController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
    .get(getStores)
    .post(createStore);

router.route('/:id')
    .get(getStore)
    .put(updateStore)
    .delete(deleteStore);

module.exports = router;
