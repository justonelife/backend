import { Resolver, Query, Args, ID, Mutation, } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from '../database/entities/user.entity';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { ListUsersInput } from './dto/list-users.input';
import { PaginatedUsersOutput } from './dto/paginated-users.output';

@Resolver(() => User)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles('admin')
export class UsersResolver {
  constructor(private usersService: UsersService) { }

  @Query(() => PaginatedUsersOutput, { name: 'listUsers' })
  async listUsers(
    @Args('input') input: ListUsersInput,
  ): Promise<PaginatedUsersOutput> {
    const { pagination } = input;
    const [users, totalCount] = await this.usersService.list(input);

    const totalPages = Math.ceil(totalCount / pagination.limit);

    return {
      edges: users.map(user => ({ node: user })),
      totalCount,
      totalPages,
      currentPage: pagination.page,
      hasNextPage: pagination.page < totalPages,
    };
  }

  @Query(() => [User], { name: 'users' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput): Promise<User> {
    return this.usersService.createUser(createUserInput);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput): Promise<User> {
    return this.usersService.updateUser(updateUserInput);
  }

  @Mutation(() => Boolean)
  deleteUser(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.usersService.deleteUser(id);
  }

}
