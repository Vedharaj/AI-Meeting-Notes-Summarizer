// Using SendGrid as example
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendSummaryEmail({ to, subject, summary }) {
  try {
    await sgMail.send({
      to,
      from: process.env.FROM_EMAIL,
      subject,
      html: `
        <div>
          <h2>Meeting Summary</h2>
          <div style="margin-top: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
            ${summary}
          </div>
          <p style="margin-top: 20px; color: #64748b;">
            Sent via MeetingSum AI Summarizer
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}
