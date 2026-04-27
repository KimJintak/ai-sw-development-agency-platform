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

await page.evaluate(() => {
  localStorage.setItem('demo-mode', 'true')
  localStorage.setItem('theme-preference', 'light')
  document.documentElement.classList.remove('dark')
})

await page.goto(`${BASE}/projects/demo-proj-001`, { waitUntil: 'networkidle2', timeout: 30000 })
await page.evaluate(() => localStorage.setItem('demo-mode', 'true'))
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 3500))

// Find the first Eye button (preview) in the link hub and click it
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button[title="미리보기 (iframe)"]'))
  if (btns.length > 0) btns[0].click()
})
await new Promise(r => setTimeout(r, 3500))
await page.screenshot({ path: `${SHOTS}/70-preview-modal.png`, fullPage: false })
console.log('✓ 70-preview-modal')

await browser.close()
