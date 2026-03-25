import express from 'express';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Route pour créer une nouvelle demande
router.post('/new-request', auth, async (req, res) => {
  try {
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
      start_date, 
      replacement_name, 
      replacement_reason,
      level, 
      experience, 
      remote_work, 
      travel_required, 
      priority,
      validation_flow,
      status: receivedStatus,
      current_validation_level: receivedCurrentLevel,
      created_by,
      created_by_name,
      created_by_role
    } = req.body;

    console.log('💰 Salaires reçus:', { salary_min, salary_max, typeMin: typeof salary_min, typeMax: typeof salary_max });

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
          contract_type === 'Saisonnier') {
        finalValidationFlow = ['Manager'];
      } else if (level === 'Baccalauréat' || level === 'Bac+2 (DUT, BTS)') {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
      } else if (level === 'Master (Bac+5)' || level === 'Diplôme d\'Ingénieur') {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH', 'DAF'];
      } else if (title && (title.includes('Directeur') || title.includes('Responsable'))) {
        finalValidationFlow = ['DRH', 'DAF', 'DGA/DG'];
      } else {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
      }
    }

    // Déterminer le statut et le niveau initial
    let finalStatus = receivedStatus || 'En attente';
    let finalCurrentLevel = receivedCurrentLevel || finalValidationFlow[0];

    // Si circuit simplifié (Manager uniquement), on valide directement
    if (finalValidationFlow.length === 1 && finalValidationFlow[0] === 'Manager') {
      finalStatus = 'Validées';
      finalCurrentLevel = 'Validé';
    }

    // Formater les salaires
    const salaryMinNum = (salary_min !== undefined && salary_min !== null && salary_min !== '') 
      ? parseFloat(salary_min) 
      : null;
    const salaryMaxNum = (salary_max !== undefined && salary_max !== null && salary_max !== '') 
      ? parseFloat(salary_max) 
      : null;

    console.log('💰 Salaires après conversion:', { salaryMinNum, salaryMaxNum });

    // Validation des salaires
    if (salaryMinNum !== null && salaryMaxNum !== null && salaryMinNum >= salaryMaxNum) {
      return res.status(400).json({ 
        message: 'Le salaire minimum doit être inférieur au salaire maximum' 
      });
    }

    // Formatage du tableau pour PostgreSQL
    const formatPGArray = (arr) => {
      if (!arr || arr.length === 0) return '{}';
      const escaped = arr.map(s => {
        const str = String(s).replace(/"/g, '\\"');
        return `"${str}"`;
      });
      return `{${escaped.join(',')}}`;
    };

    // S'assurer que required_skills est un tableau
    const skillsArray = Array.isArray(required_skills) 
      ? required_skills 
      : (required_skills ? required_skills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const query = `
      INSERT INTO recruitment_requests
      (
        title, department, location, contract_type, reason, 
        reason_details, salary_min, salary_max, required_skills, description,
        urgent, created_by, created_by_name, created_by_role, 
        start_date, replacement_name, replacement_reason,
        level, experience, remote_work, travel_required, priority,
        validation_flow, current_validation_level, status,
        created_at
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
       $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW())
      RETURNING *;
    `;

    const values = [
      title,
      department,
      location,
      contract_type,
      reason,
      JSON.stringify(reason_details || {}),
      salaryMinNum,
      salaryMaxNum,
      formatPGArray(skillsArray),
      description || '',
      urgent === true || urgent === 'true' || false,
      created_by || req.user?.id,
      created_by_name || req.user?.name || req.user?.email || 'Utilisateur',
      created_by_role || req.user?.role || 'Manager',
      start_date || null,
      replacement_name || null,
      replacement_reason || null,
      level || 'Bac+2 (DUT, BTS)',
      experience || '1-3 ans',
      remote_work === true || remote_work === 'true' || false,
      travel_required === true || travel_required === 'true' || false,
      priority || 'medium',
      formatPGArray(finalValidationFlow),
      finalCurrentLevel,
      finalStatus
    ];

    console.log('📝 Création demande:', {
      title,
      salary_min: salaryMinNum,
      salary_max: salaryMaxNum,
      status: finalStatus,
      current_level: finalCurrentLevel,
      validation_flow: finalValidationFlow
    });

    const { rows } = await pool.query(query, values);
    const newRequest = rows[0];

    console.log('✅ Demande créée ID:', newRequest.id);
    console.log('💰 Salaires enregistrés dans DB:', {
      salary_min: newRequest.salary_min,
      salary_max: newRequest.salary_max
    });

    // Si la demande est automatiquement validée, créer l'offre d'emploi (si elle n'existe pas déjà)
    if (finalStatus === 'Validées') {
      // Vérifier si une offre existe déjà pour cette demande
      const existingOffer = await pool.query(
        'SELECT id FROM job_offers WHERE request_id = $1',
        [newRequest.id]
      );
      
      if (existingOffer.rows.length === 0) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        
        // Calculer le budget annuel
        let annualBudget = null;
        if (salaryMinNum !== null && salaryMaxNum !== null) {
          const avgMonthly = (salaryMinNum + salaryMaxNum) / 2;
          annualBudget = avgMonthly * 12;
        }
        
        // Vérifier si la table job_offers a les colonnes salary_min et salary_max
        let hasSalaryColumns = false;
        try {
          const checkColumns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_offers' 
            AND column_name IN ('salary_min', 'salary_max')
          `);
          hasSalaryColumns = checkColumns.rows.length === 2;
        } catch (err) {
          console.log('⚠️ Impossible de vérifier les colonnes job_offers, utilisation du fallback');
        }
        
        let jobOfferQuery;
        let jobOfferValues;
        
        if (hasSalaryColumns) {
          jobOfferQuery = `
            INSERT INTO job_offers (
              request_id, title, department, location, contract_type, description,
              required_skills, level, experience, budget, salary_min, salary_max,
              remote_work, travel_required, start_date, benefits,
              publication_date, application_deadline, status,
              created_by, created_by_name, published_by, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          `;
          jobOfferValues = [
            newRequest.id,
            title,
            department,
            location,
            contract_type,
            description || '',
            skillsArray,
            level || 'Bac+2 (DUT, BTS)',
            experience || '1-3 ans',
            annualBudget,
            salaryMinNum,
            salaryMaxNum,
            remote_work === true || remote_work === 'true' || false,
            travel_required === true || travel_required === 'true' || false,
            start_date,
            ['Tickets restaurant', 'Mutuelle', 'Télétravail'],
            null,
            deadline.toISOString().split('T')[0],
            'draft',
            created_by || req.user?.id,
            created_by_name || req.user?.name || req.user?.email,
            null,
            null
          ];
        } else {
          jobOfferQuery = `
            INSERT INTO job_offers (
              request_id, title, department, location, contract_type, description,
              required_skills, level, experience, budget,
              remote_work, travel_required, start_date, benefits,
              publication_date, application_deadline, status,
              created_by, created_by_name, published_by, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          `;
          jobOfferValues = [
            newRequest.id,
            title,
            department,
            location,
            contract_type,
            description || '',
            skillsArray,
            level || 'Bac+2 (DUT, BTS)',
            experience || '1-3 ans',
            annualBudget,
            remote_work === true || remote_work === 'true' || false,
            travel_required === true || travel_required === 'true' || false,
            start_date,
            ['Tickets restaurant', 'Mutuelle', 'Télétravail'],
            null,
            deadline.toISOString().split('T')[0],
            'draft',
            created_by || req.user?.id,
            created_by_name || req.user?.name || req.user?.email,
            null,
            null
          ];
        }
        
        try {
          await pool.query(jobOfferQuery, jobOfferValues);
          console.log(`✅ Offre d'emploi créée en BROUILLON pour la demande ${newRequest.id}`);
        } catch (offerError) {
          console.error('⚠️ Erreur création offre:', offerError.message);
          // Ne pas bloquer la création de la demande si l'offre échoue
        }
      } else {
        console.log(`ℹ️ Offre déjà existante pour la demande ${newRequest.id}, création ignorée`);
      }
    }

    res.status(201).json({ 
      data: newRequest,
      message: finalStatus === 'Validées' 
        ? 'Demande créée et validée automatiquement, offre en brouillon'
        : 'Demande créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création demande:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur lors de la création de la demande',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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