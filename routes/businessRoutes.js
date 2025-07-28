const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  updateBusiness,
  setupBusiness,
  getUserBusiness
} = require('../controllers/businessController');
const router = express.Router();

router.get('/', requireAuth, getUserBusiness);
router.post('/setup', requireAuth, setupBusiness);
router.patch('/update', requireAuth, updateBusiness);

module.exports = router;
