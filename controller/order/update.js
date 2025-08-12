const Order = require('../../model/order');

module.exports = async (req, res) => {
  try {
    const { status, paymentStatus, shippingAddress } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (shippingAddress) update.shippingAddress = shippingAddress;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 