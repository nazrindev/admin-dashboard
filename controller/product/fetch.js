const mongoose = require("mongoose");
const Product = require("../../model/product");

const getProduct = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          stock: 1,
          imageUrls: 1,
          subcategory: { _id: 1, name: 1 },
          category: { _id: 1, name: 1 },
          store: { _id: 1, businessName: 1, address: 1, city: 1, state: 1 },
        },
      },
    ]);

    res
      .status(200)
      .json({ message: "Products fetched successfully", products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), isActive: true } },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$store", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          stock: 1,
          imageUrls: 1,
          subcategory: { _id: 1, name: 1 },
          category: { _id: 1, name: 1 },
          store: { _id: 1, name: 1, address: 1, city: 1, state: 1 },
        },
      },
    ]);

    if (!product.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product fetched successfully", product: product[0] });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: error.message });
  }
};

const getMerchantProducts = async (req, res) => {
  const { merchantId } = req.params;
  try {
    const product = await Product.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          isActive: true,
        },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$store", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          stock: 1,
          imageUrls: 1,
          subcategory: { _id: 1, name: 1 },
          category: { _id: 1, name: 1 },
          store: { _id: 1, name: 1, address: 1, city: 1, state: 1 },
        },
      },
    ]);

    if (!product.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Products fetched successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: error.message });
  }
};

const searchProduct = async (req, res) => {
  const searchTerm = req.query.q?.trim() || "";

  try {
    const products = await Product.aggregate([
      { $match: { isActive: true } },

      // Join subcategory
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategory",
        },
      },

      // Join category
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },

      // Join store
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },

      // Flatten arrays
      { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },

      // Match after lookups so we can search all fields
      {
        $match: {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { "subcategory.name": { $regex: searchTerm, $options: "i" } },
            { "category.name": { $regex: searchTerm, $options: "i" } },
            { "store.businessName": { $regex: searchTerm, $options: "i" } },
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$price" },
                  regex: searchTerm,
                  options: "i",
                },
              },
            },
          ],
        },
      },

      // Select only needed fields
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          stock: 1,
          imageUrls: 1,
          subcategory: { _id: 1, name: 1 },
          category: { _id: 1, name: 1 },
          store: {
            _id: 1,
            businessName: 1,
            address: 1,
            city: 1,
            state: 1,
          },
        },
      },
    ]);

    res
      .status(200)
      .json({ message: "Products fetched successfully", products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to search products", error: error.message });
  }
};

module.exports = {
  getProduct,
  getProductById,
  getMerchantProducts,
  searchProduct,
};
