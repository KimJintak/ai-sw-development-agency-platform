import { Module } from '@nestjs/common'
import { CustomersService } from './customers/customers.service'
import { CustomersController } from './customers/customers.controller'
import { OpportunitiesService } from './opportunities/opportunities.service'
import { OpportunitiesController } from './opportunities/opportunities.controller'
import { ContractsService } from './contracts/contracts.service'
import { ContractsController } from './contracts/contracts.controller'

@Module({
  providers: [CustomersService, OpportunitiesService, ContractsService],
  controllers: [CustomersController, OpportunitiesController, ContractsController],
})
export class CrmModule {}
