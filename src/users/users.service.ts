import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { RegisterInput } from '../auth/dto/register.input';
import { ConfigService } from '@nestjs/config';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import * as bcrypt from 'bcrypt';
import { ListUsersInput } from './dto/list-users.input';
import { UserFilterInput } from './dto/user-filter.input';
import { StringFilterInput, BooleanFilterInput } from './dto/filter-operator.input';

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

  /**
  * Finds all users with pagination, sorting, and filtering.
  * This uses QueryBuilder for dynamic query construction.
  */
  async list(input: ListUsersInput): Promise<[User[], number]> {
    const { pagination, sort, filter } = input;
    const { skip, limit } = pagination;

    // --- Define whitelisted fields for safety ---
    // Prevents sorting/filtering on sensitive fields like 'password'
    const allowedSortFields = [
      'id', 'email', 'username', 'firstName', 'lastName',
      'isActive', 'isLocked', 'createdAt', 'updatedAt',
      'lastLoginAt', 'lastActiveAt'
    ];

    // Alias for our main table
    const qb = this.usersRepository.createQueryBuilder('user');

    // --- 1. APPLY FILTERS ---
    if (filter) {
      this.applyFiltersToQuery(qb, filter);
    }

    // --- 2. APPLY SORTING ---
    if (sort && allowedSortFields.includes(sort.field)) {
      qb.orderBy(`user.${sort.field}`, sort.order);
    } else {
      // Default sort
      qb.orderBy('user.createdAt', 'DESC');
    }

    // --- 3. APPLY PAGINATION ---
    qb.skip(skip).take(limit);

    // Eager load relations
    qb.leftJoinAndSelect('user.roles', 'roles');

    // Get results and total count
    return qb.getManyAndCount();
  }

  /**
     * Helper function to dynamically apply filters to the QueryBuilder
     */
  private applyFiltersToQuery(qb: SelectQueryBuilder<User>, filter: UserFilterInput) {
    // This is where you map your UserFilterInput to database columns
    // We use unique parameter names (e.g., :email_eq) to avoid collisions

    if (filter.email) {
      this.buildWhereClause(qb, 'user.email', filter.email, 'email');
    }
    if (filter.username) {
      this.buildWhereClause(qb, 'user.username', filter.username, 'username');
    }
    if (filter.firstName) {
      this.buildWhereClause(qb, 'user.firstName', filter.firstName, 'firstName');
    }
    if (filter.lastName) {
      this.buildWhereClause(qb, 'user.lastName', filter.lastName, 'lastName');
    }
    if (filter.isActive) {
      this.buildWhereClause(qb, 'user.isActive', filter.isActive, 'isActive');
    }
    if (filter.isLocked) {
      this.buildWhereClause(qb, 'user.isLocked', filter.isLocked, 'isLocked');
    }
  }

  /**
     * Generic helper to build WHERE clauses for different operators
     */
  private buildWhereClause(
    qb: SelectQueryBuilder<User>,
    field: string, // e.g., 'user.email'
    criteria: StringFilterInput | BooleanFilterInput,
    paramName: string, // e.g., 'email'
  ) {
    if (criteria._eq !== undefined) {
      qb.andWhere(`${field} = :${paramName}_eq`, { [`${paramName}_eq`]: criteria._eq });
    }
    if (criteria._neq !== undefined) {
      qb.andWhere(`${field} != :${paramName}_neq`, { [`${paramName}_neq`]: criteria._neq });
    }

    // String-specific operators
    if ('_contains' in criteria && criteria._contains !== undefined) {
      qb.andWhere(`${field} ILIKE :${paramName}_contains`, { [`${paramName}_contains`]: `%${criteria._contains}%` });
    }
    if ('_not_contains' in criteria && criteria._not_contains !== undefined) {
      qb.andWhere(`${field} NOT ILIKE :${paramName}_not_contains`, { [`${paramName}_not_contains`]: `%${criteria._not_contains}%` });
    }
    if ('_startsWith' in criteria && criteria._startsWith !== undefined) {
      qb.andWhere(`${field} ILIKE :${paramName}_startsWith`, { [`${paramName}_startsWith`]: `${criteria._startsWith}%` });
    }
    if ('_endsWith' in criteria && criteria._endsWith !== undefined) {
      qb.andWhere(`${field} ILIKE :${paramName}_endsWith`, { [`${paramName}_endsWith`]: `%${criteria._endsWith}` });
    }
    if ('_isEmpty' in criteria && criteria._isEmpty !== undefined) {
      const condition = criteria._isEmpty ? 'IS NULL OR' : 'IS NOT NULL AND';
      qb.andWhere(`${field} ${condition} ${field} = ''`);
    }
    if ('_isNotEmpty' in criteria && criteria._isNotEmpty !== undefined) {
      const condition = criteria._isNotEmpty ? 'IS NOT NULL AND' : 'IS NULL OR';
      qb.andWhere(`${field} ${condition} ${field} != ''`);
    }
  }
}
