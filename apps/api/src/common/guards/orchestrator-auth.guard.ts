import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { timingSafeEqual } from 'node:crypto'

/**
 * Guards the `/internal/*` routes that the Phoenix Orchestrator calls
 * back into via `Authorization: Bearer ${ORCHESTRATOR_SECRET}`. This is
 * a separate auth path from JwtAuthGuard — these endpoints are not
 * exposed to end users.
 */
@Injectable()
export class OrchestratorAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const header = (req.headers['authorization'] as string | undefined) ?? ''
    const expected = this.config.get<string>('ORCHESTRATOR_SECRET') ?? ''

    if (!expected) {
      throw new UnauthorizedException('ORCHESTRATOR_SECRET is not configured')
    }

    const match = /^Bearer\s+(.+)$/i.exec(header)
    if (!match) throw new UnauthorizedException('missing bearer token')

    const provided = match[1]
    if (provided.length !== expected.length) {
      throw new UnauthorizedException('invalid orchestrator token')
    }

    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (!timingSafeEqual(a, b)) {
      throw new UnauthorizedException('invalid orchestrator token')
    }

    return true
  }
}
