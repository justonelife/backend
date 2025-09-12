import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateRoleInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Role name cannot be empty.' })
  @MinLength(3, { message: 'Role name must be at least 3 characters long.' })
  name: string;
}
