import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { MessagesService } from 'src/messages/messages.service';
import { SendMessageDto } from '../dto/send-message.dto';


@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = await this.messagesService.sendMessage(
      dto.senderId,
      dto.conversationId,
      dto.text,
    );

    this.server.emit('receive_message', message);

    return message;
  }

  // async sendMessage(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() dto: SendMessageDto,
  // ) {
  //   const message = await this.messagesService.sendMessage(
  //     dto.senderId,
  //     dto.conversationId,
  //     dto.text,
  //   );

  //   this.server.emit('receive_message', message);

  //   return message;
  // }
}