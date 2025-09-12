import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@ObjectType()
@Entity()
export class Role extends BaseEntity {
  @Field()
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @Field(() => [Permission], { nullable: 'itemsAndList' })
  @ManyToMany(() => Permission, { eager: true, cascade: true })
  @JoinTable()
  permissions?: Permission[];
}
