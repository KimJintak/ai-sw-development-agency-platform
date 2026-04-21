import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

/**
 * AES-256-GCM envelope encryption for project credentials.
 * Master key is derived from CREDENTIALS_KEY (or JWT_SECRET fallback)
 * via SHA-256 so operators can rotate by changing the env var and
 * re-encrypting all rows.
 */
@Injectable()
export class CredentialCryptoService {
  private readonly key: Buffer

  constructor(private readonly config: ConfigService) {
    const raw =
      config.get<string>('CREDENTIALS_KEY') ??
      config.get<string>('JWT_SECRET') ??
      'development-credentials-fallback-key'
    this.key = crypto.createHash('sha256').update(raw).digest()
  }

  encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv)
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return {
      ciphertext: enc.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    }
  }

  decrypt(ciphertext: string, iv: string, tag: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(iv, 'base64'),
      )
      decipher.setAuthTag(Buffer.from(tag, 'base64'))
      const dec = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final(),
      ])
      return dec.toString('utf8')
    } catch {
      throw new InternalServerErrorException('credential decryption failed')
    }
  }
}
