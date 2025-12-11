
import logger from './logger.js';
import nodemailer from 'nodemailer';

// Reads SMTP config from environment variables
// Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
};

let transporter = null;
if (smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass) {
  transporter = nodemailer.createTransport(smtpConfig);
}

/**
 * Send an email using nodemailer if SMTP is configured, else log in dev.
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
export async function sendEmail(to, subject, html) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || smtpConfig.auth.user,
        to,
        subject,
        html,
      });
      logger.info('Email sent', { to, subject, messageId: info.messageId });
      return info;
    } catch (err) {
      logger.error('Email send failed', { to, subject, error: err.message });
      throw err;
    }
  } else {
    logger.info('Simulated email (no SMTP config)', { to, subject });
    return Promise.resolve({ to, subject });
  }
}

export function creditAlertTemplate({ fullName, amount, reference, balanceBefore, balanceAfter }) {
  const formatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  return {
    subject: `Withdrawal processed — ${formatted}`,
    html: `<p>Hi ${fullName || ""},</p>
      <p>Your withdrawal of <strong>${formatted}</strong> has been processed (ref: <strong>${reference}</strong>).</p>
      <p>Balance before: ${new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(balanceBefore)}<br/>Balance after: ${new Intl.NumberFormat(
      "en-NG",
      { style: "currency", currency: "NGN" }
    ).format(balanceAfter)}</p>
      <p>If you did not authorize this, contact support immediately.</p>
      <p>Thanks,<br/>DigiPayG2C Team</p>`,
  };
}

export default { sendEmail, creditAlertTemplate };
