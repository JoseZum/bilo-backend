import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UserRole } from '../../common/constants/domain-enums';
import { serializeJson } from '../../common/utils/db-json';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface GoogleProfileLike {
  id?: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  displayName?: string;
  name?: { givenName?: string; familyName?: string };
  photos?: Array<{ value: string }>;
  [key: string]: any;
}

export interface CreateUserInput {
  email: string;
  googleId?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdWithPreferences(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { preferences: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        googleId: input.googleId ?? null,
        fullName: input.fullName,
        avatarUrl: input.avatarUrl ?? null,
        role: input.role ?? UserRole.TENANT,
      },
    });
  }

  async findOrCreateFromGoogle(profile: GoogleProfileLike): Promise<User> {
    const googleId =
      (profile && (profile.id as string)) ||
      (profile && (profile as any).sub) ||
      undefined;
    const email =
      profile?.emails?.[0]?.value ||
      (profile as any)?.email ||
      undefined;

    if (!email) {
      throw new BadRequestException('Google profile is missing email');
    }

    const fullName =
      profile?.displayName ||
      [profile?.name?.givenName, profile?.name?.familyName]
        .filter(Boolean)
        .join(' ') ||
      email.split('@')[0];

    const avatarUrl = profile?.photos?.[0]?.value ?? null;

    if (googleId) {
      const byGoogleId = await this.findByGoogleId(googleId);
      if (byGoogleId) return byGoogleId;
    }

    const byEmail = await this.findByEmail(email);
    if (byEmail) {
      if (googleId && !byEmail.googleId) {
        return this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId,
            avatarUrl: byEmail.avatarUrl ?? avatarUrl,
          },
        });
      }
      return byEmail;
    }

    return this.create({
      email,
      googleId: googleId ?? null,
      fullName,
      avatarUrl,
      role: UserRole.TENANT,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const existing = await this.findById(userId);
    if (!existing) throw new NotFoundException('User not found');

    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.metadata !== undefined) {
      data.metadata = serializeJson(dto.metadata);
    }

    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async changeRole(userId: string, newRole: UserRole): Promise<User> {
    if (newRole === UserRole.ADMIN) {
      throw new BadRequestException(
        'ADMIN role cannot be assigned through this endpoint',
      );
    }
    const existing = await this.findById(userId);
    if (!existing) throw new NotFoundException('User not found');

    if (existing.role === UserRole.ADMIN) {
      throw new BadRequestException('Admins cannot change role via this endpoint');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  }

  async getTrustScore(
    userId: string,
  ): Promise<{ userId: string; trustScore: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, trustScore: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { userId: user.id, trustScore: user.trustScore };
  }

  async getVerifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationStatus: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      userId: user.id,
      verificationStatus: user.verificationStatus,
      events: [],
    };
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        verificationStatus: true,
        trustScore: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
