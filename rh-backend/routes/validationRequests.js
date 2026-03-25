import express from 'express';
import { pool } from '../config/db.js'; // connection PostgreSQL

const router = express.Router();

/**
 * GET /validation-requests?role=ROLE
 * Récupère toutes les demandes en attente de validation pour le rôle donné
 */
router.get("/validation-requests", async (req, res) => {
  try {
    const role = req.query.role;

    if (!role) {
      return res.status(400).json({ error: "Le rôle est requis dans les paramètres" });
    }

    console.log(`🔍 Recherche des demandes pour le rôle: ${role}`);

    // Mapping des rôles pour correspondre à la BD
    let dbRole = role;
    
    // Adapter selon vos valeurs en BD
    if (role.toLowerCase() === 'rh') {
      dbRole = 'DRH';
    } else if (role.toLowerCase() === 'dga') {
      dbRole = 'DGA/DG';
    } else if (role.toLowerCase() === 'manager') {
      dbRole = 'Manager';
    } else if (role.toLowerCase() === 'directeur') {
      dbRole = 'Directeur';
    } else if (role.toLowerCase() === 'daf') {
      dbRole = 'DAF';
    }

    const query = `
      SELECT *
      FROM recruitment_requests
      WHERE current_validation_level = $1
      AND status IN ('En attente', 'InProgress', 'pending')
      ORDER BY 
        CASE 
          WHEN urgent = true THEN 1 
          ELSE 2 
        END,
        created_at DESC
    `;

    const { rows } = await pool.query(query, [dbRole]);
    
    console.log(`✅ ${rows.length} demande(s) trouvée(s) pour ${role}`);

    return res.json(rows);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des demandes de validation :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /validation-requests/:id
 * Récupère une demande spécifique avec son historique
 */
router.get("/validation-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        rr.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'action', vt.action,
                'level', vt.validation_level,
                'user', vt.validator_name,
                'user_role', vt.validator_role,
                'comment', vt.comments,
                'timestamp', vt.validated_at
              )
              ORDER BY vt.validated_at DESC
            )
            FROM validation_tracking vt
            WHERE vt.request_id = rr.id
          ),
          '[]'::json
        ) as validation_history
      FROM recruitment_requests rr
      WHERE rr.id = $1
    `;
    
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }
    
    return res.json(rows[0]);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la demande :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * POST /validation-requests/:id/validate
 * Valider une demande
 */
router.post("/validation-requests/:id/validate", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { validator_name, validator_role, comment, next_level } = req.body;
    
    await client.query('BEGIN');
    
    // 1. Récupérer la demande actuelle
    const requestQuery = await client.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [id]
    );
    
    if (requestQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Demande non trouvée" });
    }
    
    const request = requestQuery.rows[0];
    
    // 2. Ajouter l'entrée dans validation_tracking
    await client.query(
      `INSERT INTO validation_tracking 
       (request_id, validator_name, validator_role, action, comments, validation_level, validation_order) 
       VALUES ($1, $2, $3, 'approved', $4, $5, 
         (SELECT COALESCE(MAX(validation_order), 0) + 1 FROM validation_tracking WHERE request_id = $1)
       )`,
      [id, validator_name, validator_role, comment, request.current_validation_level]
    );
    
    // 3. Mettre à jour la demande
    let updateQuery;
    let updateParams;
    
    if (next_level === 'COMPLETED') {
      // Validation finale
      updateQuery = `
        UPDATE recruitment_requests 
        SET status = 'Validated',
            current_validation_level = 'Validé',
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      updateParams = [id];
      
      // Calculer la date de deadline (30 jours par défaut)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      
      // 🔥 CRÉER L'OFFRE D'EMPLOI EN BROUILLON (draft)
      const offerQuery = `
        INSERT INTO job_offers (
          request_id,
          title,
          department,
          location,
          contract_type,
          description,
          required_skills,
          level,
          experience,
          budget,
          remote_work,
          travel_required,
          start_date,
          benefits,
          application_deadline,
          created_by,
          created_by_name,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'draft')
        ON CONFLICT (request_id) DO UPDATE SET
          title = EXCLUDED.title,
          department = EXCLUDED.department,
          location = EXCLUDED.location,
          contract_type = EXCLUDED.contract_type,
          description = EXCLUDED.description,
          required_skills = EXCLUDED.required_skills,
          level = EXCLUDED.level,
          experience = EXCLUDED.experience,
          budget = EXCLUDED.budget,
          remote_work = EXCLUDED.remote_work,
          travel_required = EXCLUDED.travel_required,
          start_date = EXCLUDED.start_date,
          benefits = EXCLUDED.benefits,
          application_deadline = EXCLUDED.application_deadline,
          updated_at = NOW(),
          status = 'draft'
        RETURNING id
      `;
      
      await client.query(offerQuery, [
        request.id,
        request.title,
        request.department,
        request.location,
        request.contract_type,
        request.description,
        request.required_skills,
        request.level,
        request.experience,
        request.budget,
        request.remote_work,
        request.travel_required,
        request.start_date,
        ['Tickets restaurant', 'Mutuelle', 'Télétravail'], // benefits
        deadline.toISOString().split('T')[0], // application_deadline
        request.created_by,
        request.created_by_name
      ]);
      
      console.log(`✅ Offre d'emploi créée en BROUILLON pour la demande ${id}`);
      
    } else {
      // Passage au niveau suivant
      updateQuery = `
        UPDATE recruitment_requests 
        SET current_validation_level = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      updateParams = [next_level, id];
    }
    
    const updatedRequest = await client.query(updateQuery, updateParams);
    
    await client.query('COMMIT');
    
    console.log(`✅ Demande ${id} validée par ${validator_role}`);
    
    return res.json({
      message: next_level === 'COMPLETED' 
        ? "Validation finale enregistrée avec succès. Une offre d'emploi a été créée en brouillon." 
        : "Validation enregistrée avec succès",
      request: updatedRequest.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erreur lors de la validation :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
});

/**
 * POST /validation-requests/:id/reject
 * Refuser une demande
 */
router.post("/validation-requests/:id/reject", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { validator_name, validator_role, comment } = req.body;
    
    await client.query('BEGIN');
    
    // 1. Récupérer le niveau de validation actuel
    const currentRequest = await client.query(
      'SELECT current_validation_level FROM recruitment_requests WHERE id = $1',
      [id]
    );
    
    if (currentRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Demande non trouvée" });
    }
    
    const currentLevel = currentRequest.rows[0].current_validation_level;
    
    // 2. Ajouter l'entrée dans validation_tracking
    await client.query(
      `INSERT INTO validation_tracking 
       (request_id, validator_name, validator_role, action, comments, validation_level, validation_order) 
       VALUES ($1, $2, $3, 'rejected', $4, $5,
         (SELECT COALESCE(MAX(validation_order), 0) + 1 FROM validation_tracking WHERE request_id = $1)
       )`,
      [id, validator_name, validator_role, comment, currentLevel]
    );
    
    // 3. Mettre à jour la demande
    const updatedRequest = await client.query(
      `UPDATE recruitment_requests 
       SET status = 'Rejected',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    await client.query('COMMIT');
    
    console.log(`❌ Demande ${id} refusée par ${validator_role}`);
    
    return res.json({
      message: "Refus enregistré avec succès",
      request: updatedRequest.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erreur lors du refus :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
});

export default router;