'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Check, Globe, Palette } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { LOCALES, type Locale } from '@/lib/i18n/translations'

export default function SettingsPage() {
  const { locale, setLocale, t } = useI18n()
  const [toast, setToast] = useState<string | null>(null)

  const handlePick = (next: Locale) => {
    setLocale(next)
    setToast(t('settings.saved'))
    setTimeout(() => setToast(null), 1500)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <section className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Globe size={18} className="mt-0.5 text-primary" />
          <div className="flex-1">
            <h2 className="font-semibold">{t('settings.language')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.languageDesc')}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {LOCALES.map(({ code, label, nativeLabel }) => {
            const active = code === locale
            return (
              <button
                key={code}
                onClick={() => handlePick(code)}
                className={`flex items-center justify-between px-4 py-3 rounded-md border text-left transition-colors ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div>
                  <div className="font-medium text-sm">{nativeLabel}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
                {active && <Check size={16} className="text-primary" />}
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-start gap-3">
          <Palette size={18} className="mt-0.5 text-primary" />
          <div>
            <h2 className="font-semibold">{t('settings.appearance')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.appearanceDesc')}</p>
          </div>
        </div>
      </section>

      <Link
        href="/settings/manual"
        className="group flex items-start gap-3 rounded-lg border bg-card p-5 hover:bg-muted/40 transition-colors"
      >
        <BookOpen size={18} className="mt-0.5 text-primary" />
        <div className="flex-1">
          <h2 className="font-semibold flex items-center gap-1.5 group-hover:text-primary transition-colors">
            {t('settings.manual')}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </h2>
          <p className="text-sm text-muted-foreground">{t('settings.manualDesc')}</p>
        </div>
        <span className="self-center text-xs text-primary font-medium shrink-0">
          {t('settings.manualOpen')}
        </span>
      </Link>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-4 py-2 rounded-md shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
