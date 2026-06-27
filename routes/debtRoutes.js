const express = require('express');
const router = express.Router();
const { createDebt, getAllDebts, getDebtById, updateDebt, deleteDebt } = require('../controllers/debtController');

// 5 routes go here
router.post('/',createDebt);
router.get('/',getAllDebts);
router.get('/:id',getDebtById);
router.put('/:id',updateDebt);
router.delete('/:id',deleteDebt);

module.exports = router; 