import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/user/services/user.service';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  try {
    // Create a test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const userData = {
      email: 'jwt-test@example.com',
      password: hashedPassword,
      name: 'JWT Test User',
      role: 'admin',
      isActive: true,
    };

    const user = await userService.createUserWithPassword(userData);
    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Error creating test user:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();