import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post('conversation')
  createConversation(
    @Req() req,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(
      req.user.userId,
      dto.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  getConversations(@Req() req) {
    return this.chatService.getConversations(req.user.userId);
  }
}