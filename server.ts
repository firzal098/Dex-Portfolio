import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const CONTACTS_FILE = path.join(process.cwd(), "contacts.json");

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
      ...contact,
    });
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving contact", err);
    return false;
  }
};

// API: Submit a Contact Form (Mavlink Uplink Transmission)
app.post("/api/contact", (req, res) => {
  const { name, email, subject, message, language } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: name, email, and message are required.",
    });
  }

  const success = saveContact({ name, email, subject: subject || "No Subject", message, language });

  if (success) {
    console.log(`[TRANSMISSION RECEIVED] From: ${name} <${email}>`);
    return res.json({
      success: true,
      message: "Transmission uplink established. Message successfully stored in telemetry logs.",
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(500).json({
      success: false,
      error: "Uplink failure. Could not store transmission in telemetry logs.",
    });
  }
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
