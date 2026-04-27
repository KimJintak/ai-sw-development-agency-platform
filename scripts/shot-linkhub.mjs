import puppeteer from 'puppeteer'
const BASE = 'http://localhost:3000'
const SHOTS = '/tmp/screenshots'

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

async function ensureDemo() {
  await page.evaluate(() => {
    localStorage.setItem('demo-mode', 'true')
    localStorage.setItem('theme-preference', 'light')
    document.documentElement.classList.remove('dark')
  })
}

await ensureDemo()

await page.goto(`${BASE}/projects/demo-proj-001`, { waitUntil: 'networkidle2', timeout: 30000 })
await ensureDemo()
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 3500))
await page.screenshot({ path: `${SHOTS}/60-project-linkhub.png`, fullPage: false })
console.log('✓ 60-project-linkhub')
await page.screenshot({ path: `${SHOTS}/61-project-credentials.png`, fullPage: true })
console.log('✓ 61-project-credentials')

await browser.close()
