import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { MessagesService } from 'src/messages/messages.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { UsersService } from 'src/users/users.service';


@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

    // userId -> socketId
  private onlineUsers = new Map<number, string>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

    // ==========================
  // User Connected
  // ==========================

  async handleConnection(client: Socket) {
    console.log('Socket Connected:', client.id);
  }

  // ==========================
  // User Disconnected
  // ==========================

  async handleDisconnect(client: Socket) {
    const userId = [...this.onlineUsers.entries()]
      .find(([_, socketId]) => socketId === client.id)?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);

      await this.usersService.setOffline(userId);

      this.server.emit("user_status", {
        userId,
        online: false,
      });

      console.log("OFFLINE:", userId);
    }
  }

  // ==========================
  // Send Message
  // ==========================

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

  @SubscribeMessage("user_connected")
  async userConnected(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    this.onlineUsers.set(data.userId, client.id);

    await this.usersService.setOnline(data.userId);

    this.server.emit("user_status", {
      userId: data.userId,
      online: true,
    });

    console.log("ONLINE:", data.userId);
  }

}