import { pool } from './config/db.js';
import bcrypt from 'bcrypt';

// Rôles valides
const validRoles = ['Manager', 'Directeur', 'DRH', 'DAF', 'DGA', 'DG'];

async function createUser(user) {
  try {
    // Vérification du rôle
    if (!validRoles.includes(user.role)) {
      throw new Error(`Rôle invalide. Choisir parmi : ${validRoles.join(', ')}`);
    }

    // Vérification de l'email existant
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
    if (emailCheck.rows.length > 0) {
      throw new Error('Cet email est déjà utilisé');
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Insertion de l'utilisateur
    const res = await pool.query(
      `INSERT INTO users 
      (full_name, email, password, role, department, position, phone, company, avatar, status, last_login)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        user.full_name,
        user.email,
        hashedPassword,
        user.role,
        user.department || null,
        user.position || null,
        user.phone || null,
        user.company || null,
        user.avatar || null,
        user.status || 'active',
        user.last_login || null
      ]
    );

    console.log("✅ Utilisateur ajouté :", res.rows[0]);
    return res.rows[0];

  } catch (err) {
    console.error("❌ Erreur création utilisateur :", err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

// Exemple d'utilisation
createUser({
  full_name: "Aya Borsali",
  email: "aya@example.com",
  password: "motdepasse123",
  role: "Manager",
  department: "IT",
  position: "Manager IT",
  phone: "22123456",
  company: "ENIC",
  avatar: "https://example.com/avatar.png",
  status: "active"
});
/*
createUser({
  full_name: "Aya",
  email: "aya1@kilani.com",
  password: "motdepasse123",
  role: "Directeur",
  department: "IT",
  position: "Directeur IT",
  phone: "22123456",
  company: "ENIC",
  avatar: "https://example.com/avatar.png",
  status: "active"
});*/