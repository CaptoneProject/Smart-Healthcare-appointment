const { Pool } = require('pg');
require('dotenv').config();

let pool;

// Try to connect to the cloud database first
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  // Test the cloud connection
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      console.error('Failed to connect to cloud database:', err);
      connectToLocalDB();
    } else {
      console.log('Connected to cloud database successfully!');
    }
  });
} catch (error) {
  console.error('Error creating cloud database pool:', error);
  connectToLocalDB();
}

// Function to connect to local database if cloud connection fails
function connectToLocalDB() {
  console.log('Attempting to connect to local database...');
  
  try {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });
    
    // Test the local connection
    pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.error('Failed to connect to local database:', err);
      } else {
        console.log('Connected to local database successfully!');
      }
    });
  } catch (error) {
    console.error('Error creating local database pool:', error);
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};