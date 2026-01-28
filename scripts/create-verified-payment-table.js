/**
 * Script to create the verified_payment_info table
 * Run this with: node scripts/create-verified-payment-table.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createTable() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nisapoti_nis',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../database/add_verified_payment_info.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Running migration...');
    
    // Execute SQL
    await connection.query(sql);
    
    console.log('✅ Table verified_payment_info created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Table already exists, skipping...');
    } else {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

createTable();
