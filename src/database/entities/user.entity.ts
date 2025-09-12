import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { BeforeInsert } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password?: string; // Made optional to exclude from GQL schema

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => [Role], { nullable: 'itemsAndList' })
  @ManyToMany(() => Role, (role) => role.users, { eager: true, cascade: true })
  @JoinTable()
  roles?: Role[];

  @BeforeInsert()
  async hashPassword() {
    const configService = new ConfigService();
    const saltRounds = configService.get<number>('PASSWORD_SALT_ROUNDS');
    if (this.password) {
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }
}
