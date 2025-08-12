const Order = require('../../model/order');
const Product = require('../../model/product');
const Customer = require('../../model/customer');

module.exports = async (req, res) => {
  try {
    const { customer, store, items, shippingAddress, paymentMethod } = req.body;
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer and items are required.' });
    }

    // Calculate totalAmount and validate products
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.product}` });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      }
      totalAmount += product.price * item.quantity;
    }

    // Create order
    const order = new Order({
      customer,
      store,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending',
    });
    await order.save();

    // Optionally, reduce product stock here
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 