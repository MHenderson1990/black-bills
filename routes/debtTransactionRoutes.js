const express = require('express');
const router = express.Router();
const { createDebtTransaction, getAllDebtTransactions, getDebtTransactionById, updateDebtTransaction, deleteDebtTransaction } = require('../controllers/debtTransactionController');

// 5 routes go here
router.post('/',createDebtTransaction);
router.get('/',getAllDebtTransactions);
router.get('/:id',getDebtTransactionById);
router.put('/:id',updateDebtTransaction);
router.delete('/:id',deleteDebtTransaction);

module.exports = router; 