-- Customer-note tablosundaki NULL user değerlerini güncelle
UPDATE customer_note 
SET user = 1 
WHERE user IS NULL;

-- user alanını NOT NULL yap
ALTER TABLE customer_note 
MODIFY COLUMN user INT NOT NULL;