const express = require('express');
const router = express.Router();
const { setCardBudget, getCardBudgetSummary, getCardBudgetHistory, deleteCardBudget } = require('../controllers/cardBudgetController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, setCardBudget);
router.get('/summary', protect, getCardBudgetSummary);
router.get('/history', protect, getCardBudgetHistory);
router.delete('/', protect, deleteCardBudget);

module.exports = router;