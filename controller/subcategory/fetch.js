const Subcategory = require('../../model/subcategory');


const getSubcategory = async (req, res) => {
    try {   
        const subcategory = await Subcategory.find({isActive: true});

        res.status(201).json({ message: 'Subcategory fetched successfully', subcategory });
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch subcategory', error: error.message });
      }
};

module.exports = { getSubcategory };