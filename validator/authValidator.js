const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters long')
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(6)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long')
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
