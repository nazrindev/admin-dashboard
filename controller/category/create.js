const Category = require("../../model/category");

const createCategory = async (req, res) => {
  try {
    const { name, slug, iconUrl, displayOrder, isActive, storeId, storeSlug } =
      req.body;

    const category = new Category({
      name,
      slug,
      iconUrl,
      displayOrder,
      isActive,
      storeId,
      storeSlug,
    });

    await category.save();

    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create category", error: error.message });
  }
};

module.exports = { createCategory };
