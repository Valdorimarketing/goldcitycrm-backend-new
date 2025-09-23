const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndClean() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'valdori_crm',
  });

  try {
    console.log('Checking for doctor-related tables...');
    const [tables] = await connection.execute("SHOW TABLES LIKE '%doctor%'");
    console.log('Found tables:', tables);
    
    console.log('\nChecking foreign key constraints...');
    const [constraints] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        REFERENCED_TABLE_SCHEMA = 'valdori_crm'
        AND (REFERENCED_TABLE_NAME LIKE '%doctor%' OR TABLE_NAME LIKE '%doctor%')
    `);
    
    if (constraints.length > 0) {
      console.log('Found constraints:');
      constraints.forEach(c => {
        console.log(`  - ${c.TABLE_NAME}.${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME} (${c.CONSTRAINT_NAME})`);
      });
      
      console.log('\nDropping constraints...');
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      for (const constraint of constraints) {
        try {
          if (constraint.REFERENCED_TABLE_NAME === 'doctors' || constraint.TABLE_NAME.includes('doctor')) {
            console.log(`Dropping constraint ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
            await connection.execute(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
          }
        } catch (err) {
          console.log(`Could not drop constraint: ${err.message}`);
        }
      }
      
      // Now drop the tables if they exist
      const tablesToDrop = ['doctor2hospital', 'doctor2branch'];
      for (const table of tablesToDrop) {
        try {
          console.log(`Dropping table ${table} if exists...`);
          await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        } catch (err) {
          console.log(`Could not drop table ${table}: ${err.message}`);
        }
      }
      
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    } else {
      console.log('No problematic constraints found.');
    }
    
    console.log('\nDatabase cleanup completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkAndClean();