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
    // Save message as SENT
    let message = await this.messagesService.sendMessage(
      dto.senderId,
      dto.conversationId,
      dto.text,
    );

    // Find the receiver
    const conversation =
      await this.messagesService.getConversationParticipants(
        dto.conversationId,
      );

    const receiver = conversation.find(
      (p) => p.userId !== dto.senderId,
    );

    // If receiver is online -> mark DELIVERED
    if (
      receiver &&
      this.onlineUsers.has(receiver.userId)
    ) {
      message =
        await this.messagesService.markAsDelivered(
          message.id,
        );

      console.log(
        'DELIVERED:',
        message.id,
      );
    }

    // Send message to everyone
    this.server.emit(
      'receive_message',
      message,
    );

    // Notify sender about new status
    this.server.emit(
      'message_status_updated',
      message,
    );

    return message;
  }


  
    @SubscribeMessage('message_seen')
    async messageSeen(
      @MessageBody()
      data: {
        messageId: number;
      },
    ) {
      const message =
        await this.messagesService.markAsSeen(
          data.messageId,
        );

      this.server.emit(
        'message_status_updated',
        message,
      );
    }

  // ==========================
  // Typing
  // ==========================

  @SubscribeMessage('typing')
  typing(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: number;
      userId: number;
      userName: string;
    },
  ) {
    console.log('TYPING:', data);
    client.broadcast.emit('typing', data);
  }

  // ==========================
  // Stop Typing
  // ==========================

  @SubscribeMessage('stop_typing')
  stopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: number;
      userId: number;
    },
  ) {
    console.log('STOP_TYPING:', data);
    client.broadcast.emit('stop_typing', data);
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

    // Mark all pending messages as DELIVERED
    const updatedMessages =
      await this.messagesService.markPendingMessagesAsDelivered(
        data.userId,
      );

    // Notify sender(s)
    updatedMessages.forEach((message) => {
      this.server.emit("message_status_updated", message);

      console.log(
        "AUTO DELIVERED:",
        message.id,
      );
    });
  }

}