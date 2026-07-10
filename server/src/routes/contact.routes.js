import express from 'express';
import nodemailer from 'nodemailer';
import ContactRequest from '../models/ContactRequest.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';

const router = express.Router();

// ── Create nodemailer transporter ─────────────────────────────────────────────
function getTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('[Contact] SMTP credentials not configured — emails will be logged only.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// ── HTML-escape helper — prevents XSS/injection in email templates ───────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── POST /contact ─────────────────────────────────────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, category, subject, message } = req.body;

  // Validation
  if (!name?.trim())     throw new AppError('Full name is required.', 400);
  if (!email?.trim())    throw new AppError('Email address is required.', 400);
  if (!subject?.trim())  throw new AppError('Subject is required.', 400);
  if (!message?.trim())  throw new AppError('Message is required.', 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Please enter a valid email address.', 400);
  }

  // Sanitised values used in HTML templates
  const safeName     = esc(name.trim());
  const safeEmail    = esc(email.trim());
  const safeCategory = esc(category || 'General Support');
  const safeSubject  = esc(subject.trim());
  const safeMessage  = esc(message.trim()).replace(/\n/g, '<br>');

  // Save to MongoDB
  const contact = await ContactRequest.create({
    name:     name.trim(),
    email:    email.trim().toLowerCase(),
    category: category || 'General Support',
    subject:  subject.trim(),
    message:  message.trim(),
  });

  // Send email
  const transporter = getTransporter();
  let emailSent = false;

  if (transporter) {
    const supportEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
    const mailOptions = {
      from:    `"TrustBridge Contact Form" <${supportEmail}>`,
      to:      'trustbridge.platform@gmail.com',
      replyTo: email.trim(),
      subject: `[TrustBridge Support] ${safeCategory}: ${safeSubject}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="color:white;margin:0;font-size:18px">&#x1F6E1;&#xFE0F; TrustBridge &mdash; New Contact Request</h2>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151;width:140px">Name</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${safeName}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Email</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><a href="mailto:${safeEmail}" style="color:#2563eb">${safeEmail}</a></td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Category</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${safeCategory}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Subject</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${safeSubject}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600;color:#374151;vertical-align:top">Message</td><td style="padding:8px 0;color:#475569;line-height:1.6">${safeMessage}</td></tr>
            </table>
            <div style="margin-top:20px;padding:12px 16px;background:#eff6ff;border-radius:8px;font-size:12px;color:#64748b">
              Submitted: ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST &middot; ID: ${contact._id}
            </div>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      emailSent = true;
      await ContactRequest.findByIdAndUpdate(contact._id, { emailSent: true });
      console.log(`[Contact] Email sent for request ${contact._id}`);
    } catch (emailErr) {
      console.error('[Contact] Email send failed:', emailErr.message);
      // Don't fail the request — message is still stored in DB
    }

    // Send auto-reply to the user
    if (emailSent) {
      const replyOptions = {
        from:    `"TrustBridge Support" <${supportEmail}>`,
        to:      email.trim(),
        subject: `Re: ${safeSubject} &mdash; TrustBridge Support`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
              <h2 style="color:white;margin:0;font-size:18px">&#x1F6E1;&#xFE0F; TrustBridge Support</h2>
            </div>
            <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
              <p style="color:#0f172a;font-size:15px">Hi ${safeName},</p>
              <p style="color:#475569;line-height:1.7">Thank you for reaching out. We have received your message and will respond within <strong>24&ndash;48 business hours</strong>.</p>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;border-left:3px solid #2563eb">
                <p style="margin:0;font-size:12px;color:#64748b">Your request: <strong>${safeSubject}</strong></p>
                <p style="margin:4px 0 0;font-size:12px;color:#64748b">Category: ${safeCategory}</p>
              </div>
              <p style="color:#475569;line-height:1.7">Support Hours: Monday &ndash; Saturday &middot; 9:00 AM &ndash; 6:00 PM IST</p>
              <p style="color:#475569">The TrustBridge Support Team</p>
            </div>
          </div>
        `,
      };
      try { await transporter.sendMail(replyOptions); } catch {}
    }
  } else {
    // Log to console when SMTP not configured
    console.log('[Contact] New contact request (no SMTP):');
    console.log(`  From: ${name} <${email}>`);
    console.log(`  Category: ${category}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Message: ${message.substring(0,100)}...`);
  }

  res.status(201).json({
    success: true,
    message: "Your message has been received. We'll respond within 24–48 business hours.",
    data: { id: contact._id, emailSent },
  });
}));

// ── GET /contact — admin only ─────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const requests = await ContactRequest.find().sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: requests });
}));

export default router;
