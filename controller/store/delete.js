const Store = require('../../model/store');

const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findByIdAndDelete(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete store', error: error.message });
  }
};

module.exports = { deleteStore }; 