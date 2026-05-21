import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { AuthService } from './auth.service';
import { MockLoginDto } from './dto/mock-login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start Google OAuth flow' })
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  googleAuth(): void {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('redirect') redirect?: string,
  ) {
    const profile = req.user as any;
    const user = await this.authService.validateGoogleUser(profile);
    const result = await this.authService.buildAuthResult(user);

    const frontendUrl =
      redirect ||
      this.configService.get<string>('FRONTEND_URL') ||
      '';

    if (frontendUrl) {
      const sep = frontendUrl.includes('?') ? '&' : '?';
      const url =
        `${frontendUrl}${sep}accessToken=${encodeURIComponent(result.accessToken)}` +
        `&refreshToken=${encodeURIComponent(result.refreshToken)}`;
      return res.redirect(url);
    }

    return res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @Post('mock-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demo-only mock login (no Google required). Creates user if missing.',
  })
  mockLogin(@Body() dto: MockLoginDto) {
    return this.authService.mockLogin(dto.email, dto.role, dto.fullName);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user (from token)' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
