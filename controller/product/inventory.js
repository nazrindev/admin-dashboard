const Product = require("../../model/product");

// GET /api/product/[productId]/inventory
const getInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const merchantId = req.user.id;

    const product = await Product.findOne({
      _id: productId,
      merchantId: merchantId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate total available stock
    let totalStock = 0;
    let totalReserved = 0;
    let lowStockAlerts = [];
    let availableSizes = 0;
    let soldSizes = 0;

    if (product.inventory.type === "size-based") {
      // For size-based inventory, total stock is the number of active sizes
      const activeSizes = product.inventory.sizeInventory.filter(
        (size) => size.isActive
      );
      totalStock = activeSizes.length;

      product.inventory.sizeInventory.forEach((sizeItem) => {
        if (sizeItem.isActive) {
          if (sizeItem.quantity > 0) {
            availableSizes++;
          } else {
            soldSizes++;
          }
        }
        totalReserved += sizeItem.reserved;

        // Check for low stock alerts (when quantity is 0 or below threshold)
        if (sizeItem.quantity <= product.inventory.lowStockThreshold) {
          lowStockAlerts.push({
            size: sizeItem.size,
            quantity: sizeItem.quantity,
            threshold: product.inventory.lowStockThreshold,
          });
        }
      });
    } else {
      // Legacy stock
      totalStock = product.stock;
      availableSizes = product.stock > 0 ? 1 : 0;
      soldSizes = product.stock === 0 ? 1 : 0;
    }

    const inventoryData = {
      productId: product._id,
      productName: product.name,
      inventoryType: product.inventory.type,
      totalStock,
      totalReserved,
      availableStock: totalStock - totalReserved,
      availableSizes,
      soldSizes,
      lowStockThreshold: product.inventory.lowStockThreshold,
      lowStockAlerts,
      sizeInventory:
        product.inventory.type === "size-based"
          ? product.inventory.sizeInventory
          : null,
      legacyStock: product.inventory.type === "legacy" ? product.stock : null,
      trackInventory: product.inventory.trackInventory,
    };

    res.status(200).json({
      message: "Inventory retrieved successfully",
      inventory: inventoryData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve inventory",
      error: error.message,
    });
  }
};

// POST /api/product/[productId]/availability
const checkAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, quantity = 1 } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let available = false;
    let availableQuantity = 0;
    let message = "";

    if (product.inventory.type === "size-based") {
      if (!size) {
        return res.status(400).json({
          message: "Size is required for size-based inventory",
        });
      }

      const sizeItem = product.inventory.sizeInventory.find(
        (item) => item.size === size && item.isActive
      );

      if (!sizeItem) {
        message = `Size ${size} not available for this product`;
      } else {
        availableQuantity = sizeItem.quantity - sizeItem.reserved;
        available = availableQuantity >= quantity;
        message = available
          ? `${quantity} units available in size ${size}`
          : `Only ${availableQuantity} units available in size ${size}`;
      }
    } else {
      // Legacy stock
      availableQuantity = product.stock;
      available = availableQuantity >= quantity;
      message = available
        ? `${quantity} units available`
        : `Only ${availableQuantity} units available`;
    }

    res.status(200).json({
      message: "Availability checked successfully",
      availability: {
        productId,
        productName: product.name,
        size: size || null,
        requestedQuantity: quantity,
        availableQuantity,
        available,
        message,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check availability",
      error: error.message,
    });
  }
};

// PUT /api/product/[productId]/inventory
const updateInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const merchantId = req.user.id;
    const {
      inventoryType,
      sizeInventory,
      lowStockThreshold,
      trackInventory,
      legacyStock,
    } = req.body;

    const product = await Product.findOne({
      _id: productId,
      merchantId: merchantId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update inventory type
    if (inventoryType && ["legacy", "size-based"].includes(inventoryType)) {
      product.inventory.type = inventoryType;
    }

    // Update legacy stock
    if (legacyStock !== undefined && product.inventory.type === "legacy") {
      product.stock = Math.max(0, legacyStock);
    }

    // Update size-based inventory
    if (
      sizeInventory &&
      Array.isArray(sizeInventory) &&
      product.inventory.type === "size-based"
    ) {
      // Validate size inventory data
      for (const sizeItem of sizeInventory) {
        if (!sizeItem.size || sizeItem.quantity < 0 || sizeItem.reserved < 0) {
          return res.status(400).json({
            message:
              "Invalid size inventory data. Size is required and quantities must be non-negative.",
          });
        }
      }

      // Update existing sizes or add new ones
      sizeInventory.forEach((newSizeItem) => {
        const existingIndex = product.inventory.sizeInventory.findIndex(
          (item) => item.size === newSizeItem.size
        );

        if (existingIndex >= 0) {
          // Update existing size
          product.inventory.sizeInventory[existingIndex].quantity = Math.max(
            0,
            newSizeItem.quantity
          );
          product.inventory.sizeInventory[existingIndex].reserved = Math.max(
            0,
            newSizeItem.reserved || 0
          );
          if (newSizeItem.sku !== undefined) {
            product.inventory.sizeInventory[existingIndex].sku =
              newSizeItem.sku;
          }
          if (newSizeItem.isActive !== undefined) {
            product.inventory.sizeInventory[existingIndex].isActive =
              newSizeItem.isActive;
          }
        } else {
          // Add new size
          product.inventory.sizeInventory.push({
            size: newSizeItem.size,
            quantity: Math.max(0, newSizeItem.quantity),
            reserved: Math.max(0, newSizeItem.reserved || 0),
            sku: newSizeItem.sku || null,
            isActive:
              newSizeItem.isActive !== undefined ? newSizeItem.isActive : true,
          });
        }
      });
    }

    // Update low stock threshold
    if (lowStockThreshold !== undefined) {
      product.inventory.lowStockThreshold = Math.max(0, lowStockThreshold);
    }

    // Update track inventory setting
    if (trackInventory !== undefined) {
      product.inventory.trackInventory = trackInventory;
    }

    await product.save();

    // Calculate updated totals
    let totalStock = 0;
    let totalReserved = 0;
    let availableSizes = 0;
    let soldSizes = 0;

    if (product.inventory.type === "size-based") {
      // For size-based inventory, total stock is the number of active sizes
      const activeSizes = product.inventory.sizeInventory.filter(
        (size) => size.isActive
      );
      totalStock = activeSizes.length;

      product.inventory.sizeInventory.forEach((sizeItem) => {
        if (sizeItem.isActive) {
          if (sizeItem.quantity > 0) {
            availableSizes++;
          } else {
            soldSizes++;
          }
        }
        totalReserved += sizeItem.reserved;
      });
    } else {
      totalStock = product.stock;
      availableSizes = product.stock > 0 ? 1 : 0;
      soldSizes = product.stock === 0 ? 1 : 0;
    }

    res.status(200).json({
      message: "Inventory updated successfully",
      inventory: {
        productId: product._id,
        productName: product.name,
        inventoryType: product.inventory.type,
        totalStock,
        totalReserved,
        availableStock: totalStock - totalReserved,
        availableSizes,
        soldSizes,
        lowStockThreshold: product.inventory.lowStockThreshold,
        sizeInventory:
          product.inventory.type === "size-based"
            ? product.inventory.sizeInventory
            : null,
        legacyStock: product.inventory.type === "legacy" ? product.stock : null,
        trackInventory: product.inventory.trackInventory,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update inventory",
      error: error.message,
    });
  }
};

// Helper function to reserve inventory (for orders)
const reserveInventory = async (productId, size, quantity) => {
  try {
    const product = await Product.findById(productId);

    if (!product || !product.inventory.trackInventory) {
      return {
        success: false,
        message: "Product not found or inventory tracking disabled",
      };
    }

    if (product.inventory.type === "size-based") {
      if (!size) {
        return {
          success: false,
          message: "Size is required for size-based inventory",
        };
      }

      const sizeItem = product.inventory.sizeInventory.find(
        (item) => item.size === size && item.isActive
      );

      if (!sizeItem) {
        return { success: false, message: `Size ${size} not available` };
      }

      const availableQuantity = sizeItem.quantity - sizeItem.reserved;
      if (availableQuantity < quantity) {
        return {
          success: false,
          message: `Only ${availableQuantity} units available in size ${size}`,
        };
      }

      sizeItem.reserved += quantity;
      await product.save();
      return { success: true, message: "Inventory reserved successfully" };
    } else {
      // Legacy stock
      if (product.stock < quantity) {
        return {
          success: false,
          message: `Only ${product.stock} units available`,
        };
      }

      product.stock -= quantity;
      await product.save();
      return { success: true, message: "Inventory reserved successfully" };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Helper function to release reserved inventory (for cancelled orders)
const releaseInventory = async (productId, size, quantity) => {
  try {
    const product = await Product.findById(productId);

    if (!product || !product.inventory.trackInventory) {
      return {
        success: false,
        message: "Product not found or inventory tracking disabled",
      };
    }

    if (product.inventory.type === "size-based") {
      if (!size) {
        return {
          success: false,
          message: "Size is required for size-based inventory",
        };
      }

      const sizeItem = product.inventory.sizeInventory.find(
        (item) => item.size === size && item.isActive
      );

      if (!sizeItem) {
        return { success: false, message: `Size ${size} not found` };
      }

      sizeItem.reserved = Math.max(0, sizeItem.reserved - quantity);
      await product.save();
      return {
        success: true,
        message: "Reserved inventory released successfully",
      };
    } else {
      // Legacy stock - add back to stock
      product.stock += quantity;
      await product.save();
      return { success: true, message: "Inventory released successfully" };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  getInventory,
  checkAvailability,
  updateInventory,
  reserveInventory,
  releaseInventory,
};
