import { PrismaClient, UserRole, AgentType, AgentStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const adminHash = await bcrypt.hash('admin1234!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@agency.dev' },
    update: {},
    create: {
      email: 'admin@agency.dev',
      passwordHash: adminHash,
      name: 'Admin',
      role: UserRole.ADMIN,
    },
  })

  // PM user
  const pmHash = await bcrypt.hash('pm1234!', 10)
  await prisma.user.upsert({
    where: { email: 'pm@agency.dev' },
    update: {},
    create: {
      email: 'pm@agency.dev',
      passwordHash: pmHash,
      name: 'Project Manager',
      role: UserRole.PM,
    },
  })

  // Agent cards
  const agentDefs = [
    { type: AgentType.CRM,          name: 'CRM Agent',          endpoint: 'ws://crm-agent:4010/a2a' },
    { type: AgentType.PM,           name: 'PM Agent',           endpoint: 'ws://pm-agent:4011/a2a' },
    { type: AgentType.ARCHITECTURE, name: 'Architecture Agent', endpoint: 'ws://arch-agent:4012/a2a' },
    { type: AgentType.UX,           name: 'UX Agent',           endpoint: 'ws://ux-agent:4013/a2a' },
    { type: AgentType.MAC_DEV,      name: 'Mac Dev Agent',      endpoint: 'ws://mac-agent:4014/a2a' },
    { type: AgentType.WINDOWS_DEV,  name: 'Windows Dev Agent',  endpoint: 'ws://windows-agent:4015/a2a' },
    { type: AgentType.AWS_DEV,      name: 'AWS Dev Agent',      endpoint: 'ws://aws-agent:4016/a2a' },
    { type: AgentType.TEST,         name: 'Test Agent',         endpoint: 'ws://test-agent:4017/a2a' },
    { type: AgentType.DEPLOY,       name: 'Deploy Agent',       endpoint: 'ws://deploy-agent:4018/a2a' },
    { type: AgentType.REPORT,       name: 'Report Agent',       endpoint: 'ws://report-agent:4019/a2a' },
    { type: AgentType.TRIAGE,       name: 'Triage Agent',       endpoint: 'ws://triage-agent:4020/a2a' },
    { type: AgentType.QA,           name: 'QA Agent',           endpoint: 'ws://qa-agent:4021/a2a' },
  ]

  for (const def of agentDefs) {
    await prisma.agentCard.upsert({
      where: { agentType: def.type },
      update: {},
      create: {
        agentType: def.type,
        name: def.name,
        endpoint: def.endpoint,
        skills: [],
        status: AgentStatus.OFFLINE,
      },
    })
  }

  console.log('Seed completed.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
