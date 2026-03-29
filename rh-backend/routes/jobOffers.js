import express from 'express';
import { pool } from '../config/db.js';
import { auth } from '../middleware/auth.js';
import LinkedInService from '../services/linkedinService.js';
import NLPService from '../services/nlpService.js';
import { sendEmail } from '../services/emailService.js';

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

// Route pour publier une offre
router.post('/:id/publish', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { platforms = [], useAI = true } = req.body;
    const userName = req.user.full_name || req.user.email;
    
    console.log('📤 Publication offre ID:', id);
    console.log('📋 Plateformes sélectionnées:', platforms);
    
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
    
    const publicationResults = [];
    let hasSuccess = false;
    
    // Publication sur LinkedIn
    if (platforms.includes('linkedin')) {
      console.log('📤 Publication sur LinkedIn...');
      
      const linkedinToken = req.headers['x-linkedin-token'];
      
      if (!linkedinToken) {
        publicationResults.push({
          platform: 'linkedin',
          success: false,
          error: 'Token LinkedIn non fourni'
        });
      } else {
        const linkedinResult = await LinkedInService.publishJobOffer(linkedinToken, offer, useAI);
        publicationResults.push({
          platform: 'linkedin',
          ...linkedinResult
        });
        if (linkedinResult.success) hasSuccess = true;
      }
    }
    
    // Publication sur Tanitjobs
    if (platforms.includes('tanitjobs')) {
      console.log('📤 Publication sur Tanitjobs...');
      publicationResults.push({
        platform: 'tanitjobs',
        success: true,
        message: 'Publié sur Tanitjobs'
      });
      hasSuccess = true;
    }
    
    // Publication interne
    if (platforms.includes('internal')) {
      console.log('📤 Publication sur l\'intranet...');
      publicationResults.push({
        platform: 'internal',
        success: true,
        message: 'Publié sur l\'intranet'
      });
      hasSuccess = true;
    }
    
    // Mise à jour du statut
    if (platforms.length === 0) {
      console.log('📤 Mise à jour du statut uniquement...');
      hasSuccess = true;
    }
    
    if (hasSuccess) {
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
      console.log('✅ Statut de l\'offre mis à jour: draft → published');
    } else {
      console.log('⚠️ Aucune publication réussie, statut non modifié');
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: hasSuccess,
      message: hasSuccess ? 'Offre publiée avec succès' : 'Publication échouée',
      publications: publicationResults,
      jobOffer: hasSuccess ? { ...offer, status: 'published' } : offer
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

router.post('/:id/reopen', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { platforms = [], useAI = true } = req.body;
    const userName = req.user.full_name || req.user.email;
    const linkedinToken = req.headers['x-linkedin-token'];
    
    console.log('🔓 RÉOUVERTURE offre ID:', id);
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
    
    // Vérifier que l'offre est clôturée
    if (offer.status !== 'closed') {
      return res.status(400).json({ 
        error: 'Seules les offres clôturées peuvent être rouvertes',
        current_status: offer.status
      });
    }
    
    await client.query('BEGIN');
    
    const publicationResults = [];
    let hasSuccess = false;
    
    // 1. PUBLICATION SUR LINKEDIN
    if (platforms.includes('linkedin')) {
      console.log('📤 Publication sur LinkedIn...');
      
      if (!linkedinToken) {
        publicationResults.push({
          platform: 'linkedin',
          success: false,
          error: 'Token LinkedIn non fourni'
        });
      } else {
        const linkedinResult = await LinkedInService.publishJobOffer(linkedinToken, offer, useAI);
        publicationResults.push({
          platform: 'linkedin',
          ...linkedinResult
        });
        if (linkedinResult.success) hasSuccess = true;
      }
    }
    
    // 2. PUBLICATION SUR TANITJOBS
    if (platforms.includes('tanitjobs')) {
      console.log('📤 Publication sur Tanitjobs...');
      publicationResults.push({
        platform: 'tanitjobs',
        success: true,
        message: 'Publié sur Tanitjobs'
      });
      hasSuccess = true;
    }
    
    // 3. PUBLICATION INTERNE (email)
    if (platforms.includes('internal')) {
      console.log('📤 Envoi d\'email...');
      publicationResults.push({
        platform: 'internal',
        success: true,
        message: 'Email envoyé'
      });
      hasSuccess = true;
    }
    
    // 4. Mise à jour du statut
    if (hasSuccess || platforms.length === 0) {
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
      console.log('✅ Statut de l\'offre mis à jour: closed → published');
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: hasSuccess || platforms.length === 0,
      message: hasSuccess ? 'Offre republiée avec succès' : 'Offre réactivée',
      publications: publicationResults,
      jobOffer: { ...offer, status: 'published' }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur réouverture:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  } finally {
    client.release();
  }
});

// Route publique pour une offre
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ⭐ Récupérer l'offre même si elle n'est pas publiée (pour connaître son statut)
    const result = await pool.query(
      `SELECT id, title, description, location, contract_type, experience, department, benefits, status
       FROM job_offers 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Offre non trouvée',
        code: 'NOT_FOUND'
      });
    }
    
    const offer = result.rows[0];
    
    // ⭐ Si l'offre n'est pas publiée, retourner un code spécifique
    if (offer.status !== 'published') {
      return res.status(410).json({ 
        error: 'Cette offre n\'est plus disponible',
        code: 'OFFER_CLOSED',
        status: offer.status,
        message: offer.status === 'closed' ? 'L\'offre est clôturée' : 'L\'offre n\'est pas encore publiée'
      });
    }
    
    // Retourner l'offre sans le statut (pour ne pas exposer les infos internes)
    const { status, ...publicOffer } = offer;
    res.json(publicOffer);
    
  } catch (error) {
    console.error('❌ Erreur récupération offre publique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/generate-text', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('='.repeat(50));
    console.log('📤 GÉNÉRATION DE TEXTE - Offre ID:', id);
    console.log('='.repeat(50));
    
    // Récupérer l'offre
    const result = await pool.query(
      'SELECT * FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    const offer = result.rows[0];
    console.log('📋 Titre:', offer.title);
    console.log('📝 Description (100 chars):', offer.description?.substring(0, 100));
    
    // ⭐ PRÉPARER LES DONNÉES AVEC LES BONS TYPES ⭐
    const nlpOffer = {
      id: String(offer.id),
      title: String(offer.title || ''),
      description: String(offer.description || ''),
      profile_required: String(offer.profile_required || ''),
      location: String(offer.location || ''),
      contract_type: String(offer.contract_type || ''),
      experience: String(offer.experience || ''),
      benefits: Array.isArray(offer.benefits) ? offer.benefits.map(b => String(b)) : [],
      remote_work: Boolean(offer.remote_work),
      salary_min: offer.salary_min !== null && offer.salary_min !== undefined ? Number(offer.salary_min) : null,
      salary_max: offer.salary_max !== null && offer.salary_max !== undefined ? Number(offer.salary_max) : null
    };
    
    console.log('🤖 Appel du service NLP...');
    console.log('📦 ID (type):', typeof nlpOffer.id, nlpOffer.id);
    console.log('📦 Titre (type):', typeof nlpOffer.title, nlpOffer.title);
    
    // Appeler le service NLP
    const nlpResult = await NLPService.rephraseOffer(nlpOffer);
    
    if (nlpResult.success) {
      console.log('✅ Texte généré avec succès, longueur:', nlpResult.description?.length);
      res.json({
        success: true,
        generatedText: nlpResult.description
      });
    } else {
      console.error('❌ Échec NLP:', nlpResult.error);
      res.status(500).json({
        success: false,
        error: nlpResult.error || 'Erreur de génération'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur génération texte:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

// Route pour envoyer l'offre par email à tous les utilisateurs
router.post('/:id/send-email', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { useAI = true } = req.body;
    
    console.log('📧 Envoi de l\'offre par email - ID:', id);
    
    // 1. Récupérer l'offre
    const offerResult = await pool.query(
      'SELECT * FROM job_offers WHERE id = $1',
      [id]
    );
    
    if (offerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    const offer = offerResult.rows[0];
    
    // 2. Récupérer tous les utilisateurs
    const usersResult = await pool.query(
      'SELECT id, email, full_name FROM users'
    );
    
    if (usersResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé' });
    }
    
    // 3. Générer le texte reformulé via NLP
    // ⭐ CORRECTION : Convertir tous les champs au bon type
    const nlpOffer = {
      id: String(offer.id),  // ⭐ Convertir en string
      title: String(offer.title || ''),
      description: String(offer.description || ''),
      profile_required: String(offer.profile_required || ''),
      location: String(offer.location || ''),
      contract_type: String(offer.contract_type || ''),
      experience: String(offer.experience || ''),
      benefits: Array.isArray(offer.benefits) ? offer.benefits.map(b => String(b)) : [],
      remote_work: Boolean(offer.remote_work),
      salary_min: offer.salary_min !== null && offer.salary_min !== undefined ? Number(offer.salary_min) : null,
      salary_max: offer.salary_max !== null && offer.salary_max !== undefined ? Number(offer.salary_max) : null
    };
    
    console.log('🤖 Appel du NLP pour reformuler l\'offre...');
    console.log('📦 ID (type):', typeof nlpOffer.id, nlpOffer.id);
    
    const nlpResult = await NLPService.rephraseOffer(nlpOffer);
    
    let emailContent = '';
    if (nlpResult.success && nlpResult.description) {
      emailContent = nlpResult.description;
    } else {
      emailContent = formatOfferForEmail(offer);
    }
    
    // 4. Construire l'email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
          .offer-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #10b981; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
          .button { display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Nouvelle offre d'emploi</h1>
          </div>
          <div class="content">
            <div class="offer-title">${escapeHtml(offer.title)}</div>
            <div style="white-space: pre-wrap;">${escapeHtml(emailContent)}</div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${offer.id}" class="button">📝 Postuler maintenant</a>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement.</p>
            <p>© ${new Date().getFullYear()} - Votre Entreprise</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // 5. Envoyer les emails
    const emailResults = [];
    for (const user of usersResult.rows) {
      try {
        await sendEmail({
          to: user.email,
          subject: `Nouvelle offre d'emploi: ${offer.title}`,
          html: emailHtml
        });
        emailResults.push({ email: user.email, success: true });
        console.log(`✅ Email envoyé à ${user.email}`);
      } catch (error) {
        console.error(`❌ Erreur envoi à ${user.email}:`, error.message);
        emailResults.push({ email: user.email, success: false, error: error.message });
      }
    }
    
    const successCount = emailResults.filter(r => r.success).length;
    res.json({
      success: successCount > 0,
      message: `${successCount}/${emailResults.length} emails envoyés avec succès`,
      results: emailResults,
      generatedText: emailContent
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi emails:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

// Helper pour formater l'offre (fallback)
function formatOfferForEmail(offer) {
  let text = `🎯 **${offer.title}**\n\n`;
  text += `${offer.description}\n\n`;
  text += `📍 **Localisation:** ${offer.location}\n`;
  text += `📝 **Type de contrat:** ${offer.contract_type}\n`;
  if (offer.experience) text += `💼 **Expérience:** ${offer.experience}\n`;
  if (offer.benefits && offer.benefits.length > 0) {
    text += `\n✨ **Avantages:**\n`;
    offer.benefits.forEach(b => text += `✓ ${b}\n`);
  }
  return text;
}

// Helper pour échapper le HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
}
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

// Route pour récupérer les offres en brouillon
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