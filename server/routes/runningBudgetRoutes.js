const express = require('express');
const router = express.Router();
const { createBudget, getAllBudgets, updateBudget, deleteBudget, createEntry, getEntries, updateEntry, deleteEntry } = require('../controllers/runningBudgetController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createBudget);
router.get('/', protect, getAllBudgets);
router.put('/:id', protect, updateBudget);
router.delete('/:id', protect, deleteBudget);

router.post('/entries', protect, createEntry);
router.get('/entries', protect, getEntries);
router.put('/entries/:id', protect, updateEntry);
router.delete('/entries/:id', protect, deleteEntry);

module.exports = router;