import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Injectable()
export class PresignedUrlService {
  private readonly logger = new Logger(PresignedUrlService.name)
  private readonly secret: string
  private readonly ttlMs: number
  private readonly cdnBase: string

  constructor(private readonly config: ConfigService) {
    this.secret = config.get<string>('PRESIGN_SECRET', 'presign-default-secret')
    this.ttlMs = Number(config.get<string>('PRESIGN_TTL_HOURS', '24')) * 3600 * 1000
    this.cdnBase = config.get<string>('CDN_BASE_URL', 'https://cdn.example.com')
  }

  sign(s3Key: string): { url: string; expiresAt: string } {
    const expiresAt = new Date(Date.now() + this.ttlMs)
    const expiresEpoch = Math.floor(expiresAt.getTime() / 1000)
    const signature = this.computeSignature(s3Key, expiresEpoch)
    const url = `${this.cdnBase}/${s3Key}?expires=${expiresEpoch}&sig=${signature}`
    return { url, expiresAt: expiresAt.toISOString() }
  }

  verify(s3Key: string, expiresEpoch: number, signature: string): boolean {
    if (Date.now() / 1000 > expiresEpoch) return false
    const expected = this.computeSignature(s3Key, expiresEpoch)
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  }

  private computeSignature(s3Key: string, expiresEpoch: number): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(`${s3Key}:${expiresEpoch}`)
      .digest('hex')
  }
}
