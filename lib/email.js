import nodemailer from 'nodemailer';

// Create a transporter object using the credentials from your .env.local file
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT, 10),
  secure: false, 
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

/**
 * Sends a NEW task notification email.
 */
export async function sendTaskNotificationEmail({ to, userName, taskTitle, taskDescription, assignedBy }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0056b3;">New Task Assigned to You</h2>
          <p>Hello ${userName},</p>
          <p>A new task has been assigned to you by <strong>${assignedBy}</strong>. Please review the details below.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <h3 style="margin-top: 0;">${taskTitle}</h3>
            <p>${taskDescription}</p>
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
  }
}

/**
 * --- NEW FUNCTION ---
 * Sends a task UPDATED notification email.
 */
export async function sendTaskUpdateEmail({ to, userName, taskTitle, assignedBy }) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: `Task Updated: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #D9822B;">A Task Assigned to You Was Updated</h2>
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
    }
  }