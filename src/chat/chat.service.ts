import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createConversation(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) {
      throw new ConflictException(
        'You cannot create a conversation with yourself.',
      );
    }

    // Check if conversation already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: currentUserId,
              },
            },
          },
          {
            participants: {
              some: {
                userId: targetUserId,
              },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
    });

    if (
      existing &&
      existing.participants.length === 2
    ) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            {
              userId: currentUserId,
            },
            {
              userId: targetUserId,
            },
          ],
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async getConversations(userId: number) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}