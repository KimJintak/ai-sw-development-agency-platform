import { Module } from '@nestjs/common'
import { ProjectCredentialsController } from './project-credentials.controller'
import { ProjectCredentialsService } from './project-credentials.service'
import { CredentialCryptoService } from './crypto.service'
import { AdminModule } from '../admin/admin.module'

@Module({
  imports: [AdminModule],
  controllers: [ProjectCredentialsController],
  providers: [ProjectCredentialsService, CredentialCryptoService],
  exports: [ProjectCredentialsService],
})
export class ProjectCredentialsModule {}
