const Product = require("../../model/product");

// Simple function to generate unique search code
const generateSearchCode = () => {
  const randomNumber = Math.floor(Math.random() * 9000000) + 1000000; // 7-digit number
  return `B-${randomNumber}`;
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    console.log(updateFields);

    // Generate search code if not provided and product doesn't have one
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!updateFields.search_code && !existingProduct.search_code) {
      updateFields.search_code = generateSearchCode();
    }

    const product = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
};

module.exports = { updateProduct };
