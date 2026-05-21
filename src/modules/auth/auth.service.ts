import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UserRole } from '../../common/constants/domain-enums';
import {
  GoogleProfileLike,
  UsersService,
} from '../users/users.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthResult extends TokenPair {
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    avatarUrl: string | null;
  };
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateGoogleUser(profile: GoogleProfileLike): Promise<User> {
    return this.usersService.findOrCreateFromGoogle(profile);
  }

  async issueTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    const accessSecret =
      this.configService.get<string>('JWT_SECRET') ?? 'change-me';
    const accessExpires =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      `${accessSecret}-refresh`;
    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpires,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpires,
    };
  }

  async buildAuthResult(user: User): Promise<AuthResult> {
    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      `${this.configService.get<string>('JWT_SECRET') ?? 'change-me'}-refresh`;

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User no longer exists');
    }

    return this.issueTokens(user);
  }

  async mockLogin(
    email: string,
    role?: UserRole,
    fullName?: string,
  ): Promise<AuthResult> {
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        fullName: fullName ?? email.split('@')[0],
        role: role ?? UserRole.TENANT,
      });
    }
    return this.buildAuthResult(user);
  }
}
