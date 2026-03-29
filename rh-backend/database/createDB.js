import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  password: '123456',
  port: 5432,
});

async function createDatabase() {
  try {
    await pool.query('CREATE DATABASE rh_database');
    console.log('Base de données "rh_database" créée !');
  } catch (err) {
    if (err.code === '42P04') { // code erreur si base existe déjà
      console.log('La base "rh_database" existe déjà.');
    } else {
      console.error('Erreur création base :', err.message);
    }
  } finally {
    await pool.end();
  }
}

createDatabase();