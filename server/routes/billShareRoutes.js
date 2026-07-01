const express = require('express');
const router = express.Router();
const { markBillSharePaid, getAllBillShares } = require('../controllers/billShareController');
const { protect } = require('../middlewares/authMiddleware');

router.put('/:id',protect, markBillSharePaid);
router.get('/', protect, getAllBillShares);

module.exports = router; 