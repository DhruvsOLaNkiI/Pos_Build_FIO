const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdatePrice,
    bulkDeleteProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
    .get(getProducts)
    .post(authorize('owner', 'staff'), upload.array('images', 5), createProduct);

router.post('/bulk-update-price', authorize('owner'), bulkUpdatePrice);
router.delete('/bulk', authorize('owner', 'staff'), bulkDeleteProducts);

router.route('/:id')
    .get(getProduct)
    .put(authorize('owner', 'staff'), upload.single('image'), updateProduct)
    .delete(authorize('owner'), deleteProduct);

module.exports = router;
