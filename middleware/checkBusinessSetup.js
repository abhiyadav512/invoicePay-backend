const prisma = require('../config/db');
const sendResponse = require('../helper/sendResponse');

const checkBusinessSetup = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!business) {
      return sendResponse(
        res,
        403,
        false,
        'Business setup required. Please complete your business profile before creating invoices.',
        {
          setupRequired: true,
          setupUrl: '/api/business/setup'
        }
      );
    }

    if (!business.name || !business.email) {
      return sendResponse(
        res,
        403,
        false,
        'Incomplete business profile. Please complete all required fields.',
        {
          setupRequired: true,
          setupUrl: '/api/business/update',
          missingFields: {
            name: !business.name,
            email: !business.email
          }
        }
      );
    }

    req.userBusiness = business;
    next();
  } catch (error) {
    // console.error('Business setup check error:', error);
    return sendResponse(res, 500, false, 'Error checking business setup.');
  }
};

module.exports = checkBusinessSetup;
