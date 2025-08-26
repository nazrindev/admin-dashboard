const Category = require('../../model/category');


// const getCategory = async (req, res) => {
//     try {   
//         const category = await Category.find({isActive: true});

//         res.status(201).json({ message: 'Category fetched successfully', category });
//       } catch (error) {
//         res.status(500).json({ message: 'Failed to fetch category', error: error.message });
//       }
// };

const getCategory = async (req, res) => {
    try {
      const categories = await Category.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'subcategories', // collection name
            localField: '_id',
            foreignField: 'categoryId',
            as: 'subcategories'
          }
        },
        {
          $project: {
            name: 1, // include category name
            subcategories: {
              $map: {
                input: '$subcategories',
                as: 'sub',
                in: {
                  _id: '$$sub._id',
                  name: '$$sub.name'
                }
              }
            }
          }
        }
      ]);
  
      res.status(200).json({ message: 'Fetched categories with subcategories', categories });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }
  };
  

module.exports = { getCategory };