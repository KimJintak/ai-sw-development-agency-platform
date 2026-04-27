import puppeteer from 'puppeteer'
const BASE = 'http://localhost:3000'
const SHOTS = '/tmp/screenshots'
const PROJECT_ID = 'cmo6gazej0009pdxuf6z5n2zk'

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

// PR detail (light)
await page.goto(`${BASE}/projects/${PROJECT_ID}/source/pr/1`, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 4000))
await page.screenshot({ path: `${SHOTS}/40-pr-detail-light.png`, fullPage: true })
console.log('✓ 40-pr-detail-light')

// Source with PR (light)
await page.goto(`${BASE}/projects/${PROJECT_ID}/source`, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 3000))
await page.screenshot({ path: `${SHOTS}/41-source-with-pr.png`, fullPage: false })
console.log('✓ 41-source-with-pr')

// Chat with bot message (light)
await page.goto(`${BASE}/projects/${PROJECT_ID}/chat`, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 3000))
await page.screenshot({ path: `${SHOTS}/42-chat-with-bot.png`, fullPage: false })
console.log('✓ 42-chat-with-bot')

await browser.close()
console.log('Done')
