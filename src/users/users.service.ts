import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
      throw new Error('Default role "user" not found. Please seed the database.');
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
      email: input.email,
      password: input.password, // @BeforeInsert will hash this
      isActive: true,
      roles: roles,
    });

    return this.usersRepository.save(user);
  }

  async updateUser(input: UpdateUserInput): Promise<User> {
    const user = await this.findById(input.id);

    if (input.email && input.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: input.email } });
      if (existing) throw new ConflictException('Email already in use');
      user.email = input.email;
    }

    if (input.password) {
      const saltRounds = this.configService.get<string>('PASSWORD_SALT_ROUNDS');
      user.password = await bcrypt.hash(input.password, parseInt(saltRounds, 10));
    }

    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
    }

    if (input.roles) {
      const roles = await this.rolesRepository.findBy({ name: In(input.roles) });
      if (roles.length !== input.roles.length) {
        throw new NotFoundException('One or more roles not found');
      }
      user.roles = roles;
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
}
