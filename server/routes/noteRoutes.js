const express = require('express');
const router = express.Router();
const { createNote, getAllNotes, updateNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createNote);
router.get('/', protect, getAllNotes);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;