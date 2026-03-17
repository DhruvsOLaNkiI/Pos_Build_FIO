const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAlerts } = require('../controllers/alertController');

router.use(protect);

router.get('/', getAlerts);

module.exports = router;
