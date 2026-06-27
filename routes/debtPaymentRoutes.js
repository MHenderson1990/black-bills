const express = require('express');
const router = express.Router();
const { createDebtPayment, getAllDebtPayments, getDebtPaymentById, updateDebtPayment, deleteDebtPayment } = require('../controllers/debtPaymentController');

// 5 routes go here
router.post('/',createDebtPayment);
router.get('/',getAllDebtPayments);
router.get('/:id',getDebtPaymentById);
router.put('/:id',updateDebtPayment);
router.delete('/:id',deleteDebtPayment);

module.exports = router; 