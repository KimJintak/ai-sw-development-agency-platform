import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto, RefreshTokenDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    return this.generateTokens(user.id, user.email, user.role)
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwt.verify(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      })
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
      if (!user) throw new UnauthorizedException()
      return this.generateTokens(user.id, user.email, user.role)
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private generateTokens(sub: string, email: string, role: string) {
    const payload = { sub, email, role }
    return {
      accessToken: this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN', '15m') ?? '15m') as any,
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') ?? '7d') as any,
      }),
    }
  }
}
