const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getHouseholdMembers, updatePayAnchorDate } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/household-members', protect, getHouseholdMembers);
router.put('/pay-anchor', protect, updatePayAnchorDate);

module.exports = router;