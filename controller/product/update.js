const Product = require('../../model/product');

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    console.log(updateFields);
    const product = await Product.findByIdAndUpdate(id, updateFields, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

module.exports = { updateProduct }; 