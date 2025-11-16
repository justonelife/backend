import { Type } from '@nestjs/common';
import { ObjectType, Field, Int } from '@nestjs/graphql';

// This is a generic factory function that returns a paginated type
export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType(`${classRef.name}Edge`, { isAbstract: true })
  abstract class EdgeType {
    @Field(() => classRef)
    node: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [EdgeType], { description: 'The list of items' })
    edges: EdgeType[];

    @Field(() => Int, { description: 'Total number of items' })
    totalCount: number;

    @Field(() => Int, { description: 'Total number of pages' })
    totalPages: number;

    @Field(() => Int, { description: 'Current page number' })
    currentPage: number;

    @Field(() => Boolean, { description: 'Indicates if there is a next page' })
    hasNextPage: boolean;
  }
  return PaginatedType;
}
