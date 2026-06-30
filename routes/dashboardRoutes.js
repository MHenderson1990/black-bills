const express = require('express');
const router = express.Router();
const { getSpendingByCategory } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// 5 routes go here
router.get('/',protect, getSpendingByCategory);


module.exports = router; 