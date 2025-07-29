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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px;">Password Reset Request</h2>
          <p>You requested a password reset. Please click the button below to set a new password. This link is valid for 10 minutes.</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #2ac759; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Your Password</a>
          </p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      </div>
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