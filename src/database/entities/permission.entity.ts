import { Entity, Column } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';

@ObjectType()
@Entity()
export class Permission extends BaseEntity {
  @Field()
  @Column({ unique: true })
  name: string;
}
