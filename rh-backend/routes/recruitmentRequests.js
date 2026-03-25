import express from 'express';
import { pool } from '../config/db.js'; // connection PostgreSQL

const router = express.Router();

// ============================================
// ROUTES SPÉCIFIQUES (AVANT les routes génériques)
// ============================================

// GET /api/recruitmentRequests/archived - Récupérer les demandes archivées
router.get('/archived', async (req, res) => {
  const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let baseQuery = 'SELECT * FROM recruitment_requests_archive';
    let countQuery = 'SELECT COUNT(*) FROM recruitment_requests_archive';
    const conditions = [];
    const values = [];

    if (status !== 'all') {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      conditions.push(`(title ILIKE $${values.length-2} OR department ILIKE $${values.length-1} OR location ILIKE $${values.length})`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    baseQuery += ' ORDER BY deleted_at DESC LIMIT $' + (values.length+1) + ' OFFSET $' + (values.length+2);
    values.push(Number(limit), offset);

    const data = await pool.query(baseQuery, values);
    const countResult = await pool.query(countQuery, values.slice(0, values.length-2));
    const totalCount = Number(countResult.rows[0].count);

    res.json({ data: data.rows, totalCount });
  } catch (err) {
    console.error('❌ Erreur récupération archives:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

// POST /api/recruitmentRequests/:id/archive - Archiver une demande
router.post('/:id/archive', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('📦 Archivage demande ID:', req.params.id);
    console.log('📝 Body:', req.body);
    
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { deletion_reason } = req.body;
    
    // Vérifier que l'ID est valide
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'ID de demande invalide' });
    }
    
    // Récupérer la demande
    const requestResult = await client.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [idNum]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    
    const request = requestResult.rows[0];
    console.log('📋 Demande trouvée:', request.id, request.title);
    
    // Vérifier si la table d'archive existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recruitment_requests_archive'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table recruitment_requests_archive n\'existe pas');
      await client.query('ROLLBACK');
      return res.status(500).json({ message: 'Table d\'archive non trouvée' });
    }
    
    // Archiver la demande
    const archiveQuery = `
      INSERT INTO recruitment_requests_archive (
        original_id, title, department, location, contract_type, reason,
        reason_details, budget, salary_min, salary_max, required_skills, description,
        urgent, status, current_validation_level, created_by, created_by_name,
        created_by_role, replacement_name, replacement_reason, start_date,
        level, experience, remote_work, travel_required, priority,
        validation_flow, created_at, updated_at,
        deleted_by, deleted_by_name, deleted_by_role, deletion_reason
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33
      )
    `;
    
    const archiveValues = [
      request.id,
      request.title,
      request.department,
      request.location,
      request.contract_type,
      request.reason,
      request.reason_details,
      request.budget,
      request.salary_min,
      request.salary_max,
      request.required_skills,
      request.description,
      request.urgent,
      'Archivées',
      'Archivé',
      request.created_by,
      request.created_by_name,
      request.created_by_role,
      request.replacement_name,
      request.replacement_reason,
      request.start_date,
      request.level,
      request.experience,
      request.remote_work,
      request.travel_required,
      request.priority,
      request.validation_flow,
      request.created_at,
      request.updated_at,
      null, // deleted_by
      null, // deleted_by_name
      null, // deleted_by_role
      deletion_reason || 'Suppression manuelle'
    ];
    
    await client.query(archiveQuery, archiveValues);
    console.log('✅ Demande archivée dans la table archive');
    
    // Supprimer les offres d'emploi liées
    await client.query('DELETE FROM job_offers WHERE request_id = $1', [idNum]);
    console.log('✅ Offres supprimées');
    
    // Supprimer l'historique de validation
    await client.query('DELETE FROM validation_tracking WHERE request_id = $1', [idNum]);
    console.log('✅ Historique validation supprimé');
    
    // Supprimer la demande originale
    await client.query('DELETE FROM recruitment_requests WHERE id = $1', [idNum]);
    console.log('✅ Demande originale supprimée');
    
    await client.query('COMMIT');
    
    console.log('✅ Archivage terminé avec succès pour ID:', idNum);
    
    res.json({
      success: true,
      message: 'Demande archivée avec succès'
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur archivage:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'archivage',
      error: err.message 
    });
  } finally {
    client.release();
  }
});

// POST /api/recruitmentRequests/new-request - Créer une nouvelle demande
router.post('/new-request', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📥 Données reçues:', req.body);
    
    const {
      title, 
      department, 
      location, 
      contract_type, 
      reason, 
      reason_details,
      salary_min,
      salary_max,
      required_skills, 
      description, 
      urgent, 
      status, 
      current_validation_level,
      created_by, 
      created_by_name, 
      created_by_role, 
      replacement_name, 
      replacement_reason,
      start_date, 
      level, 
      experience, 
      remote_work, 
      travel_required, 
      priority,
      validation_flow
    } = req.body;

    // Validation des salaires
    if (salary_min && salary_max && parseFloat(salary_min) >= parseFloat(salary_max)) {
      return res.status(400).json({
        success: false,
        error: 'Le salaire minimum doit être inférieur au salaire maximum'
      });
    }

    console.log('💰 Salaires à insérer:', { salary_min, salary_max });

    // Insertion de la demande
    const result = await client.query(
      `INSERT INTO recruitment_requests (
        title, 
        department, 
        location, 
        contract_type, 
        reason, 
        reason_details,
        salary_min, 
        salary_max, 
        required_skills, 
        description, 
        urgent, 
        status, 
        current_validation_level,
        created_by, 
        created_by_name, 
        created_by_role, 
        replacement_name, 
        replacement_reason,
        start_date, 
        level, 
        experience, 
        remote_work, 
        travel_required, 
        priority,
        validation_flow, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW())
      RETURNING *`,
      [
        title, 
        department, 
        location, 
        contract_type, 
        reason, 
        reason_details,
        salary_min || null,
        salary_max || null,
        required_skills, 
        description, 
        urgent, 
        status, 
        current_validation_level,
        created_by, 
        created_by_name, 
        created_by_role, 
        replacement_name, 
        replacement_reason,
        start_date, 
        level, 
        experience, 
        remote_work || false, 
        travel_required || false, 
        priority,
        validation_flow
      ]
    );

    const newRequest = result.rows[0];
    console.log('✅ Demande créée:', newRequest.id, 'Salaires:', newRequest.salary_min, newRequest.salary_max);

    // Si la demande est automatiquement validée
    if (status === 'Validated' && validation_flow && validation_flow.length === 1 && validation_flow[0] === 'Manager') {
      await client.query(
        `INSERT INTO validation_tracking (
          request_id, validator_name, validator_role, validator_id,
          action, comments, validation_level, validation_order, validated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newRequest.id,
          created_by_name,
          created_by_role,
          created_by,
          'approved',
          'Validation automatique - Circuit simplifié',
          'Manager',
          1,
          new Date()
        ]
      );
      
      // Créer l'offre d'emploi
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      
      let annualBudget = null;
      if (salary_min && salary_max) {
        const avgMonthly = (parseFloat(salary_min) + parseFloat(salary_max)) / 2;
        annualBudget = avgMonthly * 12;
      }
      
      await client.query(
        `INSERT INTO job_offers (
          request_id, title, department, location, contract_type, description,
          required_skills, level, experience, budget, salary_min, salary_max,
          remote_work, travel_required, start_date, benefits,
          publication_date, application_deadline, status,
          created_by, created_by_name, published_by, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [
          newRequest.id,
          title,
          department,
          location,
          contract_type,
          description,
          required_skills || [],
          level,
          experience,
          annualBudget,
          salary_min || null,
          salary_max || null,
          remote_work || false,
          travel_required || false,
          start_date,
          ['Tickets restaurant', 'Mutuelle', 'Télétravail'],
          null,
          deadline.toISOString().split('T')[0],
          'draft',
          created_by,
          created_by_name,
          null,
          null
        ]
      );
      
      console.log(`✅ Offre d'emploi créée en BROUILLON pour la demande ${newRequest.id}`);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: status === 'Validated' 
        ? 'Demande créée et validée automatiquement, offre en brouillon'
        : 'Demande créée avec succès',
      request: newRequest
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création demande:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création de la demande',
      details: err.message 
    });
  } finally {
    client.release();
  }
});

// POST /api/recruitmentRequests/:id/validate - Valider une demande
router.post('/:id/validate', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { action, comments, validator_id, validator_name, validator_role } = req.body;

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ID de demande invalide' });
    }

    // Récupérer la demande
    const requestResult = await client.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [idNum]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const request = requestResult.rows[0];
    const validationFlow = request.validation_flow || ['Manager', 'Directeur', 'DRH'];
    
    // Trouver l'index du niveau actuel
    const currentLevelIndex = validationFlow.indexOf(request.current_validation_level);
    
    if (currentLevelIndex === -1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Niveau de validation invalide' });
    }

    // Enregistrer la validation
    await client.query(
      `INSERT INTO validation_tracking (
        request_id, validator_name, validator_role, validator_id,
        action, comments, validation_level, validation_order, validated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        idNum,
        validator_name,
        validator_role,
        validator_id,
        action,
        comments,
        request.current_validation_level,
        currentLevelIndex + 1,
        new Date()
      ]
    );

    if (action === 'rejected') {
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'Rejected', current_validation_level = 'Rejeté'
         WHERE id = $1`,
        [idNum]
      );
      
      await client.query('COMMIT');
      
      return res.json({
        success: true,
        message: 'Demande rejetée',
        status: 'Rejected'
      });
    }

    // Si approuvé, passer au niveau suivant ou valider complètement
    if (currentLevelIndex === validationFlow.length - 1) {
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'Validated', current_validation_level = 'Validé'
         WHERE id = $1`,
        [idNum]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Demande validée avec succès',
        status: 'Validated'
      });
      
    } else {
      const nextLevel = validationFlow[currentLevelIndex + 1];
      
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'InProgress', current_validation_level = $1
         WHERE id = $2`,
        [nextLevel, idNum]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Validation transférée à ${nextLevel}`,
        status: 'InProgress',
        nextLevel
      });
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur validation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// GET /api/recruitmentRequests - Récupérer toutes les demandes avec pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let baseQuery = 'SELECT * FROM recruitment_requests WHERE status != $1';
    let countQuery = 'SELECT COUNT(*) FROM recruitment_requests WHERE status != $1';
    const conditions = [];
    const values = ['Archivées'];

    if (status !== 'all') {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      conditions.push(`(title ILIKE $${values.length-2} OR department ILIKE $${values.length-1} OR location ILIKE $${values.length})`);
    }

    if (conditions.length > 0) {
      const whereClause = ' AND ' + conditions.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    baseQuery += ' ORDER BY created_at DESC LIMIT $' + (values.length+1) + ' OFFSET $' + (values.length+2);
    values.push(Number(limit), offset);

    console.log('🔍 Requête SQL:', baseQuery);
    console.log('📦 Paramètres:', values);

    const data = await pool.query(baseQuery, values);
    const countResult = await pool.query(countQuery, values.slice(0, values.length-2));
    const totalCount = Number(countResult.rows[0].count);

    console.log(`✅ ${data.rows.length} demandes trouvées sur ${totalCount} total`);

    res.json({ data: data.rows, totalCount });
  } catch (err) {
    console.error('❌ Erreur récupération demandes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/recruitmentRequests/:id - Récupérer une demande spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'ID de demande invalide' });
    }
    
    const requestResult = await pool.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [idNum]
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    
    const request = requestResult.rows[0];
    
    const historyResult = await pool.query(
      `SELECT * FROM validation_tracking 
       WHERE request_id = $1 
       ORDER BY validation_order ASC, validated_at DESC`,
      [idNum]
    );
    
    const offerResult = await pool.query(
      'SELECT * FROM job_offers WHERE request_id = $1',
      [idNum]
    );
    
    res.json({
      ...request,
      validation_history: historyResult.rows,
      job_offer: offerResult.rows[0] || null
    });
    
  } catch (err) {
    console.error('❌ Erreur récupération demande:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/recruitmentRequests/:id - Supprimer une demande
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ID de demande invalide' });
    }
    
    await client.query('DELETE FROM validation_tracking WHERE request_id = $1', [idNum]);
    await client.query('DELETE FROM job_offers WHERE request_id = $1', [idNum]);
    
    const result = await client.query(
      'DELETE FROM recruitment_requests WHERE id = $1 RETURNING *',
      [idNum]
    );
    
    await client.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    
    res.json({ 
      success: true, 
      message: 'Demande supprimée avec succès',
      deleted: result.rows[0]
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur suppression:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// ============================================
// ROUTES POUR LES STATISTIQUES
// ============================================

// GET /api/recruitmentRequests/requests/by-status/pending
router.get('/requests/by-status/pending', async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En attente', 'En attente de validation', 'Open')
      AND status != 'Archivées'
    `;
    const result = await pool.query(query);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur count pending:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitmentRequests/requests/by-status/in-progress
router.get('/requests/by-status/in-progress', async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En cours', 'InProgress')
      AND status != 'Archivées'
    `;
    const result = await pool.query(query);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur count in-progress:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitmentRequests/requests/by-status/validated
router.get('/requests/by-status/validated', async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('Validées', 'Validated') 
      OR current_validation_level = 'Validé'
      AND status != 'Archivées'
    `;
    const result = await pool.query(query);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur count validated:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitmentRequests/requests/pending-for-user
router.get('/requests/pending-for-user', async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.json({ count: 0 });
    }

    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE current_validation_level = $1 
      AND status IN ('En attente', 'En cours')
      AND status != 'Archivées'
    `;
    
    const result = await pool.query(query, [role]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur pending for user:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitmentRequests/requests/stats - Récupérer toutes les statistiques
router.get('/requests/stats', async (req, res) => {
  try {
    const { role } = req.query;
    
    const pendingQuery = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En attente', 'En attente de validation', 'Open')
      AND status != 'Archivées'
    `;
    
    const inProgressQuery = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En cours', 'InProgress')
      AND status != 'Archivées'
    `;
    
    const validatedQuery = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('Validées', 'Validated') 
      OR current_validation_level = 'Validé'
      AND status != 'Archivées'
    `;
    
    let pendingValidationsQuery = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE current_validation_level = $1 
      AND status IN ('En attente', 'En cours')
      AND status != 'Archivées'
    `;
    
    const [pendingResult, inProgressResult, validatedResult, pendingValidationsResult] = await Promise.all([
      pool.query(pendingQuery),
      pool.query(inProgressQuery),
      pool.query(validatedQuery),
      role ? pool.query(pendingValidationsQuery, [role]) : Promise.resolve({ rows: [{ count: 0 }] })
    ]);

    res.json({
      openRequests: parseInt(pendingResult.rows[0].count) + parseInt(inProgressResult.rows[0].count),
      pendingValidations: parseInt(pendingValidationsResult.rows[0].count),
      activeOffers: parseInt(validatedResult.rows[0].count)
    });

  } catch (err) {
    console.error('❌ Erreur stats requests:', err);
    res.status(500).json({ 
      openRequests: 0,
      pendingValidations: 0,
      activeOffers: 0
    });
  }
});

export default router;