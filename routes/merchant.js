const express = require("express");
const router = express.Router();
const {
  registerMerchant,
  loginMerchant,
} = require("../controller/merchantController");
const { createProduct } = require("../controller/product/create");
const { updateProduct } = require("../controller/product/update");
const { deleteProduct } = require("../controller/product/delete");
const { getMerchantProducts } = require("../controller/product/fetch");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/login", (req, res) => {
  res.status(200).json({ message: "Logged in successfully" });
});

router.post("/register", registerMerchant);

router.post("/login", loginMerchant);

// Merchant-specific product routes
router.post(
  "/:merchantId/products",
  authMiddleware,
  upload.array("imageUrls", 5),
  createProduct
);

router.get("/:merchantId/products", authMiddleware, getMerchantProducts);

router.put(
  "/:merchantId/products/:id",
  authMiddleware,
  upload.array("imageUrls", 5),
  updateProduct
);

router.delete("/:merchantId/products/:id", authMiddleware, deleteProduct);

module.exports = router;
