import { pool } from '../config/db.js';

async function createTables() {
  const queryUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name VARCHAR(100),
      role VARCHAR(50) NOT NULL CHECK (role IN ('Manager','Directeur','DRH','DAF','DGA','DG')),
      department VARCHAR(100),
      position VARCHAR(100),
      phone VARCHAR(20),
      company VARCHAR(100),
      avatar TEXT,
      status VARCHAR(20) DEFAULT 'active',
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const queryResetTokens = `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Version avec updated_at
  const queryRecruitmentRequests = `
    CREATE TABLE IF NOT EXISTS recruitment_requests (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      contract_type VARCHAR(50),
      reason VARCHAR(100),
      reason_details JSONB,
      budget INTEGER,
      required_skills TEXT[],
      description TEXT,
      urgent BOOLEAN DEFAULT FALSE,
      status VARCHAR(50) DEFAULT 'Open',
      current_validation_level VARCHAR(50),
      created_by VARCHAR(100),
      created_by_name VARCHAR(100),
      created_by_role VARCHAR(100),
      replacement_name VARCHAR(255),
      replacement_reason TEXT,
      start_date DATE,
      level VARCHAR(50),
      experience VARCHAR(50),
      remote_work BOOLEAN DEFAULT FALSE,
      travel_required BOOLEAN DEFAULT FALSE,
      estimated_time VARCHAR(50),
      priority VARCHAR(50),
      validation_flow TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const queryValidationTracking = `
    CREATE TABLE IF NOT EXISTS validation_tracking (
      id SERIAL PRIMARY KEY,
      request_id INT REFERENCES recruitment_requests(id) ON DELETE CASCADE,
      validator_name VARCHAR(100) NOT NULL,
      validator_role VARCHAR(50) NOT NULL,
      validator_id INT REFERENCES users(id),
      action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected', 'pending')),
      comments TEXT,
      validation_level VARCHAR(50) NOT NULL,
      validation_order INT NOT NULL,
      validated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_validation_tracking_request_id ON validation_tracking(request_id);
    CREATE INDEX IF NOT EXISTS idx_validation_tracking_validator_id ON validation_tracking(validator_id);
  `;

  const queryJobOffers = `
    CREATE TABLE IF NOT EXISTS job_offers (
      id SERIAL PRIMARY KEY,
      request_id INT UNIQUE REFERENCES recruitment_requests(id) ON DELETE CASCADE,
      reference VARCHAR(50) UNIQUE,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      contract_type VARCHAR(50),
      description TEXT,
      profile_required TEXT,
      required_skills TEXT[],
      level VARCHAR(50),
      experience VARCHAR(50),
      budget INTEGER,
      remote_work BOOLEAN DEFAULT FALSE,
      travel_required BOOLEAN DEFAULT FALSE,
      start_date DATE,
      salary_range VARCHAR(50),
      experience_level VARCHAR(50),
      benefits TEXT[],
      publication_date DATE DEFAULT CURRENT_DATE,
      application_deadline DATE,
      status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed', 'filled')),
      views_count INTEGER DEFAULT 0,
      applications_count INTEGER DEFAULT 0,
      created_by VARCHAR(100),
      created_by_name VARCHAR(100),
      published_by VARCHAR(100),
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_job_offers_request_id ON job_offers(request_id);
    CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status);
  `;

  // Fonction pour ajouter les colonnes manquantes (SANS apostrophes dans les notices)
  const addMissingColumns = `
    DO $$ 
    BEGIN
      -- Ajouter updated_at à users si elle n'existe pas
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'updated_at ajoute a users';
      END IF;

      -- Ajouter updated_at à recruitment_requests si elle n'existe pas
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recruitment_requests' AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE recruitment_requests ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'updated_at ajoute a recruitment_requests';
      END IF;

      -- Ajouter updated_at à job_offers si elle n'existe pas
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_offers' AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE job_offers ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'updated_at ajoute a job_offers';
      END IF;

      -- Mettre à jour les valeurs NULL
      UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
      UPDATE recruitment_requests SET updated_at = created_at WHERE updated_at IS NULL;
      UPDATE job_offers SET updated_at = created_at WHERE updated_at IS NULL;
      
    END $$;
  `;

  // Trigger function pour mettre à jour updated_at automatiquement
  const createUpdateTriggerFunction = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  // Création sécurisée des triggers (SANS apostrophes)
  const createTriggers = `
    DO $$ 
    BEGIN
      -- Trigger pour users
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Trigger pour recruitment_requests
      DROP TRIGGER IF EXISTS update_recruitment_requests_updated_at ON recruitment_requests;
      CREATE TRIGGER update_recruitment_requests_updated_at
        BEFORE UPDATE ON recruitment_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Trigger pour job_offers
      DROP TRIGGER IF EXISTS update_job_offers_updated_at ON job_offers;
      CREATE TRIGGER update_job_offers_updated_at
        BEFORE UPDATE ON job_offers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      
    END $$;
  `;

  const addValidationFlowColumn = `
    DO $$ 
    BEGIN 
      ALTER TABLE recruitment_requests ADD COLUMN IF NOT EXISTS validation_flow TEXT[];
    END $$;
  `;

  // ===========================================
  // 🔥 TRIGGER POUR COPIER LES DEMANDES VALIDÉES
  // ===========================================
  const createCopyTrigger = `
    -- Fonction qui sera appelée par le trigger
    CREATE OR REPLACE FUNCTION copy_validated_request_to_job_offers()
    RETURNS TRIGGER AS $$
    DECLARE
      new_reference TEXT;
    BEGIN
      -- Vérifier si la demande est validée (status = 'Validées' ET current_validation_level = 'Validé')
      IF NEW.status = 'Validées' AND NEW.current_validation_level = 'Validé' THEN
        
        -- Générer une référence unique pour l'offre
        new_reference := 'OFFRE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || NEW.id;
        
        -- Insérer dans job_offers
        INSERT INTO job_offers (
          request_id,
          reference,
          title,
          department,
          location,
          contract_type,
          description,
          profile_required,
          required_skills,
          level,
          experience,
          budget,
          remote_work,
          travel_required,
          start_date,
          salary_range,
          experience_level,
          created_by,
          created_by_name,
          published_by,
          published_at,
          status,
          publication_date,
          application_deadline,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          new_reference,
          NEW.title,
          NEW.department,
          NEW.location,
          NEW.contract_type,
          NEW.description,
          NEW.description,
          NEW.required_skills,
          NEW.level,
          NEW.experience,
          NEW.budget,
          NEW.remote_work,
          NEW.travel_required,
          NEW.start_date,
          CASE 
            WHEN NEW.budget IS NOT NULL THEN NEW.budget::TEXT || '€'
            ELSE NULL
          END,
          NEW.experience,
          NEW.created_by,
          NEW.created_by_name,
          NEW.current_validation_level,
          NOW(),
          'published',
          NOW(),
          NOW() + INTERVAL '30 days',
          NOW(),
          NOW()
        )
        ON CONFLICT (request_id) DO NOTHING;
        
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Supprimer l'ancien trigger s'il existe
    DROP TRIGGER IF EXISTS trigger_copy_to_job_offers ON recruitment_requests;

    -- Créer le nouveau trigger
    CREATE TRIGGER trigger_copy_to_job_offers
      AFTER INSERT OR UPDATE OF status, current_validation_level ON recruitment_requests
      FOR EACH ROW
      EXECUTE FUNCTION copy_validated_request_to_job_offers();
  `;

  // ===========================================
  // 🔥 CRÉER LES OFFRES POUR LES DEMANDES DÉJÀ VALIDÉES
  // ===========================================
  const createExistingOffers = `
    DO $$
    DECLARE
      req RECORD;
      new_reference TEXT;
      count_created INTEGER := 0;
    BEGIN
      FOR req IN 
        SELECT * FROM recruitment_requests 
        WHERE status = 'Validées' 
          AND current_validation_level = 'Validé'
          AND id NOT IN (SELECT request_id FROM job_offers WHERE request_id IS NOT NULL)
      LOOP
        new_reference := 'OFFRE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || req.id;
        
        INSERT INTO job_offers (
          request_id, reference, title, department, location, contract_type,
          description, profile_required, required_skills, level, experience,
          budget, remote_work, travel_required, start_date, salary_range,
          experience_level, created_by, created_by_name, published_by,
          published_at, status, publication_date, application_deadline, created_at, updated_at
        ) VALUES (
          req.id, new_reference, req.title, req.department, req.location,
          req.contract_type, req.description, req.description, req.required_skills,
          req.level, req.experience, req.budget, req.remote_work, req.travel_required,
          req.start_date,
          CASE 
            WHEN req.budget IS NOT NULL THEN req.budget::TEXT || '€'
            ELSE NULL
          END,
          req.experience, req.created_by, req.created_by_name,
          req.current_validation_level, NOW(), 'published', NOW(),
          NOW() + INTERVAL '30 days', NOW(), NOW()
        );
        
        count_created := count_created + 1;
      END LOOP;
      
      RAISE NOTICE '% offre(s) creee(s) avec succes', count_created;
    END;
    $$;
  `;

  try {
    console.log('🚀 Début de l\'initialisation de la base de données...\n');

    // Exécution des requêtes de création de tables
    await pool.query(queryUsers);
    console.log('✅ Table "users" créée/vérifiée avec succès !');

    await pool.query(queryResetTokens);
    console.log('✅ Table "password_reset_tokens" créée/vérifiée avec succès !');

    await pool.query(queryRecruitmentRequests);
    console.log('✅ Table "recruitment_requests" créée/vérifiée avec succès !');

    await pool.query(queryValidationTracking);
    console.log('✅ Table "validation_tracking" créée/vérifiée avec succès !');

    await pool.query(queryJobOffers);
    console.log('✅ Table "job_offers" créée/vérifiée avec succès !');

    // Ajout des colonnes manquantes
    await pool.query(addMissingColumns);
    console.log('✅ Colonnes updated_at ajoutées/vérifiées avec succès !');

    // Création de la fonction trigger
    await pool.query(createUpdateTriggerFunction);
    console.log('✅ Fonction trigger "update_updated_at_column" créée !');

    // Création des triggers
    await pool.query(createTriggers);
    console.log('✅ Triggers updated_at créés avec succès !');

    // Ajout de la colonne validation_flow
    await pool.query(addValidationFlowColumn);
    console.log('✅ Colonne "validation_flow" ajoutée/vérifiée avec succès !');

    // Création du trigger de copie
    await pool.query(createCopyTrigger);
    console.log('✅ Trigger "copy_validated_request_to_job_offers" créé avec succès !');
    
    // Création des offres existantes
    await pool.query(createExistingOffers);
    console.log('✅ Offres créées pour les demandes déjà validées !');

    // Vérification finale
    const verification = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'updated_at' 
      AND table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n🔍 Vérification des colonnes updated_at :');
    if (verification.rows.length > 0) {
      verification.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}.${row.column_name}`);
      });
    } else {
      console.log('   ⚠️ Aucune colonne updated_at trouvée');
    }

    // Vérification des triggers
    const triggersVerification = await pool.query(`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgname IN (
        'update_users_updated_at',
        'update_recruitment_requests_updated_at',
        'update_job_offers_updated_at',
        'trigger_copy_to_job_offers'
      )
    `);
    
    console.log('\n🔍 Vérification des triggers :');
    triggersVerification.rows.forEach(row => {
      console.log(`   ✅ ${row.tgname}`);
    });

    console.log('\n🎉 TOUTES LES TABLES ET TRIGGERS SONT PRÊTS !');
    console.log('📊 Structure mise à jour avec succès !');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
    console.error('Détails:', err);
  } finally {
    await pool.end();
  }
}

createTables();