import { pool } from '../config/db.js';

async function createTables() {
  const queryUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name VARCHAR(100),
      role VARCHAR(50) NOT NULL CHECK (role IN ('Manager','DRH','DAF','DGA','DG')),
      department VARCHAR(100),
      position VARCHAR(100),
      phone VARCHAR(20),
      company VARCHAR(100),
      avatar TEXT,
      status VARCHAR(20) DEFAULT 'active',
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Nouvelle table pour le suivi des validations
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

  // Nouvelle table pour les offres d'emploi validées
  const queryJobOffers = `
    CREATE TABLE IF NOT EXISTS job_offers (
      id SERIAL PRIMARY KEY,
      request_id INT UNIQUE REFERENCES recruitment_requests(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      contract_type VARCHAR(50),
      description TEXT,
      required_skills TEXT[],
      level VARCHAR(50),
      experience VARCHAR(50),
      budget INTEGER,
      remote_work BOOLEAN DEFAULT FALSE,
      travel_required BOOLEAN DEFAULT FALSE,
      start_date DATE,
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

  // Ajout de la colonne validation_flow si elle n'existe pas déjà
  const addValidationFlowColumn = `
    DO $$ 
    BEGIN 
      BEGIN
        ALTER TABLE recruitment_requests ADD COLUMN validation_flow TEXT[];
      EXCEPTION
        WHEN duplicate_column THEN 
          RAISE NOTICE 'Column validation_flow already exists in recruitment_requests.';
      END;
    END $$;
  `;

  try {
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

    await pool.query(addValidationFlowColumn);
    console.log('✅ Colonne "validation_flow" ajoutée/vérifiée avec succès !');

    console.log('\n🎉 Toutes les tables sont prêtes !');
    console.log('📊 Nouvelles tables créées :');
    console.log('   - validation_tracking : Suivi des validations');
    console.log('   - job_offers : Offres d\'emploi validées');

  } catch (err) {
    console.error('❌ Erreur création table :', err.message);
  } finally {
    await pool.end();
  }
}

createTables();