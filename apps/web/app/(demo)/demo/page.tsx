import Link from 'next/link'
import { scenarios } from '@/lib/demo/scenarios'
import {
  PlayCircle,
  Clock,
  ListChecks,
  Sparkles,
  MousePointerClick,
  Rewind,
  ArrowRight,
} from 'lucide-react'

export default function DemoIndexPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Sparkles size={12} className="text-primary" />
          <span>DEMO TOUR</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">플랫폼 체험 투어</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          실제 동작을 시뮬레이션으로 미리 체험해보세요. 각 시나리오는 가상 데이터로 재생되며,
          실제 프로젝트에는 영향을 주지 않습니다.
        </p>
      </div>

      <section className="mb-8 rounded-xl border bg-gradient-to-br from-primary/5 to-violet-500/5 p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <MousePointerClick size={16} className="text-primary" />
          데모를 사용하는 방법
        </h2>
        <ol className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            {
              n: '1',
              title: '시나리오 선택',
              body: '아래 카드에서 살펴보고 싶은 흐름을 클릭합니다.',
            },
            {
              n: '2',
              title: '재생 & 속도 조절',
              body: '재생 버튼을 누르면 단계별 화면이 자동으로 채워집니다. 0.5×~4× 속도 변경 가능.',
            },
            {
              n: '3',
              title: '타임라인 이동',
              body: '우측 타임라인에서 원하는 단계를 클릭해 즉시 이동할 수 있습니다.',
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-3">
              <div className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {step.n}
              </div>
              <div>
                <div className="font-medium mb-0.5">{step.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{step.body}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <Rewind size={12} />
          <span>언제든 되돌리기 · 반복 재생이 가능합니다. 아무것도 실제 서버에 전송되지 않습니다.</span>
        </div>
      </section>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        시나리오 ({scenarios.length})
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {scenarios.map((s) => (
          <Link
            key={s.id}
            href={`/demo/${s.id}`}
            className="group block p-5 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <PlayCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 flex items-center gap-1.5 group-hover:text-primary transition-colors">
                  {s.title}
                  <ArrowRight
                    size={14}
                    className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  />
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.summary}</p>
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
