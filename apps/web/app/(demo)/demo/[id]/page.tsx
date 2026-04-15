'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { scenarios } from '@/lib/demo/scenarios'
import { DemoPlayer } from '@/components/demo/demo-player'

export default function DemoScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const scenario = scenarios.find((s) => s.id === id)
  if (!scenario) notFound()

  return <DemoPlayer scenario={scenario} />
}
