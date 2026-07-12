const express = require('express');
const router = express.Router();
const { createBillPayment, getAllBillPayments, updateBillPayment, deleteBillPayment } = require('../controllers/billPaymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createBillPayment);
router.get('/', protect, getAllBillPayments);
router.put('/:id', protect, updateBillPayment);
router.delete('/:id', protect, deleteBillPayment);

module.exports = router;