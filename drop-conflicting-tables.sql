-- Drop tables with foreign key constraints first
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS doctor2hospital;
DROP TABLE IF EXISTS doctor2branch;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS branches;

SET FOREIGN_KEY_CHECKS = 1;

-- Show remaining tables to verify cleanup
SHOW TABLES;