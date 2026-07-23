import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(
    userId: number,
    conversationId: number,
    text: string,
  ) {
    const participant =
      await this.prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation.',
      );
    }

    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        text,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async history(conversationId: number, userId: number) {
    const participant =
      await this.prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        'Access denied.',
      );
    }

    return this.prisma.message.findMany({
      where: {
        conversationId,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}