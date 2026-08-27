const express = require('express');
const router = express.Router();
const { createDebtTransaction, getAllDebtTransactions, getDebtTransactionById, updateDebtTransaction, 
    deleteDebtTransaction, markTransactionPaid, getMySharedCharges, payTransactionPartial, getTransactionPayments, 
    getOwedByMemberForDebt } = require('../controllers/debtTransactionController');
const { protect } = require('../middlewares/authMiddleware');

// 5 routes go here
router.post('/',protect, createDebtTransaction);
router.get('/',protect, getAllDebtTransactions);
router.get('/my-shared-charges', protect, getMySharedCharges);
router.get('/owed-by-member/:debtId', protect, getOwedByMemberForDebt);
router.get('/:id',protect, getDebtTransactionById);
router.put('/:id',protect, updateDebtTransaction);
router.delete('/:id',protect, deleteDebtTransaction);
router.put('/:id/mark-paid', protect, markTransactionPaid);
router.put('/:id/pay-partial', protect, payTransactionPartial);
router.get('/:id/payments', protect, getTransactionPayments);

module.exports = router; 