import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { RegisterInput } from '../auth/dto/register.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) { }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

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
}
