import { IsEmail, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  companyName: string

  @ApiProperty()
  @IsString()
  contactName: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
