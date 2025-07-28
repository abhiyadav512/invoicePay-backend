const prisma = require('../config/db');
const sendResponse = require('../helper/sendResponse');

exports.getUserBusiness = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId }
    });

    if (!business) {
      return sendResponse(
        res,
        404,
        false,
        'Business profile not found. Please complete your business setup.',
        null
      );
    }

    return sendResponse(
      res,
      200,
      true,
      'Business profile retrieved successfully.',
      business
    );
  } catch (error) {
    // console.error('Get business error:', error);
    next(error);
  }
};

exports.setupBusiness = async (req, res, next) => {
  const userId = req.user.id;
  const {
    name,
    description,
    website,
    phone,
    email,
    address,
    city,
    state,
    country,
    postalCode,
    businessType,
    taxId,
    logo,
    defaultCurrency,
    timezone
  } = req.body;

  if (!name || !email) {
    return sendResponse(
      res,
      400,
      false,
      'Business name and email are required.'
    );
  }

  try {
    const existingBusiness = await prisma.business.findUnique({
      where: { ownerId: userId }
    });

    if (existingBusiness) {
      return sendResponse(
        res,
        400,
        false,
        'Business profile already exists. Use update endpoint to modify.'
      );
    }

    const business = await prisma.business.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        website: website?.trim(),
        phone: phone?.trim(),
        email: email.trim().toLowerCase(),
        address: address?.trim(),
        city: city?.trim(),
        state: state?.trim(),
        country: country?.trim() || 'India',
        postalCode: postalCode?.trim(),
        businessType: businessType?.trim(),
        taxId: taxId?.trim(),
        logo: logo?.trim(),
        defaultCurrency: defaultCurrency?.trim() || 'INR',
        timezone: timezone?.trim() || 'Asia/Kolkata',
        ownerId: userId
      }
    });

    return sendResponse(
      res,
      201,
      true,
      'Business profile created successfully.',
      business
    );
  } catch (error) {
    // console.error('Setup business error:', error);

    if (error.code === 'P2002') {
      return sendResponse(
        res,
        400,
        false,
        'A business with this information already exists.'
      );
    }

    next(error);
  }
};

exports.updateBusiness = async (req, res, next) => {
  const userId = req.user.id;
  const updateData = req.body;

  delete updateData.id;
  delete updateData.ownerId;
  delete updateData.createdAt;

  try {
    const existingBusiness = await prisma.business.findUnique({
      where: { ownerId: userId }
    });

    if (!existingBusiness) {
      return sendResponse(
        res,
        404,
        false,
        'Business profile not found. Please setup your business first.'
      );
    }

    const cleanUpdateData = {};
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        cleanUpdateData[key] =
          typeof updateData[key] === 'string'
            ? updateData[key].trim()
            : updateData[key];
      }
    });

    const updatedBusiness = await prisma.business.update({
      where: { ownerId: userId },
      data: {
        ...cleanUpdateData,
        updatedAt: new Date()
      }
    });

    return sendResponse(
      res,
      200,
      true,
      'Business profile updated successfully.',
      updatedBusiness
    );
  } catch (error) {
    // console.error('Update business error:', error);
    next(error);
  }
};
