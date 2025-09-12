import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const gql = '/graphql';
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };
  let accessToken: string;
  let refreshToken: string;

  it('should register a new user', () => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query: `
          mutation($email: String!, $password: String!) {
            register(registerInput: { email: $email, password: $password }) {
              id
              email
            }
          }
        `,
        variables: {
          email: testUser.email,
          password: testUser.password
        }
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.register).toBeDefined();
        expect(res.body.data.register.email).toEqual(testUser.email);
      });
  });

  it('should log in the user and return tokens', () => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query: `
          mutation($email: String!, $password: String!) {
            login(loginInput: { email: $email, password: $password }) {
              accessToken
              refreshToken
              user { id email }
            }
          }
        `,
        variables: testUser
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.login).toBeDefined();
        expect(res.body.data.login.accessToken).toBeDefined();
        expect(res.body.data.login.refreshToken).toBeDefined();
        accessToken = res.body.data.login.accessToken;
        refreshToken = res.body.data.login.refreshToken;
      });
  });

  it('should get the current user with the access token', () => {
    return request(app.getHttpServer())
      .post(gql)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `
            query {
                me {
                    id
                    email
                }
            }
          `
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.me.email).toEqual(testUser.email);
      })
  });
});
