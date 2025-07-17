const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const errorHandler = require("./middleware/errorHandler");
const primsa=require('./config/db');

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/user/auth", authRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});