const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const requireAuth = require('../middleware/requireAuth');
const checkBusinessSetup = require('../middleware/checkBusinessSetup');
const router = express.Router();

router.post(
  '/create',
  requireAuth,
  checkBusinessSetup,
  invoiceController.createInvoice
);
router.delete(
  '/delete/:invoiceId',
  requireAuth,
  invoiceController.deleteInvoice
);

router.get(
  '/:invoiceId',
  requireAuth,
  checkBusinessSetup,
  invoiceController.getInvoiceById
);
router.get('/', requireAuth, checkBusinessSetup, invoiceController.getInvoice);

module.exports = router;
