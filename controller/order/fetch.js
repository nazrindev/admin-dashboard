const Order = require('../../model/order');

// Fetch all orders or by query
module.exports.fetchAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter).populate('customer').populate('items.product').populate('store');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch single order by ID
module.exports.fetchById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer').populate('items.product').populate('store');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 