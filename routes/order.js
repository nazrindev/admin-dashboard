const express = require('express');
const router = express.Router();

const createOrder = require('../controller/order/create');
const fetchOrder = require('../controller/order/fetch');
const updateOrder = require('../controller/order/update');
const deleteOrder = require('../controller/order/delete');

// Create order
router.post('/', createOrder);
// Fetch all orders
router.get('/', fetchOrder.fetchAll);
// Fetch order by ID
router.get('/:id', fetchOrder.fetchById);
// Update order
router.put('/:id', updateOrder);
// Delete order
router.delete('/:id', deleteOrder);

module.exports = router; 