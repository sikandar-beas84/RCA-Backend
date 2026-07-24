import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { MessageStatus } from '@prisma/client';

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

  const message = await this.prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text,
      status: MessageStatus.SENT,
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

  return message;
}

async getConversationParticipants(
  conversationId: number,
) {
  return this.prisma.conversationParticipant.findMany({
    where: {
      conversationId,
    },

    select: {
      userId: true,
    },
  });
}
async markAsDelivered(messageId: number) {
  return this.prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      status: MessageStatus.DELIVERED,
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

async markAsSeen(messageId: number) {
  return this.prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      status: MessageStatus.SEEN,
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

async markPendingMessagesAsDelivered(userId: number) {
  const pendingMessages = await this.prisma.message.findMany({
    where: {
      status: MessageStatus.SENT,

      conversation: {
        participants: {
          some: {
            userId,
          },
        },
      },

      NOT: {
        senderId: userId,
      },
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

  const updatedMessages: Array<any> = [];

  for (const message of pendingMessages) {
    const updated = await this.prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        status: MessageStatus.DELIVERED,
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

    updatedMessages.push(updated);
  }

  return updatedMessages;
}

  async history(conversationId: number, userId: number) {

    const participant =
      await this.prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });
      console.log("Participant:", participant);
    if (!participant) {
      console.log("❌ ACCESS DENIED");
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