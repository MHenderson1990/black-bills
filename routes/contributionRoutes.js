const express = require('express');
const router = express.Router();
const { createContribution, getAllContributions, getContributionById, updateContribution, deleteContribution } = require('../controllers/contributionController');
const { protect } = require('../middlewares/authMiddleware');

// 5 routes go here
router.post('/',protect, createContribution);
router.get('/',protect, getAllContributions);
router.get('/:id',protect, getContributionById);
router.put('/:id',protect, updateContribution);
router.delete('/:id',protect, deleteContribution);

module.exports = router; 