// routes/candidates.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/db.js';

const router = express.Router();

// Créer le dossier uploads/cvs s'il n'existe pas
const uploadDir = 'uploads/cvs';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez PDF, DOC ou DOCX.'));
    }
  }
});

// POST /api/candidates/apply - Envoyer une candidature
router.post('/apply', upload.single('cv'), async (req, res) => {
  console.log('📥 Candidature reçue');
  console.log('📋 Body:', req.body);
  console.log('📎 Fichier:', req.file);
  
  const client = await pool.connect();
  
  try {
    const {
      offerId,
      firstName,
      lastName,
      email,
      phone,
      message,
      experience,
      currentPosition,
      availability
    } = req.body;
    
    const cvPath = req.file ? req.file.path : null;
    
    // Vérifications
    if (!offerId) {
      return res.status(400).json({ error: 'ID de l\'offre requis' });
    }
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Prénom et nom requis' });
    }
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    
    if (!cvPath) {
      return res.status(400).json({ error: 'Veuillez joindre votre CV' });
    }
    
    // Vérifier que l'offre existe
    const offerCheck = await client.query(
      'SELECT id FROM job_offers WHERE id = $1',
      [offerId]
    );
    
    if (offerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO candidates (
        offer_id, first_name, last_name, email, phone, 
        message, experience, current_position, availability, 
        cv_path, status, applied_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id`,
      [
        offerId, firstName, lastName, email, phone,
        message || null, experience || null, currentPosition || null, availability || null,
        cvPath, 'pending'
      ]
    );
    
    // Mettre à jour le compteur de candidatures
    await client.query(
      `UPDATE job_offers 
       SET applications_count = applications_count + 1 
       WHERE id = $1`,
      [offerId]
    );
    
    await client.query('COMMIT');
    
    console.log('✅ Candidature enregistrée avec ID:', result.rows[0].id);
    
    res.json({ 
      success: true, 
      message: 'Candidature envoyée avec succès',
      candidateId: result.rows[0].id
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur candidature:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi: ' + error.message });
  } finally {
    client.release();
  }
});

// GET /api/candidates/offer/:offerId - Récupérer les candidatures d'une offre
router.get('/offer/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, message, 
              experience, current_position, availability, status, applied_at
       FROM candidates 
       WHERE offer_id = $1
       ORDER BY applied_at DESC`,
      [offerId]
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur récupération candidatures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;