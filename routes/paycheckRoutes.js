const express = require('express');
const router = express.Router();
const { createPaycheck, getAllPaychecks, getPaycheckById, updatePaycheck, deletePaycheck, calculatePaycheckLeftover } = require('../controllers/paycheckController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createPaycheck);
router.get('/', protect, getAllPaychecks);
router.get('/:id', protect, getPaycheckById);
router.put('/:id', protect, updatePaycheck);
router.delete('/:id', protect, deletePaycheck);
router.put('/:id/leftover', protect, calculatePaycheckLeftover); 

module.exports = router;