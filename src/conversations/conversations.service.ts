import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'You cannot create a conversation with yourself.',
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingConversation =
      await this.prisma.conversation.findFirst({
        where: {
          participants: {
            every: {
              userId: {
                in: [currentUserId, targetUserId],
              },
            },
          },
        },
        include: {
          participants: true,
        },
      });

    if (existingConversation) {
      return existingConversation;
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

  async myConversations(userId: number) {
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
              isOnline: true,
              lastSeen: true,
            },
          },
        },
      },

      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}
}