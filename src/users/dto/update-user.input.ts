import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  lockUntil?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  timezone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  language?: string;

  @Field({ nullable: true })
  @IsString() // Assuming metadata is passed as a JSON string
  @IsOptional()
  metadata?: string;
}
