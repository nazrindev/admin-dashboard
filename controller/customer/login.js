const Customer = require("../../model/customer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { extractUserId } = require("../../utils/guestToken");
const { mergeGuestCartToUser } = require("../../utils/cartMerge");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  console.log(req);
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: customer._id, email: customer.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Check for guest token and merge cart if present
    const guestToken = extractUserId(req);
    let cartMergeResult = null;

    if (guestToken) {
      cartMergeResult = await mergeGuestCartToUser(guestToken, customer._id);
    }

    const response = {
      message: "Login successful.",
      token,
      customerId: customer._id,
    };

    if (cartMergeResult) {
      response.cartMerge = cartMergeResult;
    }

    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
