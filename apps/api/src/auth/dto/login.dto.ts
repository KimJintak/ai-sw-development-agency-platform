import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'admin@agency.dev' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'admin1234!' })
  @IsString()
  @MinLength(6)
  password: string
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string
}
