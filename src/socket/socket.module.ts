import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { ChatGateway } from './chat/chat.gateway';
import { MessagesModule } from 'src/messages/messages.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [MessagesModule, UsersModule],
  providers: [SocketGateway, ChatGateway]
})
export class SocketModule {}
