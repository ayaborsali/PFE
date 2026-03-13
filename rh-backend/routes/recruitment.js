import express from 'express';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Route pour créer une nouvelle demande
router.post('/new-request', auth, async (req, res) => {
  try {
    const {
      title, department, location, contract_type, reason,
      reason_details, budget, required_skills, description,
      urgent,
      start_date, replacement_name, replacement_reason,
      level, experience, remote_work, travel_required, priority,
      validation_flow
    } = req.body;

    // Validation des champs requis
    if (!title || !department || !location) {
      return res.status(400).json({ 
        message: 'Les champs titre, département et localisation sont requis' 
      });
    }

    // Définir un circuit de validation par défaut si non fourni
    let finalValidationFlow = validation_flow;
    if (!finalValidationFlow || finalValidationFlow.length === 0) {
      if (contract_type === 'Stage' || 
          contract_type === 'Alternance' || 
          contract_type === 'Intérim' || 
          contract_type === 'CDD Court (<3 mois)' || 
          contract_type === 'Saisonnier' ||
          level === 'Stagiaire') {
        finalValidationFlow = ['Manager'];
      } else if (level === 'Junior' || level === 'Confirmé') {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
      } else if (level === 'Senior' || level === 'Expert') {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH', 'DAF'];
      } else if (level === 'Lead' || title.includes('Directeur') || title.includes('Responsable')) {
        finalValidationFlow = ['DRH', 'DAF', 'DGA/DG'];
      } else {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
      }
    }

    // Déterminer le statut et le niveau initial
    let status = 'En attente';
    let current_validation_level = finalValidationFlow[0];

    // Si circuit simplifié (Manager uniquement), on valide directement
    if (finalValidationFlow.length === 1 && finalValidationFlow[0] === 'Manager') {
      status = 'Validées';
      current_validation_level = 'Validé';
    }

    // Formatage du tableau pour PostgreSQL
    const formatPGArray = (arr) => {
      if (!arr || arr.length === 0) return '{}';
      return `{${arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`;
    };

    const query = `
      INSERT INTO recruitment_requests
      (
        title, department, location, contract_type, reason, 
        reason_details, budget, required_skills, description,
        urgent, created_by, created_by_name, created_by_role, 
        start_date, replacement_name, replacement_reason,
        level, experience, remote_work, travel_required, priority,
        validation_flow, current_validation_level, status
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
       $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *;
    `;

    const values = [
      title,
      department,
      location,
      contract_type,
      reason,
      JSON.stringify(reason_details || {}),
      budget ? parseInt(budget, 10) : null,
      formatPGArray(required_skills || []),
      description,
      urgent || false,
      req.user.id,
      req.user.name || req.user.email,
      req.user.role,
      start_date,
      replacement_name || null,
      replacement_reason || null,
      level || 'Junior',
      experience || '1-3 ans',
      remote_work || false,
      travel_required || false,
      priority || 'medium',
      formatPGArray(finalValidationFlow),
      current_validation_level,
      status
    ];

    console.log('📝 Création demande:', {
      title,
      status,
      current_level: current_validation_level,
      validation_flow: finalValidationFlow
    });

    const { rows } = await pool.query(query, values);

    res.status(201).json({ 
      data: rows[0],
      message: 'Demande créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de la demande'
    });
  }
});

// Route pour récupérer les demandes avec pagination et filtres
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let baseQuery = 'SELECT * FROM recruitment_requests';
    let countQuery = 'SELECT COUNT(*) FROM recruitment_requests';
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

    baseQuery += ' ORDER BY created_at DESC LIMIT $' + (values.length+1) + ' OFFSET $' + (values.length+2);
    values.push(Number(limit), offset);

    const data = await pool.query(baseQuery, values);
    const countResult = await pool.query(countQuery, values.slice(0, values.length-2));
    const totalCount = Number(countResult.rows[0].count);

    res.json({ data: data.rows, totalCount });
  } catch (error) {
    console.error('❌ Erreur récupération:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

// Route pour valider une demande
router.post('/:id/validate', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { action, comments } = req.body;
    const userRole = req.user.role;

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
    
    // Vérifier que l'utilisateur a le bon rôle
    if (request.current_validation_level !== userRole) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        error: `Vous n'êtes pas autorisé. Niveau requis: ${request.current_validation_level}` 
      });
    }

    // Enregistrer dans l'historique
    await client.query(
      `INSERT INTO validation_tracking (
        request_id, validator_name, validator_role, validator_id,
        action, comments, validation_level, validated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        req.user.name || req.user.email,
        req.user.role,
        req.user.id,
        action,
        comments || null,
        request.current_validation_level,
        new Date()
      ]
    );

    if (action === 'reject') {
      // Rejet
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'Refusées', 
             current_validation_level = 'Rejeté'
         WHERE id = $1`,
        [id]
      );
      
      await client.query('COMMIT');
      
      return res.json({
        success: true,
        message: 'Demande rejetée',
        status: 'Refusées'
      });
    }

    // Approbation
    const currentIndex = validationFlow.indexOf(request.current_validation_level);
    
    if (currentIndex === validationFlow.length - 1) {
      // Dernier niveau - validation finale
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'Validées', 
             current_validation_level = 'Validé'
         WHERE id = $1`,
        [id]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Demande validée avec succès',
        status: 'Validées'
      });
      
    } else {
      // Passer au niveau suivant
      const nextLevel = validationFlow[currentIndex + 1];
      
      await client.query(
        `UPDATE recruitment_requests 
         SET status = 'En cours', 
             current_validation_level = $1
         WHERE id = $2`,
        [nextLevel, id]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Validation transférée à ${nextLevel}`,
        status: 'En cours',
        nextLevel
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur validation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Route pour clôturer une offre
router.post('/:id/close', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      `UPDATE recruitment_requests 
       SET status = 'Clôturées', 
           current_validation_level = 'Clôturé'
       WHERE id = $1`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Offre clôturée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur clôture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/recruitmentRequests/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM recruitment_requests WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    
    res.json({ 
      success: true, 
      message: 'Demande supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;