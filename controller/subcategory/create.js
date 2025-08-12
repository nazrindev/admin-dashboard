const Subcategory = require('../../model/subcategory');


const createSubcategory = async (req, res) => {
    try {
        const { name, categoryId, isActive } = req.body;
    
        const subcategory = new Subcategory({
          name,
          categoryId,
          isActive,
        });
    
        await subcategory.save();
    
        res.status(201).json({ message: 'Subcategory created successfully', subcategory });
      } catch (error) {
        res.status(500).json({ message: 'Failed to create category', error: error.message });
      }
};

module.exports = { createSubcategory };