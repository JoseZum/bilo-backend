import { Injectable, Module } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Injectable()
class MatchAcceptedListener {
  constructor(private readonly conversationsService: ConversationsService) {}

  @OnEvent('match.accepted', { async: true })
  async handleMatchAccepted(payload: { matchId: string }) {
    if (!payload?.matchId) return;
    await this.conversationsService.createForMatch(payload.matchId);
  }
}

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, MatchAcceptedListener],
  exports: [ConversationsService],
})
export class ConversationsModule {}
