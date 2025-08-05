const Cart = require('../model/cart');

// Merge guest cart into user cart
const mergeGuestCartToUser = async (guestToken, userId) => {
  try {
    // Find guest cart
    const guestCart = await Cart.findOne({ guestToken });
    if (!guestCart || guestCart.items.length === 0) {
      return { success: true, message: 'No guest cart to merge' };
    }

    // Find or create user cart
    let userCart = await Cart.findOne({ userId });
    if (!userCart) {
      userCart = new Cart({ userId, items: [] });
    }

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        item => item.productId.toString() === guestItem.productId.toString()
      );

      if (existingItemIndex > -1) {
        // Item exists, add quantities
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
        // Update price and discount to latest values
        userCart.items[existingItemIndex].price = guestItem.price;
        userCart.items[existingItemIndex].discount = guestItem.discount;
      } else {
        // Item doesn't exist, add it
        userCart.items.push({
          productId: guestItem.productId,
          price: guestItem.price,
          discount: guestItem.discount,
          quantity: guestItem.quantity
        });
      }
    }

    // Save user cart
    await userCart.save();

    // Delete guest cart
    await Cart.deleteOne({ guestToken });

    return {
      success: true,
      message: 'Guest cart merged successfully',
      mergedItems: guestCart.items.length,
      userCart
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to merge guest cart',
      error: error.message
    };
  }
};

// Get cart summary (total items and total value)
const getCartSummary = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      totalItems: 0,
      totalValue: 0,
      totalDiscount: 0,
      finalValue: 0
    };
  }

  let totalItems = 0;
  let totalValue = 0;
  let totalDiscount = 0;

  for (const item of cart.items) {
    totalItems += item.quantity;
    const itemValue = item.price * item.quantity;
    const itemDiscount = item.discount * item.quantity;
    
    totalValue += itemValue;
    totalDiscount += itemDiscount;
  }

  return {
    totalItems,
    totalValue,
    totalDiscount,
    finalValue: totalValue - totalDiscount
  };
};

module.exports = {
  mergeGuestCartToUser,
  getCartSummary
}; 