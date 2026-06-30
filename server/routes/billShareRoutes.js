const express = require('express');
const router = express.Router();
const { markBillSharePaid } = require('../controllers/billShareController');
const { protect } = require('../middlewares/authMiddleware');

router.put('/:id',protect, markBillSharePaid);

module.exports = router; 