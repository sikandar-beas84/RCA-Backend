import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  conversationId: number;

  @IsNotEmpty()
  text: string;
}