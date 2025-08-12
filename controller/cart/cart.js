const Cart = require("../../model/cart");
const { generateGuestId } = require("../../utils/guestToken");

const addToCart = async (req, res) => {
  let { productId, price, discount = 0, quantity, userId } = req.body;

  try {
    if (!productId || !price || !quantity) {
      return res.status(400).json({ message: "Missing product details" });
    }

    if (!userId) {
      userId = generateGuestId();
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].price = price;
      cart.items[itemIndex].discount = discount;
    } else {
      cart.items.push({ productId, price, discount, quantity });
    }

    await cart.save();

    return res.status(200).json({
      message: "Cart updated successfully",
      cart,
      userId,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update cart",
      error: error.message,
    });
  }
};

const getCart = async (req, res) => {
  try {
    let userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({
      message: "Cart retrieved successfully",
      cart,
      userId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get cart",
      error: error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ message: "userId is required" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );
    await cart.save();

    res.status(200).json({ message: "Item removed", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing item", error: error.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, userId } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (quantity < 1)
      return res.status(400).json({ message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ message: "Quantity updated", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update quantity", error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to clear cart", error: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity,
  clearCart,
};
