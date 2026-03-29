// middlewares/auth.js
import jwt from 'jsonwebtoken';
import 'dotenv/config.js';

export const auth = (req, res, next) => {
  console.log('='.repeat(50));
  console.log('🔐 Middleware auth appelé');
  console.log('📋 Headers reçus:', req.headers);
  
  const authHeader = req.header('Authorization');
  console.log('🔑 Auth header:', authHeader);
  
  if (!authHeader) {
    console.log('❌ Pas de header Authorization');
    return res.status(401).json({ message: 'Accès refusé - Token manquant' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('🔑 Token extrait (premiers 20 chars):', token.substring(0, 20) + '...');
  console.log('🔐 JWT_SECRET présent:', process.env.JWT_SECRET ? 'Oui' : 'Non');
  console.log('🔐 JWT_SECRET (premiers 5 chars):', process.env.JWT_SECRET?.substring(0, 5) + '...');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token valide pour:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Erreur JWT:', error.message);
    console.log('❌ Type erreur:', error.name);
    res.status(401).json({ message: 'Token invalide' });
  }
};