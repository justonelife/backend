import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GraphQLError } from 'graphql';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  /**
   * Overrides the base getRequestResponse method to extract the request
   * and response objects from the GraphQL execution context.
   *
   * @param {ExecutionContext} context - The execution context.
   * @returns {{ req: any; res: any }} The request and response objects.
   */
  protected getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }

  /**
   * Overrides the base handleRequest method to throw a GraphQL-friendly error
   * when the rate limit is exceeded.
   *
   * @param {ExecutionContext} context - The execution context.
   * @param {number} limit - The maximum number of requests allowed.
   * @param {number} ttl - The time-to-live for the rate limit window in milliseconds.
   * @returns {Promise<boolean>} A promise that resolves to true if the request is allowed.
   * @throws {GraphQLError} If the rate limit is exceeded.
   */
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const { req } = this.getRequestResponse(context);
    const ip = req.ip;

    const key = this.generateKey(context, ip, this.constructor.name);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new GraphQLError('Too Many Requests', {
        extensions: {
          code: 'THROTTLE_LIMIT_EXCEEDED',
        },
      });
    }

    return true;
  }
}
