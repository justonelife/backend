import { Resolver, Query, } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from '../database/entities/user.entity';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) { }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  listUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
