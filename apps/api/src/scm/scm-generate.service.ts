import { Injectable, Logger } from '@nestjs/common'
import { generateObject } from 'ai'
import { z } from 'zod'
import { PrismaService } from '../prisma/prisma.service'
import { LlmService } from '../llm/llm.service'
import { GitHubService } from './github.service'

const GenerateSchema = z.object({
  workItems: z.array(z.object({
    type: z.enum(['EPIC', 'STORY', 'TASK']),
    title: z.string(),
    description: z.string().nullable(),
    parentIndex: z.number().nullable(),
  })),
  documents: z.array(z.object({
    title: z.string(),
    category: z.enum(['CLIENT', 'INTERNAL']),
    kind: z.enum(['PRD', 'SRS', 'SPEC', 'CONTRACT', 'REFERENCE', 'API_DOC', 'MANUAL', 'DEPLOY_GUIDE', 'MEETING_NOTE', 'OTHER']),
    body: z.string(),
  })),
  qna: z.array(z.object({
    question: z.string(),
    tags: z.array(z.string()),
  })),
})

export interface GenerateResult {
  workItemsCreated: number
  documentsCreated: number
  qnaCreated: number
  erdCreated: number
}

@Injectable()
export class ScmGenerateService {
  private readonly logger = new Logger(ScmGenerateService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly github: GitHubService,
  ) {}

  async generateErd(projectId: string): Promise<{ mermaidCode: string }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true, githubRepo: true },
    })

    const [readme, fileTree] = await Promise.all([
      project?.githubRepo ? this.github.getReadme(projectId) : null,
      project?.githubRepo ? this.github.getFileTree(projectId) : [],
    ])

    const context = [
      `프로젝트명: ${project?.name}`,
      project?.description ? `설명: ${project.description}` : '',
      fileTree.length ? `\n파일 구조:\n${fileTree.join('\n')}` : '',
      readme ? `\nREADME:\n${readme.slice(0, 2000)}` : '',
    ].filter(Boolean).join('\n')

    const { object } = await generateObject({
      model: this.llm.modelFor('pm'),
      schema: z.object({ mermaidCode: z.string() }),
      prompt: `
다음 프로젝트 정보를 분석하여 DB ERD를 Mermaid erDiagram 문법으로 작성하세요.

${context}

규칙:
- 반드시 "erDiagram" 으로 시작
- 주요 엔티티 5~10개, 각 엔티티에 핵심 컬럼 3~6개 (타입 포함: string/int/datetime/boolean)
- PK 필드는 PK 표시
- 관계선 표시: ||--||, ||--o{, }o--o{ 등
- 한국어 주석 없이 영문 식별자만 사용
- 코드만 반환, 설명 없음
`,
    })
    return { mermaidCode: object.mermaidCode }
  }

  async generateFromRepo(projectId: string, sections: string[]): Promise<GenerateResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true, githubRepo: true },
    })
    if (!project?.githubRepo) throw new Error('githubRepo not configured')

    const [readme, fileTree, repoMeta] = await Promise.all([
      this.github.getReadme(projectId),
      this.github.getFileTree(projectId),
      this.github.getRepo(projectId),
    ])

    const context = [
      `프로젝트명: ${project.name}`,
      project.description ? `설명: ${project.description}` : '',
      `GitHub 저장소: ${project.githubRepo}`,
      repoMeta.language ? `주요 언어: ${repoMeta.language}` : '',
      repoMeta.topics?.length ? `Topics: ${repoMeta.topics.join(', ')}` : '',
      fileTree.length ? `\n루트 파일/폴더:\n${fileTree.join('\n')}` : '',
      readme ? `\nREADME:\n${readme.slice(0, 3000)}` : '',
    ].filter(Boolean).join('\n')

    const wantWorkItems = sections.includes('workItems')
    const wantDocuments = sections.includes('documents')
    const wantQna = sections.includes('qna')
    const wantErd = sections.includes('erd')

    const prompt = `
다음 GitHub 저장소 정보를 분석하여 소프트웨어 프로젝트 관리 데이터를 JSON으로 생성하세요.

${context}

생성 규칙:
${wantWorkItems ? `- workItems: EPIC 3~5개, 각 EPIC 아래 STORY 2~4개. parentIndex는 부모 EPIC의 배열 인덱스(0부터). 타입이 EPIC이면 parentIndex 없음.` : '- workItems: []'}
${wantDocuments ? `- documents: README 내용을 기반으로 문서 2~3개 작성. category는 CLIENT(고객용) 또는 INTERNAL(내부용). kind는 PRD(제품요구문서)/SRS(소프트웨어요구사항)/SPEC(기술스펙)/API_DOC/MANUAL/DEPLOY_GUIDE/MEETING_NOTE/OTHER 중 적합한 것. PRD와 SRS를 우선 생성하고 나머지는 프로젝트 성격에 맞게.` : '- documents: []'}
${wantQna ? `- qna: 이 프로젝트에서 자주 나올법한 기술적 질문 3~5개.` : '- qna: []'}

반드시 한국어로 작성하세요.
`

    const { object } = await generateObject({
      model: this.llm.modelFor('pm'),
      schema: GenerateSchema,
      prompt,
    })

    const result: GenerateResult = { workItemsCreated: 0, documentsCreated: 0, qnaCreated: 0, erdCreated: 0 }

    if (wantWorkItems && object.workItems.length > 0) {
      const createdItems: { id: string; index: number }[] = []
      for (let i = 0; i < object.workItems.length; i++) {
        const item = object.workItems[i]
        const parentId = item.parentIndex !== null
          ? createdItems.find((c) => c.index === item.parentIndex)?.id
          : undefined
        const created = await this.prisma.workItem.create({
          data: {
            projectId,
            type: item.type,
            title: item.title,
            description: item.description,
            parentId,
          },
        })
        createdItems.push({ id: created.id, index: i })
        result.workItemsCreated++
      }
    }

    if (wantDocuments && object.documents.length > 0) {
      for (const doc of object.documents) {
        await this.prisma.projectDocument.create({
          data: {
            projectId,
            title: doc.title,
            category: doc.category,
            kind: doc.kind,
            body: doc.body,
          },
        })
        result.documentsCreated++
      }
    }

    if (wantQna && object.qna.length > 0) {
      for (const q of object.qna) {
        await this.prisma.projectQna.create({
          data: {
            projectId,
            question: q.question,
            tags: q.tags ?? [],
          },
        })
        result.qnaCreated++
      }
    }

    if (wantErd) {
      const { mermaidCode } = await this.generateErd(projectId)
      await this.prisma.designArtifact.create({
        data: {
          projectId,
          type: 'ERD',
          title: 'AI 생성 ERD',
          mermaidCode,
          createdBy: 'system',
        },
      })
      result.erdCreated++
    }

    this.logger.log(`Generated from repo for project ${projectId}: ${JSON.stringify(result)}`)
    return result
  }
}
