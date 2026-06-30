const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getHouseholdMembers } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/household-members', protect, getHouseholdMembers);

module.exports = router;