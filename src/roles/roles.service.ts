import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../database/entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) { }

  /**
   * Finds all roles in the database.
   * @returns {Promise<Role[]>} A list of all roles.
   */
  findAll(): Promise<Role[]> {
    return this.rolesRepository.find({ relations: ['permissions'] });
  }

  /**
   * Finds a specific role by its name.
   * @param {string} name - The name of the role to find.
   * @returns {Promise<Role>} The found role.
   * @throws {NotFoundException} If the role with the given name doesn't exist.
   */
  async findByName(name: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(`Role with name "${name}" not found.`);
    }
    return role;
  }

  /**
   * Creates a new role.
   * @param {string} name - The name for the new role.
   * @returns {Promise<Role>} The newly created role.
   */
  create(name: string): Promise<Role> {
    const newRole = this.rolesRepository.create({ name });
    return this.rolesRepository.save(newRole);
  }
}
