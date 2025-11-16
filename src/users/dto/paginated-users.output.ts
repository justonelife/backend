import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/paginated.output';
import { User } from '../../database/entities/user.entity';

@ObjectType()
export class PaginatedUsersOutput extends Paginated(User) { }
