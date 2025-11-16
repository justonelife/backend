import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { BeforeInsert } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@ObjectType()
@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password?: string; // Made optional to exclude from GQL schema

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  username?: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  avatarUrl?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field()
  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerifyToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifyTokenExpires?: Date;

  @Field(() => [Role], { nullable: 'itemsAndList' })
  @ManyToMany(() => Role, (role) => role.users, { eager: true, cascade: true })
  @JoinTable()
  roles?: Role[];

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt?: Date;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Field()
  @Column({ default: false })
  isLocked: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lockUntil?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  language?: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: string; // GQL will treat as string, TypeORM handles JSONB

  // Audit Fields
  @Column({ type: 'uuid', nullable: true })
  createdBy?: string; // Assuming createdBy/updatedBy are User IDs

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;


  @BeforeInsert()
  async hashPassword() {
    const configService = new ConfigService();
    const saltRounds = configService.get<string>('PASSWORD_SALT_ROUNDS');
    if (this.password) {
      this.password = await bcrypt.hash(this.password, parseInt(saltRounds, 10));
    }
  }
}
