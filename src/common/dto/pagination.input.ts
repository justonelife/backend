import { InputType, Field, Int } from '@nestjs/graphql';
import { Min, Max } from 'class-validator';

@InputType()
export class PaginationInput {
  @Field(() => Int, { description: 'Page number to retrieve' })
  @Min(1)
  page: number = 1;

  @Field(() => Int, { description: 'Number of items per page' })
  @Min(1)
  @Max(100)
  limit: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
