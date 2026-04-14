import Link from 'next/link'
import { scenarios } from '@/lib/demo/scenarios'
import { PlayCircle, Clock, ListChecks } from 'lucide-react'

export default function DemoIndexPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Demo Tour</h1>
        <p className="text-muted-foreground">
          실제 동작을 시뮬레이션으로 미리 체험해보세요. 각 시나리오는 가상 데이터로
          재생되며, 실제 프로젝트에는 영향을 주지 않습니다.
        </p>
      </div>

      <div className="grid gap-4">
        {scenarios.map((s) => (
          <Link
            key={s.id}
            href={`/demo/${s.id}`}
            className="block p-6 rounded-lg border bg-card hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-md bg-primary/10 text-primary">
                <PlayCircle size={24} />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">{s.title}</h2>
                <p className="text-sm text-muted-foreground mb-3">{s.summary}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {Math.round(s.durationMs / 1000)}초
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks size={12} />
                    {s.steps.length}개 단계
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
