import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto'

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { opportunities: true, projects: { select: { id: true, name: true, status: true } } },
    })
    if (!customer) throw new NotFoundException(`Customer ${id} not found`)
    return customer
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto })
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id)
    return this.prisma.customer.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.customer.delete({ where: { id } })
  }
}
