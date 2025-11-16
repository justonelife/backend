import { InputType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { StringFilterInput, BooleanFilterInput } from './filter-operator.input';

@InputType()
export class UserFilterInput {
  @Field(() => StringFilterInput, { nullable: true })
  @IsOptional()
  email?: StringFilterInput;

  @Field(() => StringFilterInput, { nullable: true })
  @IsOptional()
  username?: StringFilterInput;

  @Field(() => StringFilterInput, { nullable: true })
  @IsOptional()
  firstName?: StringFilterInput;

  @Field(() => StringFilterInput, { nullable: true })
  @IsOptional()
  lastName?: StringFilterInput;

  @Field(() => BooleanFilterInput, { nullable: true })
  @IsOptional()
  isActive?: BooleanFilterInput;

  @Field(() => BooleanFilterInput, { nullable: true })
  @IsOptional()
  isLocked?: BooleanFilterInput;
}
