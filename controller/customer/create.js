const Customer = require('../../model/customer');
const bcrypt = require('bcrypt');
const { extractGuestToken } = require('../../utils/guestToken');
const { mergeGuestCartToUser } = require('../../utils/cartMerge');

const registerCustomer = async (req, res) => {
    try {
        const { name, email, password, phone, address, city, state, zip, country } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        
        const existing = await Customer.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Customer already exists.' });
        }
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const customer = new Customer({
          name,
          email,
          password: hashedPassword,
          phone,
          address,
          city,
          state,
          zip,
          country
        });
        
        await customer.save();
        
        // Check for guest token and merge cart if present
        const guestToken = extractGuestToken(req);
        let cartMergeResult = null;
        
        if (guestToken) {
            cartMergeResult = await mergeGuestCartToUser(guestToken, customer._id);
        }
        
        const response = {
            message: 'Customer profile created successfully',
            customer
        };
        
        if (cartMergeResult) {
            response.cartMerge = cartMergeResult;
        }
        
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create customer', error: error.message });
    }
};

module.exports = { registerCustomer };