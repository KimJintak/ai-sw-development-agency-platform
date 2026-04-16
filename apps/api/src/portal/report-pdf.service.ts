import { Injectable } from '@nestjs/common'
import PDFDocument from 'pdfkit'

export interface ReportData {
  project: { id: string; name: string; status: string; platforms: string[] }
  summary: {
    progress: number
    totalWorkItems: number
    completedWorkItems: number
    totalRequirements: number
    approvedRequirements: number
    totalReleases: number
    deployedReleases: number
    totalBuilds: number
  }
  requirements: { id: string; title: string; status: string; version: number }[]
  releases: { id: string; version: string; status: string; deployedAt: string | null; buildCount: number }[]
  testRuns: { id: string; status: string; createdAt: string }[]
  generatedAt: string
}

@Injectable()
export class ReportPdfService {
  generate(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      this.header(doc, data)
      this.summarySection(doc, data)
      this.requirementsSection(doc, data)
      this.releasesSection(doc, data)
      this.testSection(doc, data)
      this.footer(doc, data)

      doc.end()
    })
  }

  private header(doc: PDFKit.PDFDocument, data: ReportData) {
    doc
      .fontSize(22)
      .text('Delivery Report', { align: 'center' })
      .moveDown(0.5)

    doc
      .fontSize(16)
      .fillColor('#333')
      .text(data.project.name, { align: 'center' })
      .moveDown(0.3)

    doc
      .fontSize(10)
      .fillColor('#666')
      .text(
        `Platforms: ${data.project.platforms.join(', ')} | Status: ${data.project.status} | Generated: ${new Date(data.generatedAt).toLocaleString('ko-KR')}`,
        { align: 'center' },
      )
      .moveDown(1.5)
  }

  private summarySection(doc: PDFKit.PDFDocument, data: ReportData) {
    doc.fontSize(14).fillColor('#000').text('1. Project Summary').moveDown(0.5)

    const s = data.summary
    const rows = [
      ['Progress', `${s.progress}%`],
      ['Work Items', `${s.completedWorkItems} / ${s.totalWorkItems} completed`],
      ['Requirements', `${s.approvedRequirements} / ${s.totalRequirements} approved`],
      ['Releases', `${s.deployedReleases} / ${s.totalReleases} deployed`],
      ['Builds', `${s.totalBuilds} total`],
    ]

    doc.fontSize(10).fillColor('#333')
    for (const [label, value] of rows) {
      doc.text(`  ${label}: ${value}`)
    }
    doc.moveDown(1)
  }

  private requirementsSection(doc: PDFKit.PDFDocument, data: ReportData) {
    doc.fontSize(14).fillColor('#000').text('2. Requirements').moveDown(0.5)

    if (data.requirements.length === 0) {
      doc.fontSize(10).fillColor('#666').text('  No requirements.').moveDown(1)
      return
    }

    doc.fontSize(9).fillColor('#333')
    for (const r of data.requirements) {
      doc.text(`  [v${r.version}] ${r.title}  —  ${r.status}`)
    }
    doc.moveDown(1)
  }

  private releasesSection(doc: PDFKit.PDFDocument, data: ReportData) {
    doc.fontSize(14).fillColor('#000').text('3. Releases').moveDown(0.5)

    if (data.releases.length === 0) {
      doc.fontSize(10).fillColor('#666').text('  No releases.').moveDown(1)
      return
    }

    doc.fontSize(9).fillColor('#333')
    for (const r of data.releases) {
      const deployed = r.deployedAt ? new Date(r.deployedAt).toLocaleDateString('ko-KR') : '—'
      doc.text(`  ${r.version}  |  ${r.status}  |  Deployed: ${deployed}  |  Builds: ${r.buildCount}`)
    }
    doc.moveDown(1)
  }

  private testSection(doc: PDFKit.PDFDocument, data: ReportData) {
    doc.fontSize(14).fillColor('#000').text('4. Test Runs').moveDown(0.5)

    if (data.testRuns.length === 0) {
      doc.fontSize(10).fillColor('#666').text('  No test runs.').moveDown(1)
      return
    }

    doc.fontSize(9).fillColor('#333')
    for (const t of data.testRuns) {
      doc.text(`  ${t.status}  —  ${new Date(t.createdAt).toLocaleString('ko-KR')}`)
    }
    doc.moveDown(1)
  }

  private footer(doc: PDFKit.PDFDocument, data: ReportData) {
    doc
      .moveDown(2)
      .fontSize(8)
      .fillColor('#999')
      .text(
        `AI-Powered Software Development Agency Platform — Report ID: ${data.project.id}`,
        { align: 'center' },
      )
  }
}
