// routes/linkedin.js
import express from 'express';
import LinkedInService from '../services/linkedinService.js';

const router = express.Router();

// Route pour publier une offre sur LinkedIn
router.post('/publish-linkedin', async (req, res) => {
  console.log('========================================');
  console.log('📥 ROUTE /api/publish-linkedin APPELÉE');
  console.log('========================================');
  
  try {
    // ⭐ Récupérer le token LinkedIn depuis différents headers possibles
    let token = null;
    
    // Essayer Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 Token récupéré depuis Authorization header');
    }
    
    // Essayer x-linkedin-token header
    if (!token && req.headers['x-linkedin-token']) {
      token = req.headers['x-linkedin-token'];
      console.log('🔑 Token récupéré depuis x-linkedin-token header');
    }
    
    console.log('📋 Headers reçus:', Object.keys(req.headers));
    console.log('🔑 Token LinkedIn présent:', !!token);
    
    if (!token) {
      console.log('❌ Token manquant dans les headers');
      return res.status(401).json({ 
        success: false, 
        error: 'Token LinkedIn requis. Veuillez vous connecter à LinkedIn.' 
      });
    }
    
    console.log('🔑 Token extrait (premiers 20 chars):', token.substring(0, 20) + '...');
    
    const { offer } = req.body;
    console.log('📝 Offre reçue:', offer?.title || 'Aucune');
    
    if (!offer) {
      console.log('❌ Offre non fournie');
      return res.status(400).json({ 
        success: false, 
        error: 'Offre non fournie' 
      });
    }
    
    console.log('📤 Appel de LinkedInService.publishJobOffer...');
    
    // Publier sur LinkedIn avec l'option IA activée par défaut
    const result = await LinkedInService.publishJobOffer(token, offer, true);
    
    console.log('📦 Résultat publication:', {
      success: result.success,
      ai_enhanced: result.ai_enhanced,
      hasUrl: !!result.url,
      error: result.error
    });
    
    if (result.success) {
      console.log('✅ Succès - Renvoi de la réponse');
      res.json(result);
    } else {
      console.log('❌ Échec - Renvoi de l\'erreur');
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur route:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Route pour vérifier le token LinkedIn
router.get('/verify-linkedin-token', async (req, res) => {
  try {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.headers['x-linkedin-token']) {
      token = req.headers['x-linkedin-token'];
    }
    
    if (!token) {
      return res.json({ valid: false, error: 'Token manquant' });
    }
    
    // Vérifier le token en essayant de récupérer les infos utilisateur
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userInfo = await response.json();
        return res.json({ valid: true, user: userInfo });
      } else {
        return res.json({ valid: false, error: 'Token invalide ou expiré' });
      }
    } catch (error) {
      return res.json({ valid: false, error: error.message });
    }
    
  } catch (error) {
    res.json({ valid: false, error: error.message });
  }
});

export default router;