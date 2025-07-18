const generateOtpEmail = (name, otp) => {
  return `
  <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="margin-top: 10px; color: #333;">invoicePay</h2>
    </div>

    <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>

    <p style="font-size: 16px; color: #333;">
      Your One-Time Password (OTP) for verifying your email address is:
    </p>

    <div style="font-size: 24px; font-weight: bold; color: #2c3e50; text-align: center; margin: 20px 0;">
      ${otp}
    </div>

    <p style="font-size: 14px; color: #555;">
      Please enter this code to complete your registration. This code will expire in <strong>10 minutes</strong>.
    </p>

    <p style="font-size: 14px; color: #999; margin-top: 30px;">If you did not request this, you can safely ignore this email.</p>

    <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />

    <p style="font-size: 12px; color: #aaa; text-align: center;">
      &copy; ${new Date().getFullYear()} invoicePay. All rights reserved.
    </p>
  </div>
  `;
};

module.exports = generateOtpEmail;
