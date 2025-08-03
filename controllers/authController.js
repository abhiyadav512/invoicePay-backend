require('dotenv').config();
const prisma = require('../config/db');
const generateOtpEmail = require('../services/generateOtpEmail');
const sendEmail = require('../helper/sendEmail');
const sendResponse = require('../helper/sendResponse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cron = require('node-cron');

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error('User not found. Please register first.');
      err.status = 401;
      return next(err);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err = new Error('Invalid password.., try again.');
      err.status = 401;
      return next(err);
    }

    if (!user.isVerified) {
      const err = new Error('Please verify your email before logging in.');
      err.status = 403;
      return next(err);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    return sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    // console.error(error);
    return next(error);
  }
};

const registerUser = async (req, res, next) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await prisma.OtpRequest.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.isVerified) {
      return sendResponse(
        res,
        409,
        false,
        'This email is already registered and verified.'
      );
    }

    const existingPending = await prisma.OtpRequest.findUnique({
      where: { email }
    });
    const now = new Date();

    if (existingPending && existingPending.otpExpiresAt > now) {
      return sendResponse(
        res,
        429,
        false,
        'Please wait before requesting a new OTP.'
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingPending) {
      await prisma.OtpRequest.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          otpHash,
          otpExpiresAt
        }
      });
    } else {
      await prisma.OtpRequest.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          otpHash,
          otpExpiresAt
        }
      });
    }

    await sendEmail({
      to: email,
      subject: 'Your OTP Code',
      html: generateOtpEmail(name, otp)
    });

    return sendResponse(res, 200, true, 'OTP sent to email. Please verify.', {
      email: email
    });
  } catch (error) {
    // console.error(error);
    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const user = await prisma.OtpRequest.findUnique({ where: { email } });

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    if (new Date() > user.otpExpiresAt) {
      await prisma.OtpRequest.delete({ where: { email } });
      return sendResponse(res, 400, false, 'OTP expired.');
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      return sendResponse(res, 400, false, 'Invalid OTP.');
    }

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        isVerified: true
      }
    });

    await prisma.OtpRequest.delete({ where: { email } });

    return sendResponse(
      res,
      200,
      true,
      'User registered and verified successfully.'
    );
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isVerified) {
      return sendResponse(res, 400, false, 'User not found or not verified');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashToken,
        resetTokenExpires: tokenExpiry
      }
    });

    // todo : replace with production url
    const resetLink = `https://invoicepay.vercel.app/reset-password/${rawToken}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
      <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `
    });

    return sendResponse(
      res,
      200,
      true,
      'Password reset link sent to your email.'
    );
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  if (!token || !newPassword) {
    return sendResponse(
      res,
      400,
      false,
      'Token and new password are required.'
    );
  }
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: {
          gte: new Date()
        }
      }
    });

    if (!user) {
      return sendResponse(res, 400, false, 'Invalid or expired reset token.');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    return sendResponse(
      res,
      200,
      true,
      'Password has been reset successfully.'
    );
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  const user = req.user;
  try {
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      dob: user.dob,
      number: user.number,
      location: user.location,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    sendResponse(res, 200, true, 'User profile', userData);
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const userId = req.user?.id;

  const { name, location, number, dob } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        location: location.trim(),
        number: number.trim(),
        dob: dob ? new Date(dob) : undefined
      },
      select: {
        id: true,
        name: true,
        location: true,
        number: true,
        dob: true,
        email: true,
        updatedAt: true
      }
    });

    return sendResponse(res, 201, true, 'Profile updated.', updatedUser);
  } catch (error) {
    // console.error('Update profile error:', error);
    next(error);
  }
};

const deleteExpiredOtpRequests = async () => {
  const now = new Date();
  const expired = await prisma.OtpRequest.findMany({
    where: {
      otpExpiresAt: { lt: now }
    }
  });
};

// Run every 30 minutes, you can adjust the timing
cron.schedule(' */30 * * * *', () => {
  // console.log('Running scheduled cleanup of expired pending users...');
  deleteExpiredOtpRequests();
});

module.exports = {
  loginUser,
  registerUser,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateProfile
};
