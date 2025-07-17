const prisma = require("../config/db");
require("dotenv").config();
const generateOtpEmail = require("../helper/generateOtpEmail");
const sendEmail = require("../helper/sendEmail");
const sendResponse = require("../helper/sendResponse");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error("Invalid email");
      err.status = 401;
      return next(err);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err = new Error("Invalid password.., try again.");
      err.status = 401;
      return next(err);
    }

    if (!user.isVerified) {
      const err = new Error("Please verify your email before logging in.");
      err.status = 403;
      return next(err);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    return sendResponse(res, 200, true, "Login successful", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  const { email, password, location, dob, name, number } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    const dobDate = new Date(dob); 

    // case 1 : Email exists AND verified
    if (existingUser && existingUser.isVerified) {
      return sendResponse(
        res,
        409,
        false,
        "This email is already registered and verified."
      );
    }

    const otp = Math.floor(10000 + Math.random() * 900000).toString();
    const hashOtp = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // case 2 : Email exists but not verified - resend otp
    if (existingUser && !existingUser.isVerified) {
      if (
        existingUser.otpExpiresAt &&
        existingUser.otpExpiresAt > new Date(Date.now() - 60 * 1000)
      ) {
        return sendResponse(
          res,
          429,
          false,
          "Please wait at least 60 seconds before requesting a new OTP."
        );
      }

      const updateUser = await prisma.user.update({
        where: { email },
        data: {
          name,
          password: await bcrypt.hash(password, 10),
          dob: dobDate,
          location,
          number,
          otpHash: hashOtp,
          otpExpiresAt,
        },
      });
      await sendEmail({
        to: email,
        subject: "Your new OTP code.",
        html: generateOtpEmail(name, otp),
      });

      return sendResponse(
        res,
        200,
        true,
        "Unverified user found. OTP has been resent.",
        { email: updateUser.email }
      );
    }

    //Case 3: New user — create and send OTP
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        dob: dobDate,
        location,
        number,
        isVerified: false,
        otpHash: hashOtp,
        otpExpiresAt,
      },
    });

    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      html: generateOtpEmail(name, otp),
    });

    return sendResponse(
      res,
      200,
      true,
      "User registered successfully. OTP sent to email.",
      { email: newUser.email }
    );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const verifiyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return sendResponse(
        res,
        400,
        false,
        "OTP not requested or already verified."
      );
    }

    if (new Date() > user.otpExpiresAt) {
      const err = new Error("OTP has expired.");
      err.status = 400;
      return next(err);
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      const err = new Error("Invalid OTP.");
      err.status = 400;
      return next(err);
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    return sendResponse(res, 200, true, "Email verified successfully.");
  } catch (error) {
    console.log(error);
    next(error);
  }
};
module.exports = { loginUser, registerUser, verifiyOtp };
