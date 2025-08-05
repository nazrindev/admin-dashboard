
const express = require('express');
const cors = require('cors');
const app = express();
const merchantUser = require('./routes/merchant');
const connectDB = require('./database/connectDB');
const storeRoutes = require('./routes/store');
const customerRoutes = require('./routes/customer');
const categoryRoutes = require('./routes/category');
const subcategoryRoutes = require('./routes/subcategory');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const CartRoutes = require('./routes/cart');

app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true 
  }));

app.use(express.json());
require("dotenv").config();
app.use('/merchant', merchantUser);
app.use('/store', storeRoutes); 
app.use('/customer', customerRoutes);

app.use('/category', categoryRoutes);
app.use('/subcategory', subcategoryRoutes);
app.use('/product', productRoutes);
app.use('/order', orderRoutes);
app.use('/cart', CartRoutes)
connectDB();

app.listen( process.env.PORT , () => {
    console.log('working');
})