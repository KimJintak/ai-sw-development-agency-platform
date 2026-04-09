import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './common/redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { CrmModule } from './crm/crm.module'
import { ProjectsModule } from './projects/projects.module'
import { WorkItemsModule } from './work-items/work-items.module'
import { AgentsModule } from './agents/agents.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    CrmModule,
    ProjectsModule,
    WorkItemsModule,
    AgentsModule,
  ],
})
export class AppModule {}
