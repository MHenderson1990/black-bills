const express = require('express');
const router = express.Router();
const { createDebtPayment, getAllDebtPayments, getDebtPaymentById, updateDebtPayment, deleteDebtPayment } = require('../controllers/debtPaymentController');
const { protect } = require('../middlewares/authMiddleware');

// 5 routes go here
router.post('/',protect, createDebtPayment);
router.get('/',protect, getAllDebtPayments);
router.get('/:id',protect, getDebtPaymentById);
router.put('/:id',protect, updateDebtPayment);
router.delete('/:id',protect, deleteDebtPayment);

module.exports = router; 