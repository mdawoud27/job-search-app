import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

/* eslint no-undef: off */
export const sendOTPEmail = async (email, otp, subject = '') => {
  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to: email,
    subject: subject || 'Verify your Email',
    text: `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`,
  });
};

export const sendEmail = async ({ from, to, subject, html }) => {
  const mailOptions = {
    from: from || process.env.USER_EMAIL,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

export const sendAcceptanceEmail = async (
  emailFrom,
  applicantEmail,
  applicantName,
  jobTitle,
  companyName,
) => {
  const subject = 'Congratulations! Your Application Has Been Accepted';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>We are delighted to inform you that your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong>accepted</strong>!</p>
          
          <p>We were impressed by your qualifications and believe you would be a great fit for our team.</p>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Our HR team will contact you shortly with further details</li>
            <li>Please keep an eye on your email for additional information</li>
            <li>Prepare any questions you may have about the role</li>
          </ul>
          
          <p>We look forward to welcoming you to our team!</p>
          
          <p>Best regards,<br>
          <strong>${companyName} Hiring Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    from: process.env.USER_EMAIL || emailFrom,
    to: applicantEmail,
    subject,
    html,
  });
};

export const sendRejectionEmail = async (
  emailFrom,
  applicantEmail,
  applicantName,
  jobTitle,
  companyName,
) => {
  const subject = 'Update on Your Application';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Update</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> and for taking the time to apply.</p>
          
          <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
          
          <p>We truly appreciate your interest in joining our team. Your skills and experience are valuable, and we encourage you to apply for future opportunities that match your profile.</p>
          
          <p>We wish you the very best in your job search and future career endeavors.</p>
          
          <p>Best regards,<br>
          <strong>${companyName} Hiring Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    from: process.env.USER_EMAIL || emailFrom,
    to: applicantEmail,
    subject,
    html,
  });
};
