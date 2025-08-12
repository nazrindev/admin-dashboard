const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { createProduct } = require("../controller/product/create");
const {
  getProduct,
  getProductById,
  getMerchantProducts,
  searchProduct,
} = require("../controller/product/fetch");
const { updateProduct } = require("../controller/product/update");
const { deleteProduct } = require("../controller/product/delete");

const upload = require("../middleware/upload");

router.post(
  "/create",
  authMiddleware,
  upload.array("imageUrls", 5),
  createProduct
);
router.get("/get", getProduct);
router.get("/get/:id", getProductById);

router.put(
  "/update/:id",
  authMiddleware,
  upload.array("imageUrls", 5),
  updateProduct
);
router.delete("/delete/:id", authMiddleware, deleteProduct);
router.get("/get/merchant/:merchantId", getMerchantProducts);
router.get("/search", searchProduct);

module.exports = router;
