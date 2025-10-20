const Product = require("../../model/product");
const fs = require("fs");
const imagekit = require("../../utils/imagekit"); // Adjust path as needed

// Simple function to generate unique search code
const generateSearchCode = () => {
  const randomNumber = Math.floor(Math.random() * 9000000) + 1000000; // 7-digit number
  return `B-${randomNumber}`;
};

const createProduct = async (req, res) => {
  try {
    const merchantId = req.user.id; // From JWT
    const {
      categoryId,
      subcategoryId,
      storeId,
      name,
      description,
      price,
      stock,
      isActive,
      brand,
      gender,
      material,
      occasion,
      sizes,
      color,
      sku,
      search_code,
    } = req.body;

    console.log("Received storeId:", storeId);
    console.log("MerchantId from JWT:", merchantId);

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // Upload each file to ImageKit
    const imageUploadPromises = req.files.map((file) =>
      imagekit.upload({
        file: fs.readFileSync(file.path),
        fileName: file.originalname,
      })
    );
    const uploadResponses = await Promise.all(imageUploadPromises);
    req.files.forEach((file) => fs.unlinkSync(file.path));
    const imageUrls = uploadResponses.map((res) => res.url);

    // Generate search code if not provided or undefined
    const finalSearchCode =
      search_code && search_code !== "undefined"
        ? search_code
        : generateSearchCode();

    const product = new Product({
      merchantId,
      categoryId,
      subcategoryId,
      storeId,
      name,
      description,
      price,
      stock,
      imageUrls,
      isActive,
      brand,
      gender,
      material,
      occasion,
      sizes,
      color,
      sku,
      search_code: finalSearchCode,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create product", error: error.message });
  }
};

module.exports = { createProduct };
