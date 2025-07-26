const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  getInvoiceSummary,
  getRecentInvoices,
  getPaidOrUnpaid
} = require('../controllers/dashBoardController');
const router = express.Router();

router.get('/summary/data', requireAuth, getInvoiceSummary);

router.get('/recent/data', requireAuth, getRecentInvoices);

router.get('/invoices', requireAuth, getPaidOrUnpaid);

module.exports = router;
