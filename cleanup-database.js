const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'valdori_crm',
  });

  try {
    console.log('Disabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = ['doctor2hospital', 'doctor2branch', 'doctors', 'hospitals', 'branches'];
    
    for (const table of tables) {
      try {
        console.log(`Dropping table ${table}...`);
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✓ Table ${table} dropped`);
      } catch (error) {
        console.log(`× Could not drop ${table}: ${error.message}`);
      }
    }
    
    console.log('Re-enabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\nRemaining tables:');
    const [tables_result] = await connection.execute('SHOW TABLES');
    tables_result.forEach(row => {
      console.log(`  - ${Object.values(row)[0]}`);
    });
    
    console.log('\n✓ Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await connection.end();
  }
}

cleanupDatabase();