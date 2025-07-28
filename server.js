require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./config/db');
const helmet = require('helmet');

const webhookRoutes = require('./routes/webhookRoutes');
app.use('/webhook', webhookRoutes);

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dahsboardRoutes = require('./routes/dashboardRoutes');
const businessRoutes = require('./routes/businessRoutes');

app.use('/api/user/auth', authRoutes);
app.use('/api/dashboard/', dahsboardRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/business', businessRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
});
