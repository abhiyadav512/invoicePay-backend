const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

router.post('/create', requireAuth, invoiceController.createInvoice);
router.delete(
  '/delete/:invoiceId',
  requireAuth,
  invoiceController.deleteInvoice
);

module.exports = router;
