const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const createOrder = require('../controller/order/create');
const fetchOrder = require('../controller/order/fetch');
const updateOrder = require('../controller/order/update');
const deleteOrder = require('../controller/order/delete');
const readyToPickup = require('../controller/order/readyToPickup');

// Create order
router.post('/', createOrder);
// Fetch all orders
router.get('/', fetchOrder.fetchAll);
// Mark order as ready to pickup
router.post('/:id/ready-to-pickup', authMiddleware, readyToPickup);
// Fetch order by ID
router.get('/:id', fetchOrder.fetchById);
// Update order
router.put('/:id', updateOrder);
// Delete order
router.delete('/:id', deleteOrder);

module.exports = router; 