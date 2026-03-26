import express from 'express';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';
import LinkedInService from '../services/linkedinService.js';

const router = express.Router();

// Route pour créer une offre d'emploi à partir d'une demande validée
router.post('/create-from-request/:requestId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { requestId } = req.params;
    const userId = req.user.id;
    const userName = req.user.full_name || req.user.email;
    
    const requestResult = await client.query(
      `SELECT * FROM recruitment_requests WHERE id = $1`,
      [requestId]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    
    const request = requestResult.rows[0];
    
    const existingOffer = await client.query(
      `SELECT id FROM job_offers WHERE request_id = $1`,
      [requestId]
    );
    
    if (existingOffer.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Une offre existe déjà pour cette demande' });
    }
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    
    const offerResult = await client.query(
      `INSERT INTO job_offers (
        request_id, title, department, location, contract_type, description, profile_required,
        required_skills, level, experience, budget, salary_min, salary_max,
        remote_work, travel_required, start_date, benefits,
        publication_date, application_deadline, status,
        created_by, created_by_name, published_by, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        requestId,
        request.title,
        request.department,
        request.location,
        request.contract_type,
        request.description,
        request.profile_required || '',
        request.required_skills || [],
        request.level,
        request.experience,
        request.budget,
        request.salary_min,
        request.salary_max,
        request.remote_work || false,
        request.travel_required || false,
        request.start_date,
        ['Tickets restaurant', 'Mutuelle', 'Télétravail'],
        null,
        deadline.toISOString().split('T')[0],
        'draft',
        userId,
        userName,
        null,
        null
      ]
    );
    
    await client.query(
      `UPDATE recruitment_requests 
       SET status = 'Validated', current_validation_level = 'Validé'
       WHERE id = $1`,
      [requestId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Offre d\'emploi créée en brouillon avec succès.',
      jobOffer: offerResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création offre:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'offre' });
  } finally {
    client.release();
  }
});

// Route pour mettre à jour une offre en brouillon
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const checkResult = await pool.query(
      'SELECT status FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Seules les offres en brouillon peuvent être modifiées' });
    }
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'title', 'department', 'location', 'contract_type', 'description', 'profile_required',
      'required_skills', 'level', 'experience', 'budget', 'salary_min', 'salary_max',
      'remote_work', 'travel_required', 'start_date', 'benefits', 'application_deadline'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }
    
    setClauses.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE job_offers 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: 'Offre mise à jour avec succès',
      jobOffer: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour offre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ⭐ ROUTE PUBLICATION CORRIGÉE - GÈRE LINKEDIN ⭐
router.post('/:id/publish', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { platforms = [], useAI = true } = req.body;
    const userName = req.user.full_name || req.user.email;
    
    console.log('📤 Publication offre ID:', id);
    console.log('📋 Plateformes sélectionnées:', platforms);
    
    // Vérifier que l'offre existe
    const checkResult = await client.query(
      'SELECT * FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    const offer = checkResult.rows[0];
    
    if (offer.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Seules les offres en brouillon peuvent être publiées',
        current_status: offer.status
      });
    }
    
    await client.query('BEGIN');
    
    // Résultats des publications
    const publicationResults = [];
    
    // 1. PUBLICATION SUR LINKEDIN
    if (platforms.includes('linkedin')) {
      console.log('📤 Publication sur LinkedIn...');
      
      // Récupérer le token LinkedIn depuis le header
      const linkedinToken = req.headers['x-linkedin-token'];
      
      if (!linkedinToken) {
        publicationResults.push({
          platform: 'linkedin',
          success: false,
          error: 'Token LinkedIn non fourni. Veuillez vous reconnecter à LinkedIn.'
        });
      } else {
        const linkedinResult = await LinkedInService.publishJobOffer(linkedinToken, offer);
        publicationResults.push({
          platform: 'linkedin',
          ...linkedinResult
        });
      }
    }
    
    // 2. PUBLICATION SUR TANITJOBS (simulée)
    if (platforms.includes('tanitjobs')) {
      console.log('📤 Publication sur Tanitjobs...');
      publicationResults.push({
        platform: 'tanitjobs',
        success: true,
        message: 'Publié sur Tanitjobs'
      });
    }
    
    // 3. PUBLICATION INTERNE
    if (platforms.includes('internal')) {
      console.log('📤 Publication sur l\'intranet...');
      publicationResults.push({
        platform: 'internal',
        success: true,
        message: 'Publié sur l\'intranet'
      });
    }
    
    // Mettre à jour le statut de l'offre
    await client.query(
      `UPDATE job_offers 
       SET 
         status = 'published',
         publication_date = NOW(),
         published_by = $1,
         published_at = NOW(),
         updated_at = NOW()
       WHERE id = $2`,
      [userName, id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Offre publiée avec succès',
      publications: publicationResults,
      jobOffer: { ...offer, status: 'published' }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur publication:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  } finally {
    client.release();
  }
});

// Route pour clôturer une offre
router.post('/:id/close', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkResult = await pool.query(
      'SELECT status FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    if (checkResult.rows[0].status !== 'published') {
      return res.status(400).json({ 
        error: 'Seules les offres publiées peuvent être clôturées',
        current_status: checkResult.rows[0].status
      });
    }
    
    const result = await pool.query(
      `UPDATE job_offers 
       SET status = 'closed', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Offre clôturée avec succès',
      jobOffer: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur clôture offre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer toutes les offres
router.get('/', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT jo.*, rr.created_by_name as requester_name
      FROM job_offers jo
      LEFT JOIN recruitment_requests rr ON jo.request_id = rr.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status && status !== 'all') {
      params.push(status);
      query += ` AND jo.status = $${paramIndex}`;
      paramIndex++;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (jo.title ILIKE $${paramIndex} OR jo.description ILIKE $${paramIndex} OR jo.reference ILIKE $${paramIndex})`;
      paramIndex++;
    }
    
    query += ' ORDER BY jo.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur récupération offres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer une offre spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT jo.*, rr.created_by_name as requester_name, rr.reason, rr.reason_details
       FROM job_offers jo
       LEFT JOIN recruitment_requests rr ON jo.request_id = rr.id
       WHERE jo.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur récupération offre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour supprimer une offre en brouillon
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkResult = await pool.query(
      'SELECT status FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Seules les offres en brouillon peuvent être supprimées' });
    }
    
    const result = await pool.query(
      'DELETE FROM job_offers WHERE id = $1 RETURNING *',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Offre supprimée avec succès',
      jobOffer: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression offre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les offres en brouillon (non publiées)
router.get('/drafts', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jo.*, rr.created_by_name as requester_name
       FROM job_offers jo
       LEFT JOIN recruitment_requests rr ON jo.request_id = rr.id
       WHERE jo.status = 'draft'
       ORDER BY jo.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération brouillons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer une offre spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT jo.*, rr.created_by_name as requester_name, rr.reason, rr.reason_details
       FROM job_offers jo
       LEFT JOIN recruitment_requests rr ON jo.request_id = rr.id
       WHERE jo.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur récupération offre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour supprimer une offre en brouillon

export default router;