// services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration du transporteur email avec options SSL
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // false pour port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false  // ⭐ AJOUTER CETTE LIGNE pour ignorer le certificat
  }
});

export async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"RH - Recrutement" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>/g, '')
    });
    
    console.log(`📧 Email envoyé à ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(`❌ Erreur envoi email à ${to}:`, error.message);
    throw error;
  }
}