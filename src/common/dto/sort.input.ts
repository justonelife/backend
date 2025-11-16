import { InputType, Field, registerEnumType } from '@nestjs/graphql';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
registerEnumType(SortOrder, { name: 'SortOrder' });

@InputType()
export class SortInput {
  @Field({ description: 'Field to sort by' })
  field: string;

  @Field(() => SortOrder, { description: 'Sort direction' })
  order: SortOrder = SortOrder.ASC;
}
