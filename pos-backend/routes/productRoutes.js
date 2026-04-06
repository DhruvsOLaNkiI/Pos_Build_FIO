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
const {
    exportProductsCsv,
    importProductsCsv,
    downloadCsvTemplate
} = require('../controllers/csvController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const csvUpload = require('../middleware/csvUpload');

router.use(protect);

router.route('/')
    .get(getProducts)
    .post(authorize('owner', 'staff'), upload.array('images', 5), createProduct);

// CSV Import / Export
router.get('/export-csv', authorize('owner', 'staff'), exportProductsCsv);
router.get('/csv-template', downloadCsvTemplate);
router.post('/import-csv', authorize('owner', 'staff'), csvUpload.single('csvFile'), importProductsCsv);

router.post('/bulk-update-price', authorize('owner'), bulkUpdatePrice);
router.delete('/bulk', authorize('owner', 'staff'), bulkDeleteProducts);

// Image upload endpoint for existing products
router.post('/:id/upload-image', authorize('owner', 'staff'), upload.single('image'), async (req, res) => {
    try {
        const Product = require('../models/Product');
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }
        
        // Update product with new image URL
        const imageUrl = `/uploads/products/${req.file.filename}`;
        product.imageUrl = imageUrl;
        await product.save();
        
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: { imageUrl }
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
});

router.route('/:id')
    .get(getProduct)
    .put(authorize('owner', 'staff'), upload.single('image'), updateProduct)
    .delete(authorize('owner'), deleteProduct);

module.exports = router;
