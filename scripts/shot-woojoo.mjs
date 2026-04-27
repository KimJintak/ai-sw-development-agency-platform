import puppeteer from 'puppeteer'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const SHOTS = '/tmp/screenshots'

const idsFile = fs.readFileSync('/tmp/woojoo-ids.sh', 'utf8')
const projectId = idsFile.match(/PROJECT_ID=(\S+)/)[1]

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 })
await page.type('input[type="email"]', 'admin@agency.dev')
await page.type('input[type="password"]', 'admin1234!')
await page.click('button[type="submit"]')
await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
await new Promise(r => setTimeout(r, 2000))

// Light, real data (no demo mode)
await page.evaluate(() => {
  localStorage.setItem('theme-preference', 'light')
  localStorage.removeItem('demo-mode')
  document.documentElement.classList.remove('dark')
})

await page.goto(`${BASE}/projects/${projectId}`, { waitUntil: 'networkidle2', timeout: 30000 })
await page.evaluate(() => localStorage.removeItem('demo-mode'))
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 4000))

await page.screenshot({ path: `${SHOTS}/80-woojoo-crm.png`, fullPage: false })
console.log('✓ 80-woojoo-crm (viewport)')

await page.screenshot({ path: `${SHOTS}/81-woojoo-crm-full.png`, fullPage: true })
console.log('✓ 81-woojoo-crm-full')

// Click preview on Woojoo CRM Prototype (Figma site) — should actually render
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button[title="미리보기 (iframe)"]'))
  // Find the prototype one (second or third card depending on sort)
  for (const b of btns) {
    const card = b.closest('li')
    if (card && /Prototype/i.test(card.textContent || '')) { b.click(); return }
  }
  if (btns[0]) btns[0].click()
})
await new Promise(r => setTimeout(r, 6000))
await page.screenshot({ path: `${SHOTS}/82-woojoo-preview.png`, fullPage: false })
console.log('✓ 82-woojoo-preview')

await browser.close()
