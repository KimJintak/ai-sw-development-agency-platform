import { Injectable, Logger } from '@nestjs/common'
import { generateText } from 'ai'
import { LlmService } from '../llm/llm.service'
import { ArtifactType } from '@prisma/client'

export interface GenerateDiagramInput {
  projectName: string
  diagramType: ArtifactType
  context: string
}

export interface GenerateDiagramResult {
  title: string
  mermaidCode: string
}

const DIAGRAM_GUIDANCE: Record<string, string> = {
  ARCHITECTURE: `flowchart TD 형식으로 시스템 컴포넌트 간 관계를 표현하세요.
    subgraph를 활용해 레이어(Frontend/Backend/Database/External)를 구분하세요.`,
  ERD: `erDiagram 형식으로 핵심 엔티티와 관계를 정의하세요.
    ||--o{ (일 대 다), }|--|{ (다 대 다) 등 관계 표기법을 정확히 사용하세요.`,
  SEQUENCE: `sequenceDiagram 형식으로 주요 유스케이스의 메시지 흐름을 표현하세요.
    participant 선언 후 ->> (동기), -->> (응답) 화살표를 사용하세요.`,
  FLOWCHART: `flowchart LR 형식으로 주요 비즈니스 프로세스 흐름을 표현하세요.
    decision(조건 분기)은 菱형 { }으로 표현하세요.`,
}

@Injectable()
export class UxAgentService {
  private readonly logger = new Logger(UxAgentService.name)

  constructor(private readonly llm: LlmService) {
    if (!this.llm.hasAnyKey) {
      this.logger.warn('No LLM key — UX Agent will use dry-run mode')
    }
  }

  async generateDiagram(input: GenerateDiagramInput): Promise<GenerateDiagramResult> {
    if (!this.llm.hasAnyKey) {
      return this.dryRun(input)
    }

    const guidance = DIAGRAM_GUIDANCE[input.diagramType] ?? DIAGRAM_GUIDANCE.FLOWCHART

    const systemPrompt = `You are a UX/Architecture Agent for a software development agency platform.
Given project requirements or context, generate a valid Mermaid diagram.

Rules:
- Output ONLY the raw Mermaid code — no explanation, no markdown fences (no \`\`\`).
- ${guidance}
- The diagram must be syntactically valid Mermaid.
- Write labels in the same language as the input context (Korean or English).`

    const { text } = await generateText({
      model: this.llm.modelFor('default'),
      system: systemPrompt,
      prompt: `Project: ${input.projectName}\nDiagram type: ${input.diagramType}\n\nContext / Requirements:\n${input.context}`,
      maxOutputTokens: 2000,
    })

    const mermaidCode = text.trim()
    const title = `${input.diagramType} — ${input.projectName}`

    return { title, mermaidCode }
  }

  private dryRun(input: GenerateDiagramInput): GenerateDiagramResult {
    const placeholders: Record<string, string> = {
      ARCHITECTURE: `flowchart TD
    subgraph "Frontend"
        UI[Next.js UI]
    end
    subgraph "Backend"
        API[NestJS API]
        DB[(PostgreSQL)]
    end
    UI --> API
    API --> DB`,
      ERD: `erDiagram
    Project ||--o{ WorkItem : contains
    WorkItem ||--o{ TestCase : verifies
    WorkItem }o--o{ Release : included_in`,
      SEQUENCE: `sequenceDiagram
    participant Client
    participant API
    participant Agent
    Client->>API: Request
    API->>Agent: Task
    Agent-->>API: Result
    API-->>Client: Response`,
      FLOWCHART: `flowchart LR
    A[Start] --> B{Check}
    B -- Yes --> C[Process]
    B -- No --> D[Skip]
    C --> E[End]
    D --> E`,
    }

    return {
      title: `[dry-run] ${input.diagramType} — ${input.projectName}`,
      mermaidCode: placeholders[input.diagramType] ?? placeholders.FLOWCHART,
    }
  }
}
