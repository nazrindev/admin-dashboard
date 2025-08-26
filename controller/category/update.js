const Category = require('../../model/category');

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    const category = await Category.findByIdAndUpdate(id, updateFields, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

module.exports = { updateCategory }; 