const express = require('express');
const router = express.Router();
const { createDebtTransaction, getAllDebtTransactions, getDebtTransactionById, updateDebtTransaction, deleteDebtTransaction } = require('../controllers/debtTransactionController');
const { protect } = require('../middlewares/authMiddleware');

// 5 routes go here
router.post('/',protect, createDebtTransaction);
router.get('/',protect, getAllDebtTransactions);
router.get('/:id',protect, getDebtTransactionById);
router.put('/:id',protect, updateDebtTransaction);
router.delete('/:id',protect, deleteDebtTransaction);

module.exports = router; 