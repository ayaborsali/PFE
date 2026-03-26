// routes/auth.js
import express from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sendResetEmail } from '../../utils/mailer.js';

const router = express.Router();

/* =============================
   1️⃣ LOGIN EXISTANT
============================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });

   const token = jwt.sign(
    { 
    id: user.id,
    name: user.full_name,
    role: user.role
    },
   process.env.JWT_SECRET,
   { expiresIn: '1h' }
   );  
   res.json({
     token,
     user: {
       id: user.id,
       email: user.email,
       name: user.full_name,
       role: user.role
  }
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/* =============================
   2️⃣ MOT DE PASSE OUBLIÉ
============================= */

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email manquant' });

  try {

    const token = crypto.randomBytes(16).toString('hex');

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Kilani Groupe" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation mot de passe',
      html: `
        <p>Cliquez sur le lien pour réinitialiser votre mot de passe :</p>
        <a href="${resetLink}">Réinitialiser le mot de passe</a>
      `
    });

    res.json({ message: 'Email de réinitialisation envoyé', token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/* =============================
   3️⃣ RESET PASSWORD
============================= */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email manquant'
    });
  }

  try {
    // ✅ 1. Vérifier si email existe
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // ❌ Si email n'existe pas
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cet email n'existe pas"
      });
    }

    const user = result.rows[0];

    // ✅ 2. Générer token
    const token = crypto.randomBytes(32).toString('hex');

    // ✅ 3. Expiration (1h)
    const expiresAt = new Date(Date.now() + 3600000);

    // ✅ 4. Sauvegarder token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
       VALUES ($1, $2, $3, false)`,
      [user.id, token, expiresAt]
    );

    // ✅ 5. Envoyer email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Kilani Groupe" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation mot de passe',
      html: `
        <p>Cliquez sur le lien :</p>
        <a href="${resetLink}">Réinitialiser</a>
      `
    });

    return res.json({
      success: true,
      message: 'Email envoyé avec succès'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
export default router;