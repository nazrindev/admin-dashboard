const express = require("express");
const cors = require("cors");
const app = express();
const merchantUser = require("./routes/merchant");
const connectDB = require("./database/connectDB");
const storeRoutes = require("./routes/store");
const customerRoutes = require("./routes/customer");
const categoryRoutes = require("./routes/category");
const subcategoryRoutes = require("./routes/subcategory");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const CartRoutes = require("./routes/cart");

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:4200", "http://localhost:3000"],
    credentials: true,
  })
);

require("dotenv").config();
app.use("/api/merchant", merchantUser);
app.use("/api/store", storeRoutes);
app.use("/api/customer", customerRoutes);

app.use("/api/category", categoryRoutes);
app.use("/api/subcategory", subcategoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", CartRoutes);
connectDB();

app.listen(process.env.PORT, () => {
  console.log("working");
});
