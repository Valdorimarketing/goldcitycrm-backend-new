import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function updateNullUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // NULL olan user değerlerini 1 yap
    const result = await dataSource.query(
      `UPDATE customer_note SET user = 1 WHERE user IS NULL`
    );
    
    console.log('✅ NULL user değerleri güncellendi:', result);
    
    // Kaç kayıt güncellendi kontrol et
    const countResult = await dataSource.query(
      `SELECT COUNT(*) as count FROM customer_note WHERE user IS NULL`
    );
    
    console.log('Kalan NULL kayıt sayısı:', countResult[0].count);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await app.close();
  }
}

updateNullUsers();