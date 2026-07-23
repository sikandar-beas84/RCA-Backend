import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    return this.prisma.user.create({
      data,
    });
  }

  async findAll(currentUserId: number) {
    return this.prisma.user.findMany({
      where: {
        id: {
          not: currentUserId,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async setOnline(userId: number) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isOnline: true,
      },
    });
  }

  async setOffline(userId: number) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });
  }

}