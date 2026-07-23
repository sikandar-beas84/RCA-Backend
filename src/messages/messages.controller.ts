import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { MessagesService } from './messages.service';

import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  send(
    @Req() req,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(
      req.user.userId,
      dto.conversationId,
      dto.text,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':conversationId')
  history(
    @Req() req,
    @Param('conversationId', ParseIntPipe)
    conversationId: number,
  ) {
    return this.messagesService.history(
      conversationId,
      req.user.userId,
    );
  }
}