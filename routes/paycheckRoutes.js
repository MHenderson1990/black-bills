const express = require('express');
const router = express.Router();
const { createPaycheck, getAllPaychecks, getPaycheckById, updatePaycheck, deletePaycheck, calculatePaycheckLeftover } = require('../controllers/paycheckController');

router.post('/', createPaycheck);
router.get('/', getAllPaychecks);
router.get('/:id', getPaycheckById);
router.put('/:id', updatePaycheck);
router.delete('/:id', deletePaycheck);
router.put('/:id/leftover', calculatePaycheckLeftover); 

module.exports = router;