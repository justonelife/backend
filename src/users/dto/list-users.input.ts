import { InputType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { PaginationInput } from '../../common/dto/pagination.input';
import { SortInput } from '../../common/dto/sort.input';
import { UserFilterInput } from './user-filter.input';

@InputType()
export class ListUsersInput {
  @Field(() => PaginationInput, { nullable: true })
  @IsOptional()
  pagination?: PaginationInput = new PaginationInput();

  @Field(() => SortInput, { nullable: true })
  @IsOptional()
  sort?: SortInput;

  @Field(() => UserFilterInput, { nullable: true })
  @IsOptional()
  filter?: UserFilterInput;
}
