// /model/merchantModel.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const bcrypt = require('bcrypt');
// /controllers/merchantController.js
const Merchant = require('../model/merchantModel');

const registerMerchant = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await Merchant.findOne({ email });
        if (user) {
            return res.status(409).json({ message: 'Merchant already exists.' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new Merchant({ email, password: hashedPassword });

        await newUser.save();

        return res.status(201).json({ message: 'Merchant registered successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const loginMerchant = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }
  
      const user = await Merchant.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: '1d',
      });
  
      // Return user data without password
      const userData = {
        _id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
  
      return res.status(200).json({ 
        message: 'Login successful.', 
        token,
        user: userData
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  

module.exports = { registerMerchant, loginMerchant };
