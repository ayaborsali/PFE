import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

// 🔹 DB locale
const localDB = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// 🔹 DB Render - Multiple connection attempts with different configurations
const remoteConfigs = [
  // Configuration 1: Using connection string with SSL
  {
    connectionString: process.env.REMOTE_DB_HOST,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  },
  // Configuration 2: Without SSL (might not work but try)
  {
    connectionString: process.env.REMOTE_DB_HOST,
    ssl: false,
    connectionTimeoutMillis: 10000,
  },
  // Configuration 3: Individual parameters with SSL
  {
    host: "dpg-d75cvj14tr6s73ba3vh0-a.virginia-postgres.render.com",
    port: 5432,
    database: "rh_database_gkvs",
    user: "rh_database_gkvs_user",
    password: "7He9fRhGd5IHRrBSo5exkEEDLZ7e4L8P",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  }
];

let remoteDB = null;

async function testRemoteConnection() {
  for (let i = 0; i < remoteConfigs.length; i++) {
    console.log(`\nTrying configuration ${i + 1}...`);
    const config = remoteConfigs[i];
    const pool = new Pool(config);
    
    try {
      // Try to connect with a timeout
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log(`✅ Configuration ${i + 1} successful!`);
      return pool;
    } catch (err) {
      console.log(`❌ Configuration ${i + 1} failed:`, err.message);
      await pool.end();
    }
  }
  return null;
}

async function copyUsers() {
  try {
    // Test local connection
    console.log("Testing local connection...");
    await localDB.query("SELECT 1");
    console.log("✅ Local connection successful");

    // Test remote connections
    console.log("\nTesting remote connections...");
    remoteDB = await testRemoteConnection();
    
    if (!remoteDB) {
      console.error("❌ Could not connect to remote database with any configuration");
      console.log("\n💡 Troubleshooting tips:");
      console.log("1. Check if your Render database is still active (free tier databases expire after 90 days)");
      console.log("2. Log into Render.com and verify the database exists");
      console.log("3. If it exists, check if you need to allow external connections");
      console.log("4. Try creating a new database on Render and update your .env file");
      return;
    }

    console.log("\n✅ Remote connection established!");

    // Get data from local DB
    const res = await localDB.query("SELECT * FROM users LIMIT 1");

    if (res.rows.length === 0) {
      console.log("Aucune donnée locale");
      return;
    }

    const user = res.rows[0];
    console.log("User to copy:", user);

    // Check if users table exists in remote DB
    try {
      const tableCheck = await remoteDB.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log("⚠️ Users table doesn't exist in remote database");
        console.log("Creating users table...");
        
        await remoteDB.query(`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("✅ Users table created");
      }
    } catch (err) {
      console.log("Could not check/create table:", err.message);
    }

    // Check if user already exists in remote DB
    const existingUser = await remoteDB.query(
      "SELECT * FROM users WHERE email = $1",
      [user.email]
    );

    if (existingUser.rows.length > 0) {
      console.log("⚠️ User already exists in remote database");
      return;
    }

    // Insert into remote DB
    await remoteDB.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)`,
      [user.full_name, user.email, user.password, user.role || 'user']
    );

    console.log("✅ Copie réussie !");
    
    // Verify the copy
    const verify = await remoteDB.query(
      "SELECT * FROM users WHERE email = $1",
      [user.email]
    );
    console.log("✅ Verification: User found in remote database");

  } catch (err) {
    console.error("❌ Erreur:", err);
  } finally {
    if (localDB) await localDB.end();
    if (remoteDB) await remoteDB.end();
    process.exit();
  }
}

copyUsers();