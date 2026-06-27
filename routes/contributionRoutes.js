const express = require('express');
const router = express.Router();
const { createContribution, getAllContributions, getContributionById, updateContribution, deleteContribution } = require('../controllers/contributionController');

// 5 routes go here
router.post('/',createContribution);
router.get('/',getAllContributions);
router.get('/:id',getContributionById);
router.put('/:id',updateContribution);
router.delete('/:id',deleteContribution);

module.exports = router; 