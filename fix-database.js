const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'valdori_crm',
  });

  try {
    console.log('Starting database fix...\n');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop the old doctor table that has wrong foreign key
    console.log('Dropping old doctor table...');
    await connection.execute('DROP TABLE IF EXISTS doctor');
    console.log('✓ Doctor table dropped');
    
    // Drop any doctor2* tables
    console.log('Dropping doctor2hospital table...');
    await connection.execute('DROP TABLE IF EXISTS doctor2hospital');
    console.log('✓ Doctor2hospital table dropped');
    
    console.log('Dropping doctor2branch table...');
    await connection.execute('DROP TABLE IF EXISTS doctor2branch');
    console.log('✓ Doctor2branch table dropped');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n✓ Database cleaned successfully!');
    console.log('The application should now be able to create the tables properly.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixDatabase();