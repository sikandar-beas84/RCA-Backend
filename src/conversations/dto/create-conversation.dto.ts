import { IsInt } from 'class-validator';

export class CreateConversationDto {
  @IsInt()
  userId: number;
}