const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: '192.250.229.162',
    port: 3306,
    user: 'nisapoti_nis',
    password: 'Alvin@2025',
    database: 'nisapoti_nis'
  });

  try {
    console.log('Connected to database...');
    
    // Check if wishlist_uuid column exists in pending_payments
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'pending_payments' 
      AND TABLE_SCHEMA = 'nisapoti_nis' 
      AND COLUMN_NAME = 'wishlist_uuid'
    `);
    
    if (columns.length === 0) {
      console.log('Adding wishlist_uuid column to pending_payments table...');
      await connection.execute(`
        ALTER TABLE pending_payments 
        ADD COLUMN wishlist_uuid VARCHAR(255) NULL
      `);
      console.log('✅ Successfully added wishlist_uuid column to pending_payments');
    } else {
      console.log('✅ wishlist_uuid column already exists in pending_payments');
    }
    
    // Verify the column was added
    const [result] = await connection.execute('DESCRIBE pending_payments');
    console.log('\nCurrent pending_payments table structure:');
    result.forEach(row => {
      console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();
