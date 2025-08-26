const express = require('express');
const router = express.Router();
const { registerCustomer } = require('../controller/customer/create');
const loginCustomer = require('../controller/customer/login');

router.get('/login', (req, res) => {
    res.status(200).json({ message: 'Logged in successfully' });
})

router.post('/register', registerCustomer);
router.post('/login', loginCustomer);
 

module.exports = router;