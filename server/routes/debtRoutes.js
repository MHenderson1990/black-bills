const express = require('express');
const router = express.Router();
const { createDebt, getAllDebts, getDebtById, updateDebt, deleteDebt, getDebtBalance, getAveragePayment, getDebtPayoffProjection } = require('../controllers/debtController');
const { protect } = require('../middlewares/authMiddleware');

// 5 routes go here
router.post('/',protect, createDebt);
router.get('/',protect, getAllDebts);
router.get('/:id',protect, getDebtById);
router.put('/:id',protect, updateDebt);
router.delete('/:id',protect, deleteDebt);
router.get('/:id/balance', protect, getDebtBalance);
router.get('/:id/average', protect, getAveragePayment);
router.get('/:id/payoff', protect, getDebtPayoffProjection);

module.exports = router; 