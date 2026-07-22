import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;
const CONTACTS_FILE = path.join(process.cwd(), "contacts.json");
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || "me@firzal.space";

// Rate Limit Configuration
const RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15", 10);
const MAX_CONTACT_REQUESTS = parseInt(process.env.MAX_CONTACT_REQUESTS || "3", 10);
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

// In-Memory Rate Limiter Map: Map<ipAddress, Array<timestamp>>
const ipSubmissionMap = new Map<string, number[]>();

// Periodically clean up stale IP entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipSubmissionMap.entries()) {
    const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length === 0) {
      ipSubmissionMap.delete(ip);
    } else {
      ipSubmissionMap.set(ip, validTimestamps);
    }
  }
}, 10 * 60 * 1000);

// Parse JSON bodies
app.use(express.json());

// Load saved transmissions (contacts)
const getContacts = () => {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const data = fs.readFileSync(CONTACTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading contacts file", err);
  }
  return [];
};

// Save a transmission
const saveContact = (contact: any) => {
  try {
    const contacts = getContacts();
    contacts.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      recipient: RECIPIENT_EMAIL,
      ...contact,
    });
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving contact", err);
    return false;
  }
};

// Send email via Nodemailer if SMTP configured
const sendEmail = async (name: string, email: string, subject: string, message: string) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[EMAIL NOTICE] SMTP not fully configured. Message from ${name} <${email}> targeting ${RECIPIENT_EMAIL} was recorded in telemetry storage.`);
    return { sent: false, reason: "SMTP credentials not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"${name} (via Portfolio Uplink)" <${smtpUser}>`,
      replyTo: email,
      to: RECIPIENT_EMAIL,
      subject: `[Portfolio Inquiry] ${subject}`,
      text: `New transmission received for ${RECIPIENT_EMAIL}:\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nTimestamp: ${new Date().toISOString()}`,
      html: `
        <div style="font-family: monospace, sans-serif; background: #0a0e17; color: #e0e6ed; padding: 24px; border: 1px solid #1e293b;">
          <h2 style="color: #38bdf8; margin-top: 0;">// PORTFOLIO TRANSMISSION RECEIVED</h2>
          <p style="font-size: 13px; color: #94a3b8;">Direct message for <strong>${RECIPIENT_EMAIL}</strong></p>
          <hr style="border-color: #334155;" />
          <p><strong>From:</strong> ${name} (&lt;<a href="mailto:${email}" style="color: #38bdf8;">${email}</a>&gt;)</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background: #030712; padding: 16px; border-left: 3px solid #38bdf8; margin: 16px 0; white-space: pre-wrap;">${message}</div>
          <hr style="border-color: #334155;" />
          <p style="font-size: 11px; color: #64748b;">Telemetry Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Successfully dispatched to ${RECIPIENT_EMAIL} (Message ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Failed to send email to ${RECIPIENT_EMAIL}:`, err.message);
    return { sent: false, reason: err.message };
  }
};

// API: Submit a Contact Form (Mavlink Uplink Transmission with Rate Limiting)
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message, language } = req.body;

  // 1. Identify Client IP
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  const now = Date.now();

  // 2. Evaluate Rate Limits (Sliding Window)
  const timestamps = ipSubmissionMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_CONTACT_REQUESTS) {
    const oldestInWindow = validTimestamps[0];
    const msToWait = oldestInWindow + RATE_LIMIT_WINDOW_MS - now;
    const minutesToWait = Math.ceil(msToWait / (60 * 1000));
    const secondsToWait = Math.ceil(msToWait / 1000);

    res.setHeader("Retry-After", secondsToWait);
    console.warn(`[RATE LIMIT EXCEEDED] IP: ${clientIp} attempted to send message beyond limit (${MAX_CONTACT_REQUESTS} / ${RATE_LIMIT_WINDOW_MINUTES}m)`);

    return res.status(429).json({
      success: false,
      rateLimited: true,
      error: `Transmission rate limit exceeded. You can send a maximum of ${MAX_CONTACT_REQUESTS} messages every ${RATE_LIMIT_WINDOW_MINUTES} minutes. Please wait ${minutesToWait} minute(s) before trying again.`,
      retryAfterMinutes: minutesToWait,
      retryAfterSeconds: secondsToWait,
    });
  }

  // 3. Validate Inputs
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: Name, Email, and Message are required.",
    });
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format. Please provide a valid email address.",
    });
  }

  // Record submission timestamp for rate limiting
  validTimestamps.push(now);
  ipSubmissionMap.set(clientIp, validTimestamps);

  // 4. Save to Telemetry Store (contacts.json)
  const isSaved = saveContact({
    name,
    email,
    subject: subject || "Aesthetic Inquiry",
    message,
    language,
    clientIp,
  });

  if (!isSaved) {
    return res.status(500).json({
      success: false,
      error: "Uplink failure. Could not store transmission in telemetry logs.",
    });
  }

  console.log(`[TRANSMISSION RECEIVED] From: ${name} <${email}> -> Target: ${RECIPIENT_EMAIL}`);

  // 5. Trigger Async Email Dispatch to me@firzal.space
  const emailResult = await sendEmail(name, email, subject || "Aesthetic Inquiry", message);

  return res.json({
    success: true,
    recipient: RECIPIENT_EMAIL,
    emailSent: emailResult.sent,
    message: `Transmission uplink established. Message successfully routed to ${RECIPIENT_EMAIL} and recorded in telemetry.`,
    remainingAttempts: MAX_CONTACT_REQUESTS - validTimestamps.length,
    timestamp: new Date().toISOString(),
  });
});

// API: Get Telemetry Contacts (For the portfolio's Mavlink terminal to display messages dynamically!)
app.get("/api/contacts", (req, res) => {
  const contacts = getContacts();
  res.json(contacts);
});

// Start Express + Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all other routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

