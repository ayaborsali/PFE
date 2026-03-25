import express from 'express';
import { pool } from '../config/db.js'; // connection PostgreSQL

const router = express.Router();

// GET /api/recruitmentRequests - Récupérer toutes les demandes avec pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, status = 'all', search = '' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  try {
    let baseQuery = 'SELECT * FROM recruitment_requests';
    let countQuery = 'SELECT COUNT(*) FROM recruitment_requests';
    const conditions = [];
    const values = [];

    if (status !== 'all') {
      // Mapping plus flexible qui gère plusieurs formats
      let dbStatusConditions = [];
      
      switch(status) {
        case 'Open':
          dbStatusConditions = ['En attente de validation', 'Open', 'en attente'];
          break;
        case 'InProgress':
          dbStatusConditions = ['En cours', 'InProgress', 'in progress'];
          break;
        case 'Validated':
          dbStatusConditions = ['Validé', 'Validated', 'validé'];
          break;
        case 'Rejected':
          dbStatusConditions = ['Refusé', 'Rejected', 'refusé'];
          break;
        case 'Closed':
          dbStatusConditions = ['Clôturé', 'Closed', 'clôturé'];
          break;
        default:
          dbStatusConditions = [status];
      }
      
      // Construire une condition OR pour les différents formats
      const orConditions = dbStatusConditions.map((_, index) => {
        return `status = $${values.length + index + 1}`;
      }).join(' OR ');
      
      conditions.push(`(${orConditions})`);
      
      // Ajouter toutes les valeurs
      dbStatusConditions.forEach(s => values.push(s));
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

// GET /api/recruitmentRequests/:id - Récupérer une demande spécifique avec son historique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer la demande
    const requestResult = await pool.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [id]
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    
    const request = requestResult.rows[0];
    
    // Récupérer l'historique des validations
    const historyResult = await pool.query(
      `SELECT * FROM validation_tracking 
       WHERE request_id = $1 
       ORDER BY validation_order ASC, validated_at DESC`,
      [id]
    );
    
    // Vérifier si une offre d'emploi existe pour cette demande
    const offerResult = await pool.query(
      'SELECT * FROM job_offers WHERE request_id = $1',
      [id]
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

// POST /api/recruitment/new-request - Créer une nouvelle demande
router.post('/new-request', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📥 Données reçues:', req.body); // Debug
    
    const {
      title, 
      department, 
      location, 
      contract_type, 
      reason, 
      reason_details,
      salary_min,  // ⚠️ Attention: c'est salary_min et non salaryMin
      salary_max,  // ⚠️ Attention: c'est salary_max et non salaryMax
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

    console.log('💰 Salaires à insérer:', { salary_min, salary_max }); // Debug

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
        salary_min || null,  // Si undefined ou null, mettre null
        salary_max || null,  // Si undefined ou null, mettre null
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
      
      // Calculer le budget annuel si les salaires sont fournis
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

// POST /api/recruitment-requests/:id/validate - Valider une demande (étape par étape)
router.post('/:id/validate', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { action, comments, validator_id, validator_name, validator_role } = req.body;

    // Récupérer la demande
    const requestResult = await client.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [id]
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
        id,
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
      // Si rejeté, mettre à jour le statut
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'Rejected', current_validation_level = 'Rejeté'
         WHERE id = $1`,
        [id]
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
      // Dernier niveau - validation finale
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'Validated', current_validation_level = 'Validé'
         WHERE id = $1`,
        [id]
      );
      
      // Vérifier si une offre existe déjà
      const existingOffer = await client.query(
        'SELECT id FROM job_offers WHERE request_id = $1',
        [id]
      );

      if (existingOffer.rows.length === 0) {
        // Créer l'offre d'emploi en BROUILLON
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        
        await client.query(
          `INSERT INTO job_offers (
            request_id, title, department, location, contract_type, description,
            required_skills, level, experience, budget, remote_work, travel_required,
            start_date, benefits, publication_date, application_deadline, status,
            created_by, created_by_name, published_by, published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
          [
            id,
            request.title,
            request.department,
            request.location,
            request.contract_type,
            request.description,
            request.required_skills || [],
            request.level,
            request.experience,
            request.budget,
            request.remote_work || false,
            request.travel_required || false,
            request.start_date,
            ['Tickets restaurant', 'Mutuelle', 'Télétravail'],
            null, // publication_date reste null car non publiée
            deadline.toISOString().split('T')[0],
            'draft', // ✅ Statut DRAFT
            request.created_by,
            request.created_by_name,
            null, // published_by reste null
            null  // published_at reste null
          ]
        );
        
        console.log(`✅ Offre d'emploi créée en BROUILLON pour la demande ${id}`);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Demande validée avec succès et offre créée en brouillon',
        status: 'Validated',
        nextLevel: null
      });
      
    } else {
      // Passer au niveau suivant
      const nextLevel = validationFlow[currentLevelIndex + 1];
      
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'InProgress', current_validation_level = $1
         WHERE id = $2`,
        [nextLevel, id]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Validation enregistrée, prochain niveau: ${nextLevel}`,
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

// POST /api/recruitment-requests/:id/validate-manager-only - Validation automatique pour circuit simplifié
router.post('/:id/validate-manager-only', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { comments, validator_id, validator_name, validator_role } = req.body;

    // Récupérer la demande
    const requestResult = await client.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [id]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const request = requestResult.rows[0];

    // Vérifier que le circuit est bien uniquement Manager
    if (!request.validation_flow || 
        request.validation_flow.length !== 1 || 
        request.validation_flow[0] !== 'Manager') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cette demande nécessite un circuit de validation complet' 
      });
    }

    // Vérifier que la demande n'est pas déjà validée
    if (request.status === 'Validated') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Cette demande est déjà validée'
      });
    }

    // 1. Enregistrer dans validation_tracking
    await client.query(
      `INSERT INTO validation_tracking (
        request_id, validator_name, validator_role, validator_id,
        action, comments, validation_level, validation_order, validated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        validator_name || request.created_by_name,
        validator_role || request.created_by_role,
        validator_id || request.created_by,
        'approved',
        comments || 'Validation automatique (circuit simplifié)',
        'Manager',
        1,
        new Date()
      ]
    );

    // 2. Mettre à jour le statut de la demande
    await client.query(
      `UPDATE recruitment_requests 
       SET status = 'Validated', 
           current_validation_level = 'Validé'
       WHERE id = $1`,
      [id]
    );

    // 3. Vérifier si une offre existe déjà
    const existingOffer = await client.query(
      'SELECT id FROM job_offers WHERE request_id = $1',
      [id]
    );

    if (existingOffer.rows.length === 0) {
      // Créer l'offre d'emploi en BROUILLON
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      
      await client.query(
        `INSERT INTO job_offers (
          request_id, title, department, location, contract_type, description,
          required_skills, level, experience, budget, remote_work, travel_required,
          start_date, benefits, publication_date, application_deadline, status,
          created_by, created_by_name, published_by, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          id,
          request.title,
          request.department,
          request.location,
          request.contract_type,
          request.description,
          request.required_skills || [],
          request.level,
          request.experience,
          request.budget,
          request.remote_work || false,
          request.travel_required || false,
          request.start_date,
          ['Tickets restaurant', 'Mutuelle', 'Télétravail'],
          null, // publication_date reste null car non publiée
          deadline.toISOString().split('T')[0],
          'draft', // ✅ Statut DRAFT
          request.created_by,
          request.created_by_name,
          null, // published_by reste null
          null  // published_at reste null
        ]
      );
      
      console.log(`✅ Offre d'emploi créée en BROUILLON pour la demande ${id}`);
    }

    await client.query('COMMIT');

    // Récupérer la demande mise à jour
    const updatedRequest = await client.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Demande validée automatiquement et offre créée en brouillon',
      request: updatedRequest.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur validation automatique:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// GET /api/recruitment-requests/:id/validation-history - Récupérer l'historique des validations
router.get('/:id/validation-history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT vt.*, u.full_name as user_full_name, u.email as user_email
       FROM validation_tracking vt
       LEFT JOIN users u ON vt.validator_id = u.id
       WHERE vt.request_id = $1
       ORDER BY vt.validation_order ASC, vt.validated_at DESC`,
      [id]
    );
    
    res.json(result.rows);
    
  } catch (err) {
    console.error('❌ Erreur récupération historique:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/recruitmentRequests/:id - Supprimer une demande
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Supprimer d'abord les enregistrements liés (cascade devrait gérer, mais on fait manuellement pour être sûr)
    await client.query('DELETE FROM validation_tracking WHERE request_id = $1', [id]);
    await client.query('DELETE FROM job_offers WHERE request_id = $1', [id]);
    
    // Supprimer la demande
    const result = await client.query(
      'DELETE FROM recruitment_requests WHERE id = $1 RETURNING *',
      [id]
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
// ROUTES POUR LES COMPTEURS (STATISTIQUES)
// ============================================

// GET /api/recruitment/requests/by-status/pending - Compter les demandes en attente
router.get('/requests/by-status/pending', async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En attente')
    `;
    
    const result = await pool.query(query);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur count pending:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitment/requests/by-status/in-progress - Compter les demandes en cours
router.get('/requests/by-status/in-progress', async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En cours')
    `;
    
    const result = await pool.query(query);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur count in-progress:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitment/requests/by-status/validated - Compter les demandes validées
router.get('/requests/by-status/validated', async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('Validées') 
         OR current_validation_level = 'Validé'
    `;
    
    const result = await pool.query(query);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur count validated:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitment/requests/pending-for-user - Compter les validations en attente pour un rôle
router.get('/requests/pending-for-user', async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.json({ count: 0 });
    }

    const query = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE current_validation_level = $1 
      AND status IN ('En attente','En cours', 'Validées')
    `;
    
    const result = await pool.query(query, [role]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Erreur pending for user:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitment/requests/count - Route générique
router.get('/requests/count', async (req, res) => {
  try {
    const { status, validation_level } = req.query;
    let query = 'SELECT COUNT(*) FROM recruitment_requests WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
      if (status === 'En attente') {
        query += ` AND (status = $${paramCount} OR status = $${paramCount+1})`;
        values.push('En attente de validation', 'Open');
        paramCount += 2;
      } else if (status === 'En cours') {
        query += ` AND (status = $${paramCount} OR status = $${paramCount+1})`;
        values.push('En cours', 'InProgress');
        paramCount += 2;
      } else if (status === 'Validées') {
        query += ` AND (status = $${paramCount} OR current_validation_level = $${paramCount+1})`;
        values.push('Validated', 'Validé');
        paramCount += 2;
      } else {
        query += ` AND status = $${paramCount}`;
        values.push(status);
        paramCount++;
      }
    }

    if (validation_level) {
      query += ` AND current_validation_level = $${paramCount}`;
      values.push(validation_level);
      paramCount++;
    }

    const result = await pool.query(query, values);
    res.json({ count: parseInt(result.rows[0].count) });
    
  } catch (err) {
    console.error('❌ Erreur count requests:', err);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// GET /api/recruitment/requests/stats - Récupérer toutes les statistiques en une seule requête
router.get('/requests/stats', async (req, res) => {
  try {
    const { role } = req.query;
    
    const pendingQuery = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En attente')
    `;
    
    const inProgressQuery = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('En cours')
    `;
    
    const validatedQuery = `
      SELECT COUNT(*) FROM recruitment_requests 
      WHERE status IN ('Validées') OR current_validation_level = 'Validé'
    `;
    
    let pendingValidationsQuery = 'SELECT COUNT(*) FROM recruitment_requests WHERE 1=1';
    const pendingValues = [];
    
    if (role) {
      pendingValidationsQuery += ` AND current_validation_level = $1 AND status IN ('En attente', 'En cours', 'Validées')`;
      pendingValues.push(role);
    }

    const [
      pendingResult,
      inProgressResult,
      validatedResult,
      pendingValidationsResult
    ] = await Promise.all([
      pool.query(pendingQuery),
      pool.query(inProgressQuery),
      pool.query(validatedQuery),
      role ? pool.query(pendingValidationsQuery, pendingValues) : Promise.resolve({ rows: [{ count: 0 }] })
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

// PUT /api/recruitmentRequests/:id - Mettre à jour une demande
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });
    
    values.push(id);
    
    const query = `
      UPDATE recruitment_requests 
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    
    res.json({ 
      success: true, 
      message: 'Demande mise à jour avec succès',
      request: result.rows[0]
    });
    
  } catch (err) {
    console.error('❌ Erreur mise à jour:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;