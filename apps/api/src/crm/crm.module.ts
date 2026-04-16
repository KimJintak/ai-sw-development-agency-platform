import { Module, forwardRef } from '@nestjs/common'
import { CustomersService } from './customers/customers.service'
import { CustomersController } from './customers/customers.controller'
import { OpportunitiesService } from './opportunities/opportunities.service'
import { OpportunitiesController } from './opportunities/opportunities.controller'
import { ContractsService } from './contracts/contracts.service'
import { ContractsController } from './contracts/contracts.controller'
import { CrmNotificationsService } from './notifications/crm-notifications.service'
import { CrmNotificationsController } from './notifications/crm-notifications.controller'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [forwardRef(() => ChatModule)],
  providers: [CustomersService, OpportunitiesService, ContractsService, CrmNotificationsService],
  controllers: [CustomersController, OpportunitiesController, ContractsController, CrmNotificationsController],
  exports: [CrmNotificationsService],
})
export class CrmModule {}
