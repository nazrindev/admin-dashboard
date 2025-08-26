const Product = require('../../model/product');
const fs = require('fs');
const imagekit = require('../../utils/imagekit'); // Adjust path as needed

const createProduct = async (req, res) => {
	try {
		const merchantId = req.user.id; // From JWT
		const { categoryId, subcategoryId, storeId, name, description, price, stock, isActive } = req.body;

		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ message: 'At least one image is required' });
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
			isActive
		});

		await product.save();
		res.status(201).json({ message: 'Product created successfully', product });
	} catch (error) {
		res.status(500).json({ message: 'Failed to create product', error: error.message });
	}
};

module.exports = { createProduct }; 