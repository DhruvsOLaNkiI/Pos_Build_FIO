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

router.route('/:id')
    .get(getProduct)
    .put(authorize('owner', 'staff'), upload.single('image'), updateProduct)
    .delete(authorize('owner'), deleteProduct);

module.exports = router;
