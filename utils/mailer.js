import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // important
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function sendResetEmail(to, token) {
  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Kilani Groupe" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Réinitialisation mot de passe',
    html: `
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p><a href="${resetUrl}">Cliquez ici pour réinitialiser votre mot de passe</a></p>
      <p>Le lien expire dans 1 heure.</p>
    `,
  });
}