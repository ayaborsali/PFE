// routes/auth.js
import express from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

/* =============================
   1️⃣ LOGIN
============================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Utilisateur non trouvé"
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        message: "Mot de passe incorrect"
      });
    }

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
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
});


/* =============================
   2️⃣ FORGOT PASSWORD
============================= */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email manquant"
    });
  }

  try {
    // ✅ Vérifier si email existe
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cet email n'existe pas"
      });
    }

    const user = result.rows[0];

    // ✅ Générer token sécurisé
    const token = crypto.randomBytes(32).toString('hex');

    // ✅ Expiration (1 heure)
    const expiresAt = new Date(Date.now() + 3600000);

    // ✅ Sauvegarder token en base
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
       VALUES ($1, $2, $3, false)`,
      [user.id, token, expiresAt]
    );

    // ✅ Config email
     const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // 🔥 FIX
  }
});

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // ✅ Envoyer email
    await transporter.sendMail({
      from: `"Kilani Groupe" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Réinitialisation du mot de passe",
      html: `
        <h3>Réinitialisation de votre mot de passe</h3>
        <p>Cliquez sur le lien ci-dessous :</p>
        <a href="${resetLink}" style="color:blue;">Réinitialiser mon mot de passe</a>
        <p>Ce lien expire dans 1 heure.</p>
      `
    });

    return res.json({
      success: true,
      message: "Email envoyé avec succès"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


/* =============================
   3️⃣ RESET PASSWORD
============================= */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Token ou mot de passe manquant"
    });
  }

  try {
    // ✅ Vérifier token
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND used = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Token invalide"
      });
    }

    const resetToken = result.rows[0];

    // ✅ Vérifier expiration
    if (new Date() > resetToken.expires_at) {
      return res.status(400).json({
        success: false,
        message: "Token expiré"
      });
    }

    // ✅ Hasher mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Mettre à jour password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, resetToken.user_id]
    );

    // ✅ Marquer token utilisé
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetToken.id]
    );

    return res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


export default router;