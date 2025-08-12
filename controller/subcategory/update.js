const Subcategory = require('../../model/subcategory');

const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    const subcategory = await Subcategory.findByIdAndUpdate(id, updateFields, { new: true });
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    res.status(200).json({ message: 'Subcategory updated successfully', subcategory });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update subcategory', error: error.message });
  }
};

module.exports = { updateSubcategory }; 