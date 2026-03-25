import express from 'express';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Route pour créer une offre d'emploi à partir d'une demande validée
router.post('/create-from-request/:requestId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { requestId } = req.params;
    const userId = req.user.id;
    const userName = req.user.full_name || req.user.email;
    
    // Récupérer les détails de la demande
    const requestResult = await client.query(
      `SELECT * FROM recruitment_requests WHERE id = $1`,
      [requestId]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    
    const request = requestResult.rows[0];
    
    // Vérifier si une offre existe déjà pour cette demande
    const existingOffer = await client.query(
      `SELECT id FROM job_offers WHERE request_id = $1`,
      [requestId]
    );
    
    if (existingOffer.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Une offre existe déjà pour cette demande' });
    }
    
    // Calculer la date de deadline (30 jours par défaut)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    
    // Créer l'offre en statut DRAFT (brouillon)
    const offerResult = await client.query(
      `INSERT INTO job_offers (
        request_id, title, department, location, contract_type, description,
        required_skills, level, experience, budget, salary_min, salary_max,
        remote_work, travel_required, start_date, benefits,
        publication_date, application_deadline, status,
        created_by, created_by_name, published_by, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        requestId,
        request.title,
        request.department,
        request.location,
        request.contract_type,
        request.description,
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
        null, // publication_date reste null car non publiée
        deadline.toISOString().split('T')[0],
        'draft', // ✅ Statut DRAFT par défaut
        userId,
        userName,
        null, // published_by reste null
        null  // published_at reste null
      ]
    );
    
    // Mettre à jour le statut de la demande
    await client.query(
      `UPDATE recruitment_requests 
       SET status = 'Validated', current_validation_level = 'Validé'
       WHERE id = $1`,
      [requestId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Offre d\'emploi créée en brouillon avec succès. Vous pouvez la publier quand vous êtes prêt.',
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

// Route pour mettre à jour une offre en brouillon avant publication
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Vérifier que l'offre existe et est en brouillon
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
    
    // Champs modifiables
    const allowedFields = [
      'title', 'department', 'location', 'contract_type', 'description',
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

// Route pour publier une offre (uniquement si elle est en brouillon)
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { platforms } = req.body;
    const userName = req.user.full_name || req.user.email;
    
    // Vérifier que l'offre existe et est en brouillon
    const checkResult = await pool.query(
      'SELECT status FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ 
        error: 'Seules les offres en brouillon peuvent être publiées',
        current_status: checkResult.rows[0].status
      });
    }
    
    // Publier l'offre
    const result = await pool.query(
      `UPDATE job_offers 
       SET 
         status = 'published',
         publication_date = NOW(),
         published_by = $1,
         published_at = NOW(),
         updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [userName, id]
    );

    res.json({
      success: true,
      message: 'Offre publiée avec succès',
      jobOffer: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur publication:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour mettre à jour le statut d'une offre
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'published', 'closed', 'filled', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées: ' + validStatuses.join(', ') });
    }
    
    // Vérifier les transitions autorisées
    const currentOffer = await pool.query(
      'SELECT status FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (currentOffer.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    const currentStatus = currentOffer.rows[0].status;
    
    // Règles de transition
    if (currentStatus === 'published' && status === 'draft') {
      return res.status(400).json({ error: 'Une offre publiée ne peut pas repasser en brouillon' });
    }
    
    if (currentStatus === 'closed' && status !== 'archived') {
      return res.status(400).json({ error: 'Une offre clôturée ne peut être que archivée' });
    }
    
    if (currentStatus === 'archived' && status !== 'archived') {
      return res.status(400).json({ error: 'Une offre archivée ne peut pas être modifiée' });
    }
    
    const result = await pool.query(
      `UPDATE job_offers 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    
    res.json({
      success: true,
      message: `Statut mis à jour: ${currentStatus} → ${status}`,
      jobOffer: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour clôturer une offre (uniquement si publiée)
router.post('/:id/close', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'offre existe et est publiée
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

// Route pour récupérer toutes les offres d'emploi
router.get('/', auth, async (req, res) => {
  try {
    const { status, department, published_only } = req.query;
    let query = `
      SELECT jo.*, rr.created_by_name as requester_name
      FROM job_offers jo
      LEFT JOIN recruitment_requests rr ON jo.request_id = rr.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      params.push(status);
      query += ` AND jo.status = $${params.length}`;
    } else if (published_only === 'true') {
      // Par défaut, ne montrer que les offres publiées si on veut les offres actives
      params.push('published');
      query += ` AND jo.status = $${params.length}`;
    }
    
    if (department) {
      params.push(department);
      query += ` AND jo.department = $${params.length}`;
    }
    
    query += ' ORDER BY jo.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur récupération offres:', error);
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'offre existe et est en brouillon
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

export default router;