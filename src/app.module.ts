import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

import { UsersModule } from './modules/users/users.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { SwipesModule } from './modules/swipes/swipes.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { LeasesModule } from './modules/leases/leases.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrustModule } from './modules/trust/trust.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { ServicesModule } from './modules/services/services.module';
import { AIModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PreferencesModule,
    PropertiesModule,
    RecommendationsModule,
    SwipesModule,
    MatchesModule,
    ConversationsModule,
    LeasesModule,
    PaymentsModule,
    TrustModule,
    RatingsModule,
    DisputesModule,
    ServicesModule,
    AIModule,
    NotificationsModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
