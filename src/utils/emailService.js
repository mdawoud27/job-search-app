import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

/* eslint no-undef: off */
export const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to: email,
    subject: 'Verify your Email',
    text: `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`,
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};
