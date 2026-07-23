import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { ChatGateway } from './chat/chat.gateway';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [MessagesModule],
  providers: [SocketGateway, ChatGateway]
})
export class SocketModule {}
