const Product = require('../models/Product');
const csvParser = require('csv-parser');
const { Parser: Json2CsvParser } = require('json2csv');
const fs = require('fs');

// @desc    Export products as CSV
// @route   GET /api/products/export-csv
// @access  Private (Owner/Staff)
const exportProductsCsv = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];

        let query = {};
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        if (storeId) {
            query.storeId = storeId;
        }

        const products = await Product.find(query).populate('unit').lean();

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found to export' });
        }

        const csvFields = [
            'name',
            'variant',
            'category',
            'brand',
            'unit',
            'purchasePrice',
            'sellingPrice',
            'gstPercent',
            'stockQty',
            'minStockLevel',
            'barcode',
            'manufacturer',
            'warranty',
            'isActive'
        ];

        const csvData = products.map(p => ({
            name: p.name || '',
            variant: p.variant || '',
            category: p.category || '',
            brand: p.brand || '',
            unit: p.unit?.shortName || p.unit?.name || '',
            purchasePrice: p.purchasePrice || 0,
            sellingPrice: p.sellingPrice || 0,
            gstPercent: p.gstPercent || 0,
            stockQty: p.stockQty || 0,
            minStockLevel: p.minStockLevel || 10,
            barcode: p.barcode || '',
            manufacturer: p.manufacturer || '',
            warranty: p.warranty || '',
            isActive: p.isActive !== false ? 'true' : 'false'
        }));

        const json2csvParser = new Json2CsvParser({ fields: csvFields });
        const csv = json2csvParser.parse(csvData);

        res.header('Content-Type', 'text/csv');
        res.attachment(`products_export_${Date.now()}.csv`);
        return res.send(csv);
    } catch (error) {
        next(error);
    }
};

// @desc    Import products from CSV
// @route   POST /api/products/import-csv
// @access  Private (Owner/Staff)
const importProductsCsv = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
        }

        const storeId = req.headers['x-store-id'];
        if (!storeId) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Store context is required. Please select a store.' });
        }

        const results = [];
        const errors = [];
        let rowNumber = 0;

        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csvParser({
                    mapHeaders: ({ header }) => header.trim().toLowerCase()
                }))
                .on('data', (row) => {
                    rowNumber++;
                    try {
                        // Validate required fields
                        if (!row.name || !row.name.trim()) {
                            errors.push({ row: rowNumber, message: 'Missing product name' });
                            return;
                        }
                        if (!row.category || !row.category.trim()) {
                            errors.push({ row: rowNumber, message: `Missing category for "${row.name}"` });
                            return;
                        }
                        if (!row.purchaseprice && !row['purchaseprice'] && !row['purchase price']) {
                            errors.push({ row: rowNumber, message: `Missing purchase price for "${row.name}"` });
                            return;
                        }
                        if (!row.sellingprice && !row['sellingprice'] && !row['selling price']) {
                            errors.push({ row: rowNumber, message: `Missing selling price for "${row.name}"` });
                            return;
                        }

                        const productData = {
                            name: row.name.trim(),
                            variant: (row.variant || '').trim(),
                            category: row.category.trim(),
                            brand: (row.brand || '').trim(),
                            purchasePrice: parseFloat(row.purchaseprice || row['purchaseprice'] || row['purchase price']) || 0,
                            sellingPrice: parseFloat(row.sellingprice || row['sellingprice'] || row['selling price']) || 0,
                            gstPercent: parseFloat(row.gstpercent || row['gstpercent'] || row['gst percent'] || row['gst%']) || 0,
                            stockQty: parseInt(row.stockqty || row['stockqty'] || row['stock qty'] || row['stock']) || 0,
                            minStockLevel: parseInt(row.minstocklevel || row['minstocklevel'] || row['min stock level'] || row['min stock']) || 10,
                            barcode: (row.barcode || '').trim() || undefined,
                            manufacturer: (row.manufacturer || '').trim(),
                            warranty: (row.warranty || '').trim(),
                            isActive: row.isactive !== 'false',
                            storeId,
                            companyId: req.user.companyId
                        };

                        results.push(productData);
                    } catch (err) {
                        errors.push({ row: rowNumber, message: err.message });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid products found in CSV',
                errors
            });
        }

        // Insert all valid products
        const inserted = await Product.insertMany(results, { ordered: false }).catch(err => {
            // Handle partial inserts with duplicate keys etc.
            if (err.insertedDocs) return err.insertedDocs;
            throw err;
        });

        const insertedCount = Array.isArray(inserted) ? inserted.length : 0;

        res.status(201).json({
            success: true,
            message: `Successfully imported ${insertedCount} products`,
            imported: insertedCount,
            errors: errors.length > 0 ? errors : undefined,
            totalRows: rowNumber
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

// @desc    Download a sample CSV template
// @route   GET /api/products/csv-template
// @access  Private
const downloadCsvTemplate = async (req, res) => {
    const fields = [
        'name', 'variant', 'category', 'brand', 'purchasePrice',
        'sellingPrice', 'gstPercent', 'stockQty', 'minStockLevel',
        'barcode', 'manufacturer', 'warranty'
    ];

    const sampleData = [{
        name: 'Sample Product',
        variant: '500ml',
        category: 'Beverages',
        brand: 'SampleBrand',
        purchasePrice: 40,
        sellingPrice: 50,
        gstPercent: 18,
        stockQty: 100,
        minStockLevel: 10,
        barcode: '1234567890123',
        manufacturer: 'Sample Mfg',
        warranty: '6 months'
    }];

    const json2csvParser = new Json2CsvParser({ fields });
    const csv = json2csvParser.parse(sampleData);

    res.header('Content-Type', 'text/csv');
    res.attachment('product_import_template.csv');
    return res.send(csv);
};

module.exports = {
    exportProductsCsv,
    importProductsCsv,
    downloadCsvTemplate
};
