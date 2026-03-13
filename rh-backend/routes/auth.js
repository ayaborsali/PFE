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
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const tokenResult = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token=$1 AND used=false AND expires_at > NOW()',
      [token]
    );
    if (!tokenResult.rows.length) return res.status(400).json({ message: 'Token invalide ou expiré' });

    const userId = tokenResult.rows[0].user_id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mise à jour du mot de passe
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashedPassword, userId]);
    await pool.query('UPDATE password_reset_tokens SET used=true WHERE token=$1', [token]);

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;