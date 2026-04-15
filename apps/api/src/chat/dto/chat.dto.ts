import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { ChatMessageKind } from '@prisma/client'

export class CreateChatMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string

  @ApiProperty({ enum: ChatMessageKind, required: false, default: ChatMessageKind.TEXT })
  @IsEnum(ChatMessageKind)
  @IsOptional()
  kind?: ChatMessageKind

  @ApiProperty({ required: false, type: Object, additionalProperties: true })
  @IsOptional()
  metadata?: Record<string, unknown>
}

export class MarkReadDto {
  @ApiProperty({ required: false, description: 'ISO timestamp; defaults to now' })
  @IsString()
  @IsOptional()
  lastReadAt?: string
}
