import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../database/entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) { }

  /**
   * Finds all permissions.
   * @returns {Promise<Permission[]>} A list of all permissions.
   */
  findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find();
  }

  /**
   * Finds a specific permission by its name.
   * @param {string} name - The name of the permission.
   * @returns {Promise<Permission>} The found permission.
   * @throws {NotFoundException} If the permission doesn't exist.
   */
  async findByName(name: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOneBy({ name });
    if (!permission) {
      throw new NotFoundException(`Permission "${name}" not found.`);
    }
    return permission;
  }

  /**
   * Creates a new permission.
   * @param {string} name - The name for the new permission.
   * @returns {Promise<Permission>} The newly created permission.
   */
  create(name: string): Promise<Permission> {
    const newPermission = this.permissionsRepository.create({ name });
    return this.permissionsRepository.save(newPermission);
  }
}
