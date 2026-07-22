import nodemailer from 'nodemailer';

// Create a transporter object using the credentials from your .env.local file
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT, 10), // This will be 587
  secure: false, // Use false for port 587
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

/**
 * Sends a password reset email to a user.
 * @param {string} to - The recipient's email address.
 * @param {string} token - The unique password reset token.
 */
export async function sendPasswordResetEmail({ to, token }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: '🔒 Reset Your Password - Gecko OMS ',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
          <tr>
            <td align="center">
              <!-- Main Container Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.07); overflow: hidden;">
                
                <!-- Top Brand Header Bar -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 40px; text-align: center;">
                    <div style="display: inline-block; background-color: #ffffff; padding: 12px 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                      <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; vertical-align: middle;">GECKO</span>
                      <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #10b981; vertical-align: middle;">OMS</span>
                    </div>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 40px 36px 32px 36px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; text-align: center;">
                      Password Reset Request
                    </h1>
                    
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569; text-align: center;">
                      We received a request to reset the password for your account associated with <strong style="color: #0f172a;">${to}</strong>. Click the button below to choose a new password.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); letter-spacing: 0.3px;">
                            Reset Your Password &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Alert Banner -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; margin: 24px 0 24px 0;">
                      <tr>
                        <td style="padding: 14px 18px; text-align: center;">
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #047857;">
                            ⏱️ This secure link expires in <strong>10 minutes</strong>.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback Link Section -->
                    <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px; margin-top: 24px;">
                      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                        Having trouble with the button?
                      </p>
                      <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all; color: #059669;">
                        <a href="${resetUrl}" style="color: #059669; text-decoration: underline;">${resetUrl}</a>
                      </p>
                    </div>

                    <!-- Additional Security Note -->
                    <p style="margin: 28px 0 0 0; font-size: 13px; line-height: 1.5; color: #94a3b8; text-align: center;">
                      If you did not initiate this request, you can safely ignore this email — your password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <!-- Footer Section -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 36px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                      Gecko OMS  Security Team
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                      &copy; 2026 Gecko OMS . All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${to}:`, error);
    throw new Error('Email could not be sent. Please check server configuration.');
  }
}

/**
 * Sends a NEW task notification email.
 */
export async function sendTaskNotificationEmail({ to, userName, taskTitle, taskDescription, assignedBy }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px;">New Task Assigned to You</h2>
          <p>Hello ${userName},</p>
          <p>A new task has been assigned to you by <strong>${assignedBy}</strong>. Please review the details below.</p>
          <div style="background-color: #f0f4f8; padding: 15px; border-radius: 4px; margin-top: 20px; border-left: 4px solid #0056b3;">
            <h3 style="margin-top: 0; color: #333;">${taskTitle}</h3>
            <p style="margin-bottom: 0;">${taskDescription || 'No description provided.'}</p>
          </div>
          <p style="margin-top: 20px;">You can view this task on your dashboard.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Task notification email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error('Email could not be sent.');
  }
}

/**
 * Sends a task UPDATED notification email.
 */
export async function sendTaskUpdateEmail({ to, userName, taskTitle, assignedBy }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: `Task Updated: ${taskTitle}`,
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #D9822B; border-bottom: 2px solid #D9822B; padding-bottom: 10px;">Task Update Notification</h2>
            <p>Hello ${userName},</p>
            <p>Please note that a task assigned to you, <strong>"${taskTitle}"</strong>, has been updated by <strong>${assignedBy}</strong>.</p>
            <p style="margin-top: 20px;">Please visit your dashboard to review the changes.</p>
          </div>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Task update email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send update email to ${to}:`, error);
    throw new Error('Email could not be sent.');
  }
}