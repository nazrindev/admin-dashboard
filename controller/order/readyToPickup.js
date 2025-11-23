const Order = require('../../model/order');

module.exports = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Find and update order status to ready_to_pickup
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'ready_to_pickup', updatedAt: new Date() },
      { new: true }
    ).populate('customer').populate('items.product').populate('store');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      message: 'Order marked as ready to pickup successfully',
      order: order
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



