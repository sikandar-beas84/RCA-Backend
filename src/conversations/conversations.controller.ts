import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ConversationsService } from './conversations.service';

import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.create(
      req.user.userId,
      dto.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  myConversations(@Req() req) {
    return this.conversationsService.myConversations(
      req.user.userId,
    );
  }
}