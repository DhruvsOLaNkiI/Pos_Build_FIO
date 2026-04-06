const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Sale = require('../models/Sale');
const Store = require('../models/Store');
const Company = require('../models/Company');
const {
    createSale,
    getSales,
    getSale,
    processReturn
} = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSales)
    .post(authorize('owner', 'cashier'), createSale);

router.route('/:id')
    .get(getSale);

router.route('/:id/return')
    .put(authorize('owner', 'cashier'), processReturn);

// @desc    Download transaction as PDF
// @route   GET /api/sales/:id/pdf
// @access  Private (Owner, Staff, Cashier)
router.get('/:id/pdf', authorize('owner', 'staff', 'cashier'), async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('seller', 'name')
            .populate('storeId', 'name address pincode contactNumber')
            .populate('companyId', 'name address phone email');

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${sale.invoiceNo || sale._id}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);

        // Header - Company Info
        doc.fontSize(20).font('Helvetica-Bold').text(sale.companyId?.name || 'POS SYSTEM', 50, 50);
        doc.fontSize(10).font('Helvetica');
        if (sale.companyId?.address) doc.text(sale.companyId.address, 50, 75);
        if (sale.companyId?.phone) doc.text(`Phone: ${sale.companyId.phone}`, 50, 90);
        if (sale.companyId?.email) doc.text(`Email: ${sale.companyId.email}`, 50, 105);

        // Invoice Title
        doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice No: ${sale.invoiceNo || 'N/A'}`, 400, 75, { align: 'right' });
        doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' });
        doc.text(`Time: ${new Date(sale.createdAt).toLocaleTimeString('en-IN')}`, 400, 105, { align: 'right' });

        // Separator line
        doc.moveTo(50, 130).lineTo(550, 130).stroke();

        // Store Info
        doc.fontSize(12).font('Helvetica-Bold').text('Store Details', 50, 150);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Store: ${sale.storeId?.name || 'N/A'}`, 50, 170);
        if (sale.storeId?.address) doc.text(`Address: ${sale.storeId.address}`, 50, 185);
        if (sale.storeId?.pincode) doc.text(`Pincode: ${sale.storeId.pincode}`, 50, 200);

        // Cashier Info
        doc.text(`Cashier: ${sale.seller?.name || 'Unknown'}`, 350, 170);

        // Separator line
        doc.moveTo(50, 220).lineTo(550, 220).stroke();

        // Items Table Header
        let y = 240;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', 50, y);
        doc.text('Price', 250, y, { align: 'right' });
        doc.text('Qty', 320, y, { align: 'right' });
        doc.text('GST', 380, y, { align: 'right' });
        doc.text('Total', 450, y, { align: 'right' });

        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();

        // Items
        doc.fontSize(10).font('Helvetica');
        y += 25;
        sale.items.forEach((item, index) => {
            // Check if we need a new page
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            
            doc.text(item.name || 'Unknown Item', 50, y, { width: 180 });
            doc.text(`₹${(item.price || 0).toFixed(2)}`, 250, y, { align: 'right' });
            doc.text(`${item.quantity || 0}`, 320, y, { align: 'right' });
            doc.text(`${item.gstPercent || 0}%`, 380, y, { align: 'right' });
            doc.text(`₹${(item.total || 0).toFixed(2)}`, 450, y, { align: 'right' });
            
            y += 20;
        });

        // Separator line
        doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
        y += 20;

        // Summary
        doc.fontSize(10).font('Helvetica');
        doc.text('Subtotal:', 350, y);
        doc.text(`₹${(sale.subtotal || 0).toFixed(2)}`, 450, y, { align: 'right' });
        y += 20;

        doc.text('GST:', 350, y);
        doc.text(`₹${(sale.totalGST || 0).toFixed(2)}`, 450, y, { align: 'right' });
        y += 20;

        if (sale.discount > 0) {
            doc.text('Discount:', 350, y);
            doc.text(`-₹${(sale.discount || 0).toFixed(2)}`, 450, y, { align: 'right' });
            y += 20;
        }

        // Total
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Grand Total:', 350, y);
        doc.text(`₹${(sale.grandTotal || 0).toFixed(2)}`, 450, y, { align: 'right' });

        // Payment Method
        y += 30;
        doc.fontSize(10).font('Helvetica');
        const paymentMethod = sale.paymentMethods?.map(pm => pm.method).join(', ') || sale.paymentMethod || 'Unknown';
        doc.text(`Payment Method: ${paymentMethod}`, 50, y);

        // Return Status
        if (sale.returnStatus && sale.returnStatus !== 'normal') {
            y += 20;
            doc.text(`Return Status: ${sale.returnStatus.toUpperCase()}`, 50, y);
        }

        // Footer
        doc.fontSize(9).font('Helvetica');
        doc.text('Thank you for your business!', 50, 750, { align: 'center' });
        doc.text('This is a computer generated invoice.', 50, 765, { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
});

module.exports = router;
