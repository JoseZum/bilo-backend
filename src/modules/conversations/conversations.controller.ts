import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all conversations for the current user' })
  findForUser(@CurrentUser() user: AuthUser) {
    return this.conversationsService.findForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation by id' })
  findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.conversationsService.findById(id, user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  listMessages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.conversationsService.listMessages(id, user.id, {
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
      cursor,
    });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(id, user.id, dto);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  markRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.conversationsService.markRead(id, user.id);
  }
}
