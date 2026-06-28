const express = require('express');
const router = express.Router();
const { createSavingsGoal, getAllSavingsGoals, getSavingsGoalById, updateSavingsGoal, deleteSavingsGoal, getSavingsGoalAmount } = require('../controllers/savingsGoalController');

// 5 routes go here
router.post('/',createSavingsGoal);
router.get('/',getAllSavingsGoals);
router.get('/:id',getSavingsGoalById);
router.put('/:id',updateSavingsGoal);
router.delete('/:id',deleteSavingsGoal);
router.get('/:id/amount', getSavingsGoalAmount);

module.exports = router; 