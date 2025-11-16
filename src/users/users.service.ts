import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { RegisterInput } from '../auth/dto/register.input';
import { ConfigService } from '@nestjs/config';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private readonly configService: ConfigService,
  ) { }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | undefined> {
    const user = this.usersRepository.findOne({
      where: { id },
      relations: ['roles']
    });

    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['roles']
    });
  }

  // Standard public registration (Defaults to 'user')
  async create(registerInput: RegisterInput): Promise<User> {
    const userRole = await this.rolesRepository.findOne({ where: { name: 'user' } });
    if (!userRole) {
      throw new Error('Default role "user" not found.');
    }

    const newUser = this.usersRepository.create({
      ...registerInput,
      roles: [userRole],
    });

    return this.usersRepository.save(newUser);
  }

  // Admin Create (Custom Roles)
  async createUser(input: CreateUserInput): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already exists');

    if (input.username) {
      const existingUsername = await this.usersRepository.findOne({ where: { username: input.username } });
      if (existingUsername) throw new ConflictException('Username already exists');
    }

    let roles: Role[] = [];
    if (input.roles && input.roles.length > 0) {
      roles = await this.rolesRepository.findBy({ name: In(input.roles) });
      if (roles.length !== input.roles.length) {
        throw new NotFoundException('One or more roles not found');
      }
    } else {
      // Default if none provided
      const defaultRole = await this.rolesRepository.findOne({ where: { name: 'user' } });
      if (defaultRole) roles.push(defaultRole);
    }

    const user = this.usersRepository.create({
      ...input,
      password: input.password, // @BeforeInsert will hash this
      roles: roles,
    });

    return this.usersRepository.save(user);
  }

  async updateUser(input: UpdateUserInput): Promise<User> {
    const user = await this.findById(input.id);

    // Destructure ID and password, handle them separately
    const { id, password, ...updates } = input;

    if (updates.email && updates.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: updates.email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    if (updates.username && updates.username !== user.username) {
      const existing = await this.usersRepository.findOne({ where: { username: updates.username } });
      if (existing) throw new ConflictException('Username already in use');
    }

    // Manual password hash
    if (password) {
      const saltRounds = this.configService.get<string>('PASSWORD_SALT_ROUNDS');
      user.password = await bcrypt.hash(password, parseInt(saltRounds, 10));
      user.passwordChangedAt = new Date(); // Track when password was changed
    }

    // Handle roles relation
    if (updates.roles) {
      const roles = await this.rolesRepository.findBy({ name: In(updates.roles) });
      if (roles.length !== updates.roles.length) {
        throw new NotFoundException('One or more roles not found');
      }
      user.roles = roles;
    }

    // Merge scalar fields
    this.usersRepository.merge(user, updates as DeepPartial<User>);

    // Handle metadata (assuming it's a JSON string from GQL)
    if (updates.metadata) {
      user.metadata = JSON.parse(updates.metadata);
    }

    return this.usersRepository.save(user);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return true;
  }

  async handleSuccessfulLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      isLocked: false,
      lockUntil: null,
    });
  }

  async handleFailedLogin(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // NOTE: Lock after 5 attempts
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
    }
    await this.usersRepository.save(user);
  }
}
