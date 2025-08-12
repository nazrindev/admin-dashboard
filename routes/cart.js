const express = require('express');
const router = express.Router();

const cartController = require('../controller/cart/cart');
const guestAuthMiddleware = require('../middleware/guestAuth');

router.use(guestAuthMiddleware);

router.post('/add', cartController.addToCart);
router.get('/', cartController.getCart);
router.delete('/remove/:productId', cartController.removeFromCart);
router.put('/quantity/:productId', cartController.updateQuantity);
router.delete('/clear', cartController.clearCart);

module.exports = router;
