import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

@InputType()
export class StringFilterInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  _eq?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  _neq?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  _contains?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  _not_contains?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  _startsWith?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  _endsWith?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  _isEmpty?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  _isNotEmpty?: boolean;
}

@InputType()
export class BooleanFilterInput {
  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  _eq?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  _neq?: boolean;
}
