import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.dto';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) { }

  async register(registerInput: RegisterInput): Promise<User> {
    const existingUser = await this.usersService.findByEmail(registerInput.email);
    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }
    return this.usersService.create(registerInput);
  }

  async login(loginInput: LoginInput): Promise<AuthPayload> {
    const user = await this.usersService.findByEmail(loginInput.email);
    if (!user || !(await bcrypt.compare(loginInput.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    return this.generateTokens(user);
  }

  async refreshToken(token: string): Promise<AuthPayload> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    // Token Rotation
    await this.revokeRefreshToken(refreshToken);
    return this.generateTokens(refreshToken.user);
  }

  async getMe(userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }

  private async generateTokens(user: User): Promise<AuthPayload> {
    const accessToken = this.jwtService.sign({ sub: user.id });
    const refreshToken = await this.createRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private async createRefreshToken(user: User): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day validity

    const refreshToken = this.refreshTokenRepository.create({
      user,
      tokenHash,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  private async revokeRefreshToken(token: RefreshToken): Promise<void> {
    token.isRevoked = true;
    await this.refreshTokenRepository.save(token);
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<boolean> {
    await this.refreshTokenRepository.update({ user: { id: userId } }, { isRevoked: true });
    return true;
  }

  async validateUser(payload: { sub: string }): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
