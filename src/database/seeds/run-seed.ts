import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import * as bcrypt from 'bcrypt';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
  const permissionRepository = app.get<Repository<Permission>>(getRepositoryToken(Permission));

  console.log('Seeding database...');

  // Clear existing data
  await userRepository.deleteAll();
  await roleRepository.deleteAll();
  await permissionRepository.deleteAll();

  // Create permissions
  const userReadPerm = await permissionRepository.save({ name: 'user:read' });
  const userWritePerm = await permissionRepository.save({ name: 'user:write' });

  // Create roles
  const adminRole = await roleRepository.save({
    name: 'admin',
    permissions: [userReadPerm, userWritePerm],
  });
  const userRole = await roleRepository.save({
    name: 'user',
    permissions: [userReadPerm],
  });

  // Create admin user
  let password = 'SuperSecurePassword123';
  const saltRounds = process.env.PASSWORD_SALT_ROUNDS;
  if (password) {
    password = await bcrypt.hash(password, parseInt(saltRounds, 10));
  }
  await userRepository.save({
    email: 'admin@example.com',
    password: password,
    roles: [adminRole],
    isActive: true,
  });

  console.log('Seeding complete!');
  await app.close();
}

runSeed();
