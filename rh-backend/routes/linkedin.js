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
    // Récupérer le token LinkedIn
    const authHeader = req.headers.authorization;
    console.log('📋 Auth header reçu:', authHeader ? 'Oui' : 'Non');
    
    if (!authHeader) {
      console.log('❌ Token manquant dans le header');
      return res.status(401).json({ 
        success: false, 
        error: 'Token LinkedIn requis' 
      });
    }
    
    const token = authHeader.split(' ')[1];
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
    
    // Publier sur LinkedIn
    const result = await LinkedInService.publishJobOffer(token, offer);
    
    console.log('📦 Résultat publication:', result);
    
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
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ valid: false, error: 'Token manquant' });
    }
    
    const token = authHeader.split(' ')[1];
    const result = await LinkedInService.verifyToken(token);
    res.json(result);
    
  } catch (error) {
    res.json({ valid: false, error: error.message });
  }
});

export default router;