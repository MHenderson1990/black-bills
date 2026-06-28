const express = require('express');
const router = express.Router();
const { createSavingsGoal, getAllSavingsGoals, getSavingsGoalById, updateSavingsGoal, deleteSavingsGoal, getSavingsGoalAmount } = require('../controllers/savingsGoalController');
const { protect } = require('../middlewares/authMiddleware');

// 5 routes go here
router.post('/',protect, createSavingsGoal);
router.get('/',protect, getAllSavingsGoals);
router.get('/:id',protect, getSavingsGoalById);
router.put('/:id',protect, updateSavingsGoal);
router.delete('/:id',protect, deleteSavingsGoal);
router.get('/:id/amount', protect, getSavingsGoalAmount);

module.exports = router; 