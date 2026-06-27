const express = require('express');
const router = express.Router();
const { markBillSharePaid } = require('../controllers/billShareController');

router.put('/:id',markBillSharePaid);

module.exports = router; 