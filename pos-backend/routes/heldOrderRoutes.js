const express = require('express');
const router = express.Router();
const {
    createHeldOrder,
    getHeldOrders,
    deleteHeldOrder
} = require('../controllers/heldOrderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes require login

router.route('/')
    .post(createHeldOrder)
    .get(getHeldOrders);

router.route('/:id')
    .delete(deleteHeldOrder);

module.exports = router;
