const express = require('express');
const router = express.Router();
const { registerMerchant, loginMerchant } = require('../controller/merchantController');

router.get('/login', (req, res) => {
    res.status(200).json({ message: 'Logged in successfully' });
})

router.post('/register', registerMerchant);

router.post('/login', loginMerchant);

module.exports = router;